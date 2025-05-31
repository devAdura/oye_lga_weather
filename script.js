const selectElement = document.querySelector('.js-select');
    const buttonElement = document.querySelector('.js-button');
    const weatherInfo = document.querySelector('.js-weather-info');
    const unitToggleButton = document.querySelector('.js-unit-toggle');
    const apiKey = "617168c98b947f07b6c31f9938117583";

    let currentUnit = "metric"; // default  

    unitToggleButton.addEventListener('click', () => {
    if (currentUnit === "metric") {
      currentUnit = "imperial";
      unitToggleButton.textContent = "°F";
      unitToggleButton.style.backgroundColor = "#6c757d"; // grey for Fahrenheit
    } else {
      currentUnit = "metric";
      unitToggleButton.textContent = "°C";
      unitToggleButton.style.backgroundColor = "#005cbf"; // blue for Celsius
    }

    const location = selectElement.value.trim();
    if (location) {
      // Automatically reload weather for current location with new unit
      fetchAndDisplayWeather(location, currentUnit);
    }
  });

  buttonElement.addEventListener('click', () => {
    const location = selectElement.value.trim();

    if (!location) {
      showError("Please select a town.");
      return;
    }

    fetchAndDisplayWeather(location, currentUnit);
  });

  async function fetchAndDisplayWeather(location, unit) {
    try {
      const [currentData, forecastData] = await Promise.all([
        fetchCurrentWeather(location, unit),
        fetchForecast(location, unit)
      ]);
      displayWeather(currentData, forecastData, unit);
    } catch (error) {
      showError(error.message);
    }
  }

    async function fetchCurrentWeather(location, unit) {
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location},NG&appid=${apiKey}&units=${unit}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Current weather data could not be retrieved.");
      return await response.json();
    }

    async function fetchForecast(location, unit) {
      const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location},NG&appid=${apiKey}&units=${unit}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("4-day forecast data could not be retrieved.");
      return await response.json();
    }

    function displayDayTime() {
      const displayElement = document.querySelector('.js-day-time-display');
      const current = new Date();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const day = days[current.getDay()];
      const time = current.toLocaleTimeString();
      displayElement.textContent = `${day}, ${time}`;
    }
    displayDayTime();
    setInterval(displayDayTime, 1000);

    function displayWeather(current, forecast, unit) {
      const {
        name,
        main: { temp, humidity, pressure },
        weather,
        wind: { speed }
      } = current;

      const description = weather[0].description;
      const weatherId = weather[0].id;
      const emoji = getEmoji(weatherId);
      const unitSymbol = unit === "metric" ? "°C" : "°F";

      const forecastHTML = generateForecastHTML(forecast.list, unitSymbol);

      weatherInfo.innerHTML = `
        <p class="day-time js-day-time-display"></p>
        <p class="location">${name}-Ekiti</p>
        <p class="temperature">Temperature: ${temp.toFixed(1)}${unitSymbol}</p>
        <p class="weather-description">${description}</p>
        <p class="emoji-description">${emoji}</p>
        <div class="others1">Humidity: ${humidity}%</div>
        <div class="others1">Pressure: ${pressure} hpa</div>
        <div class="others1">Wind Speed: ${speed} m/s</div>
        <h2 style="text-align:center; color:hsl(0, 0%, 30%)">4-Days Forecast</h2>
        <div class="forecast-container" style="display:flex; flex-wrap:wrap; justify-content:center;">
          ${forecastHTML}
        </div>
      `;
      weatherInfo.style.display = "block";
    }

    function generateForecastHTML(forecastList, unitSymbol) {
      const dailyForecasts = {};

      forecastList.forEach(entry => {
        const [date, time] = entry.dt_txt.split(" ");
        if (time === "12:00:00" && !dailyForecasts[date]) {
          dailyForecasts[date] = entry;
        }
      });

      return Object.values(dailyForecasts).slice(0, 4).map(entry => {
        const dateObj = new Date(entry.dt_txt);
        const day = dateObj.toLocaleDateString(undefined, { weekday: "short" });
        const fullDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        const emoji = getEmoji(entry.weather[0].id);
        const description = entry.weather[0].description;

        return `
          <div class="others2">
            <p><strong>${day}</strong></p>
            <p>${fullDate}</p>
            <p>${emoji}</p>
            <p style="color: hsl(0, 0%, 30%); font-weight: bold;">${entry.main.temp.toFixed(1)}${unitSymbol}</p>
            <p style="font-style: italic; color: hsl(0, 0%, 30%);">${description}</p>
          </div>
        `;
      }).join('');
    }

    function getEmoji(weatherId) {
      switch (true) {
        case (weatherId >= 200 && weatherId <= 232): return "⛈️";
        case (weatherId >= 300 && weatherId <= 321): return "🌦️";
        case (weatherId >= 500 && weatherId <= 531): return "🌧️";
        case (weatherId >= 600 && weatherId <= 622): return "❄️";
        case (weatherId >= 701 && weatherId <= 781): return "🌫️";
        case (weatherId === 800): return "☀️";
        case (weatherId === 801): return "🌥️";
        case (weatherId === 802): return "☁️";
        case (weatherId === 803): return "⛅";
        case (weatherId === 804): return "🌤️";
        default: return "❓";
      }
    }

    function showError(message) {
      weatherInfo.innerHTML = `<p class="error-message">${message}</p>`;
      weatherInfo.style.display = "block";
    }
