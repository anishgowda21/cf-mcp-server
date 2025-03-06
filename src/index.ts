import { WorkerEntrypoint } from "cloudflare:workers";
import { ProxyToSelf } from "workers-mcp";
import axios from "axios";

export interface Env {
  OPENWEATHERMAP_API_KEY: string;
  SHARED_SECRET: string;
}

export default class WeatherServer extends WorkerEntrypoint<Env> {
  async get_weather(city: string): Promise<string> {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.env.OPENWEATHERMAP_API_KEY}&units=metric`;
    try {
      const response = await axios.get(url);
      const data = response.data;
      const temp = data.main.temp;
      const desc = data.weather[0].description;
      return `${city}: ${temp}°C, ${desc}`;
    } catch (error) {
      return "Couldn't fetch weather data.";
    }
  }

  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(request);
  }
}
