#!/usr/bin/env node --experimental-strip-types
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  initAuth,
  getSubscription,
  listSubscriptions,
  listSubscriptionEntries,
  searchAccounts,
  getAccount,
  listEvents,
  getEvent,
} from "./fastspring-api.ts";

// --- Init auth from env ---
const username = process.env.FASTSPRING_API_USERNAME;
const password = process.env.FASTSPRING_API_PASSWORD;

if (!username || !password) {
  console.error("Missing FASTSPRING_API_USERNAME or FASTSPRING_API_PASSWORD env vars");
  process.exit(1);
}

initAuth(username, password);

// --- Create server ---
const server = new McpServer({
  name: "fastspring",
  version: "1.0.0",
});

// --- Helper to format tool responses ---
function ok(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

// --- Register tools ---

server.tool(
  "get_subscription",
  "Get full subscription details by FastSpring subscription ID. Returns status, product, next charge date, pricing, account, and tags (referrer = LinkStorm user ID).",
  { subscriptionId: z.string().describe("FastSpring subscription ID") },
  async ({ subscriptionId }) => {
    try {
      return ok(await getSubscription(subscriptionId));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "list_subscriptions",
  "List subscriptions with optional filters. Use accountId to find all subs for a customer.",
  {
    accountId: z.string().optional().describe("FastSpring account ID"),
    status: z.enum(["active", "canceled", "deactivated", "overdue", "trial"]).optional().describe("Subscription status filter"),
    begin: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    end: z.string().optional().describe("End date (YYYY-MM-DD)"),
    limit: z.number().min(1).max(100).optional().default(25).describe("Max results (default 25, max 100)"),
  },
  async (filters) => {
    try {
      return ok(await listSubscriptions(filters));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "list_subscription_entries",
  "Get charge/payment history for a subscription. Shows successful charges, failed payments, refunds. Use to distinguish voluntary churn (canceled) from involuntary churn (payment failure).",
  { subscriptionId: z.string().describe("FastSpring subscription ID") },
  async ({ subscriptionId }) => {
    try {
      return ok(await listSubscriptionEntries(subscriptionId));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "search_accounts",
  "Search FastSpring accounts by email. This is the entry point for debugging — you typically start from a customer email, not a FastSpring ID.",
  { email: z.string().describe("Customer email to search for") },
  async ({ email }) => {
    try {
      return ok(await searchAccounts(email));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_account",
  "Get full account details by FastSpring account ID. Returns email, name, address, and associated subscriptions.",
  { accountId: z.string().describe("FastSpring account ID") },
  async ({ accountId }) => {
    try {
      return ok(await getAccount(accountId));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "list_events",
  "List FastSpring webhook events. Use for webhook gap analysis — comparing what FastSpring sent vs what Symfony processed. Note: 'processed' means delivered to your endpoint, NOT successfully handled by your code.",
  {
    days: z.number().min(1).max(30).optional().default(7).describe("Number of days to look back (max 30, default 7)"),
    type: z.string().optional().describe("Event type filter, e.g. 'subscription.deactivated', 'subscription.activated'"),
  },
  async (filters) => {
    try {
      return ok(await listEvents(filters));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_event",
  "Get full webhook event payload by event ID. Use after list_events to inspect the complete data FastSpring sent.",
  { eventId: z.string().describe("FastSpring event ID") },
  async ({ eventId }) => {
    try {
      return ok(await getEvent(eventId));
    } catch (e) {
      return err(e);
    }
  }
);

// --- Start server ---
const transport = new StdioServerTransport();
await server.connect(transport);
