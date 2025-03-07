import { WorkerEntrypoint } from "cloudflare:workers";
import { ProxyToSelf } from "workers-mcp";

export interface Env {
  OPENWEATHERMAP_API_KEY: string;
  SHARED_SECRET: string;
  IPINFO_API_KEY: string;
  GOOGLE_API_KEY: string;
  GOOGLE_CX: string;
}

interface FetchParams {
  headers?: Record<string, string>;
  body?: BodyInit | null;
  [key: string]: any;
}

export default class MyWorker extends WorkerEntrypoint<Env> {
  /**
   *Get weather data direclty from claude
   * @param cityName {string} the name of the city from where we need the weather.
   * @returns {string} the weather for the respective city
   */
  async getWeatherData(cityName: string): Promise<string> {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${this.env.OPENWEATHERMAP_API_KEY}&units=metric`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Weather data not found");
      }

      const data: any = await response.json();
      const temperature = data.main.temp;
      const description = data.weather[0].description;

      return `Current weather in ${cityName}: ${temperature}°C, ${description}`;
    } catch (error: any) {
      return `Error fetching weather data: ${error.message}`;
    }
  }
  /**
   * Get IP address details of the client
   * @param ipAddr {string} is the ip addr whose details we wanna get if we want to get self ip details ipAddr will be "me"
   * @returns {string} A string containing IP information
   */
  async getIpDetails(ipAddr: string): Promise<string> {
    try {
      const targetURL =
        ipAddr === "me"
          ? `https://api.ipgeolocation.io/ipgeo?apiKey=${this.env.IPINFO_API_KEY}`
          : `https://api.ipgeolocation.io/ipgeo?apiKey=${this.env.IPINFO_API_KEY}&ip=${ipAddr}`;

      const response = await fetch(targetURL);

      if (!response.ok) {
        throw new Error("Failed to fetch IP");
      }

      const data: any = await response.json();

      let result = "";
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (value !== "" && value !== false) {
          if (typeof value === "object" && value !== null) {
            result += `ip details ${key} - ${JSON.stringify(value)}\n`;
          } else {
            result += `ip details ${key} - ${value}\n`;
          }
        }
      });

      return result;
    } catch (error: any) {
      return `Error fetching IP: ${error.message}`;
    }
  }

  /**
   * Perform a web search using Google Custom Search JSON API
   * @param query {string} the search query to send to Google
   * @param num {number} optional number of results (1-10, defaults to 5)
   * @returns {string} the entire JSON response from Google as a string
   */

  async googleWebSearch(query: string, num: number = 5): Promise<string> {
    // Ensure num is between 1 and 10 (Google's API limit)
    const resultCount = Math.min(Math.max(num, 1), 10);
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${
      this.env.GOOGLE_API_KEY
    }&cx=${this.env.GOOGLE_CX}&q=${encodeURIComponent(
      query
    )}&num=${resultCount}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errData = await response.text();
        throw new Error(
          `Google API error: ${response.status} ${response.statusText} ${errData}`
        );
      }

      const data = await response.json();
      // Return the entire JSON as a string
      return JSON.stringify(data);
    } catch (error: any) {
      return `Error fetching Google search results: ${error.message}`;
    }
  }

  /**
   * Makes a generic HTTP fetch request to a specified URL with a given method and optional parameters.
   * This allows Claude to request data from any URL, with full control over method and fetch options.
   * @param url - The URL{string} to fetch (e.g., "https://api.example.com/data").
   * @param method - The HTTP{string} method to use (e.g., "GET", "POST", "PUT"), case-insensitive.
   * @param params - Optional fetch{FetchParams} parameters like headers or body (defaults to an empty object).
   * @returns {string}A string containing the raw response text from the URL, or an error message if the request fails.
   */
  async makeRequest(
    url: string,
    method: string,
    params: FetchParams = {}
  ): Promise<string> {
    try {
      const fetchParams = { ...params };

      // If body exists and is not already a string, stringify it
      if (params.body && typeof params.body === "object") {
        fetchParams.body = JSON.stringify(params.body);
      }

      // Make the fetch request with the specified URL, method, and params
      const response: Response = await fetch(url, {
        method: method.toUpperCase(),
        ...fetchParams,
      });

      // Check if the response is successful (status 200-299)
      if (!response.ok) {
        const errData = await response.text();
        throw new Error(
          `Request failed: ${response.status} ${errData} ${response.statusText}`
        );
      }

      // Return the raw text response from the URL
      return await response.text();
    } catch (error: unknown) {
      // Return a stringified error message if the request fails
      return `Error making request: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(request);
  }
}
