"use server";

export async function getWeather(lat: string, lon: string, lang: string = "en") {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenWeather API key not configured");
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${lang}`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        location: data.name,
      },
      formatted: `Current weather in ${data.name}: ${data.weather[0].description}, Temperature: ${Math.round(data.main.temp)}°C, Humidity: ${data.main.humidity}%, Wind Speed: ${data.wind.speed} m/s`,
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch weather",
    };
  }
}
