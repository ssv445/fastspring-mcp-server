# FastSpring MCP Server

MCP server that connects Claude (or any MCP client) to the FastSpring API. Look up subscriptions, accounts, and webhook events through natural language.

## Tools

| Tool | Description |
|------|-------------|
| `get_subscription` | Get subscription details by ID |
| `list_subscriptions` | List/filter subscriptions by account, status, date range |
| `list_subscription_entries` | Payment history for a subscription |
| `search_accounts` | Find accounts by email |
| `get_account` | Get account details by ID |
| `list_events` | List webhook events (up to 30 days) |
| `get_event` | Get full event payload by ID |

## Setup

Requires Node.js 22+ and FastSpring API credentials.

Set env vars in your shell profile:

```bash
export FASTSPRING_API_USERNAME=your_username
export FASTSPRING_API_PASSWORD=your_password
```

### Claude Code

```bash
claude mcp add fastspring -- npx fastspring-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fastspring": {
      "command": "npx",
      "args": ["fastspring-mcp"],
      "env": {
        "FASTSPRING_API_USERNAME": "your_username",
        "FASTSPRING_API_PASSWORD": "your_password"
      }
    }
  }
}
```

## License

MIT
