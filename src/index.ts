import { WorkerEntrypoint } from "cloudflare:workers";
import { ProxyToSelf } from "workers-mcp";

export interface Env {
  OPENWEATHERMAP_API_KEY: string;
  SHARED_SECRET: string;
  IPINFO_API_KEY: string;
}

export default class MyWorker extends WorkerEntrypoint<Env> {
  /**
   *
   * Returns a random playing card
   * @returns {string} the name of random playing card
   */
  getRandomCard(): string {
    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const values = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "Jack",
      "Queen",
      "King",
      "Ace",
    ];

    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];

    return `${randomValue} of ${randomSuit}`;
  }
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

  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(request);
  }
}
