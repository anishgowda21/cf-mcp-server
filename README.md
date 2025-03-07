# MCP-Enabled Cloudflare Worker for Claude

This repository contains a Cloudflare Worker implementing the Model Context Protocol (MCP), which allows Claude to access various external services and APIs directly from your conversations.

## Features

The worker provides the following tools for Claude to use:

- **Weather Information**: Fetch current weather data for any city
- **IP Geolocation**: Look up detailed information about any IP address
- **Web Search**: Perform Google searches with customizable result count
- **HTTP Request Proxy**: Make custom HTTP requests to any endpoint with full control over headers, methods, and body data

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Cloudflare account

### Installation

1. **Install Wrangler CLI**

```
  npm install -g wrangler
```

2. **Log in to Cloudflare**

```
  wrangler login
```

3. **Clone this repository**

```
  git clone https://github.com/anishgowda21/cf-mcp-server.git
  cd cf-mcp-server
```

4. **Install dependencies**

```
  npm install
```

5. **Set up MCP**

```
  npx workers-mcp setup
```

### Configuration

You'll need to set the following environment variables in the Cloudflare Dashboard (recommended for security) instead of in the `wrangler.toml` file:

- `OPENWEATHERMAP_API_KEY` (for weather data)
- `IPINFO_API_KEY` (for IP geolocation)
- `GOOGLE_API_KEY` (for web search)
- `GOOGLE_CX` (for web search)

To do this:

1. Go to the Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings > Variables
5. Add your environment variables under "Environment Variables"

> **Note**: If you don't need a particular service, you can simply not set its API key. The corresponding function will return an error when called, but the rest of the worker will continue to function.

### Deployment

Deploy your worker to Cloudflare:

```
npm run deploy
```

## Usage with Claude

Once deployed, you can use your MCP server with Claude. To do this, simply ask Claude to use your worker for various tasks:

- "Get the weather for Tokyo"
- "Look up information about IP address 8.8.8.8"
- "Search the web for 'latest AI developments'"
- "Make a GET request to https://example.com/api/data"

Claude will automatically use the appropriate function based on your request.

## Function Reference

### `getWeatherData(cityName: string)`

Fetches current weather data for the specified city.

### `getIpDetails(ipAddr: string)`

Retrieves detailed geolocation information for an IP address. Use "me" to get information about the client's IP.

### `googleWebSearch(query: string, num?: number)`

Performs a Google search with the specified query and returns the specified number of results (1-10, default: 5).

### `makeRequest(url: string, method: string, params?: object)`

Makes a custom HTTP request with specified method, headers, and body data. The `params` object can include:

- `headers`: Record of HTTP headers
- `body`: Request body (string or object that will be automatically stringified)

## Customization

To modify the worker or add new functions:

1. Edit `src/index.ts`
2. Add new methods to the `MyWorker` class with JSDoc comments to document the functionality
3. Deploy using `npm run deploy`

## Troubleshooting

- If you encounter issues with API responses, check that you've set up the appropriate environment variables in the Cloudflare Dashboard
- If a specific function isn't working, you might need to obtain the corresponding API key
- For functions you don't need, you can comment out the relevant code in `src/index.ts`
