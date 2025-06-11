// I Select necessary DOM elements
const selectElement = document.querySelector('.js-select');           // Dropdown input for selecting location/town
const buttonElement = document.querySelector('.js-button');           // Button to trigger weather fetch
const weatherInfo = document.querySelector('.js-weather-info');       // Container to display weather results
const unitToggleButton = document.querySelector('.js-unit-toggle');   // Button to toggle between °C and °F

// This is my OpenWeatherMap API key
const apiKey = "617168c98b947f07b6c31f9938117583";

// The default temperature unit (Celsius)
let currentUnit = "metric";

// I added the feature of toggling between metric (°C) and imperial (°F) units when the unit button is clicked
unitToggleButton.addEventListener('click', () => {
  if (currentUnit === "metric") {
    currentUnit = "imperial";
    unitToggleButton.textContent = "°F";              // This would update button label
    unitToggleButton.style.backgroundColor = "#6c757d"; // Grey background color for Fahrenheit toggling button
  } else {
    currentUnit = "metric";
    unitToggleButton.textContent = "°C";              // This would update button label
    unitToggleButton.style.backgroundColor = "#005cbf"; // Blue background color for Celsius toggling button
  }


// This would automatically reload the weather data with the new unit if a location is selected
const location = selectElement.value.trim();
  if (location) {
    fetchAndDisplayWeather(location, currentUnit);
  }
});

// Trigger fetching weather data when the user clicks the "Search" button
buttonElement.addEventListener('click', () => {
  const location = selectElement.value.trim(); // Get selected town name

  // This would show an error if no location is selected
  if (!location) {
    showError("Please select a town.");
    return;
  }

  fetchAndDisplayWeather(location, currentUnit);
});


// This function fetch both current weather and forecast, then display them
async function fetchAndDisplayWeather(location, unit) {
  try {
    const [currentData, forecastData] = await Promise.all([
      fetchCurrentWeather(location, unit),
      fetchForecast(location, unit)
    ]);
    displayWeather(currentData, forecastData, unit); // Update User Interface (UI)
  } catch (error) {
    showError(error.message); // This shows any errors that occurred during fetching
  }
}


// This async function fetch current weather data from OpenWeatherMap
async function fetchCurrentWeather(location, unit) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location},NG&appid=${apiKey}&units=${unit}`;
  const response = await fetch(apiUrl);

  // This handle common errors
  if (response.status === 404) throw new Error("City not found");
  if (!response.ok) throw new Error("Failed to fetch current weather data.");

  return await response.json(); // Parse and return JSON data
}


// Fetch 5-day forecast data (we extract 4 days from it) from OpenWeatherMap
async function fetchForecast(location, unit) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location},NG&appid=${apiKey}&units=${unit}`;
  const response = await fetch(apiUrl);

  // This if statement is used to handle common errors
  if (response.status === 404) throw new Error("City not found");
  if (!response.ok) throw new Error("Failed to fetch forecast data.");

  return await response.json(); // Parse and return JSON data
}


// This function is used to visualize the current day and time, updating every second
function displayDayTime() {
  const displayElement = document.querySelector('.js-day-time-display');
  const current = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day = days[current.getDay()];
  const time = current.toLocaleTimeString(); // Human-readable time
  displayElement.textContent = `${day}, ${time}`;
}
displayDayTime();
setInterval(displayDayTime, 1000); // Refresh every second


// Display current and forecast weather in the DOM
function displayWeather(current, forecast, unit) {
  const {
    name,
    main: { temp, humidity, pressure },
    weather,
    wind: { speed }
  } = current;

  const description = weather[0].description;
  const weatherId = weather[0].id;
  const emoji = getEmoji(weatherId); // Get emoji/icon for weather
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
  weatherInfo.style.display = "block"; // This make sure it's visible
}


// Extract and display the forecast for 12:00 PM over the next 4 days (Four days forecast)
function generateForecastHTML(forecastList, unitSymbol) {
  const dailyForecasts = {};

  // Pick one forecast per day (12:00:00 only)
  forecastList.forEach(entry => {
    const [date, time] = entry.dt_txt.split(" ");
    if (time === "12:00:00" && !dailyForecasts[date]) {
      dailyForecasts[date] = entry;
    }
  });

  // This part format forecast for each day
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


// Return a suitable emoji based on weather condition ID ---> I fetch this from OpenWeatherMap API as well to enable corresponding weather icons
function getEmoji(weatherId) {
  switch (true) {
    case (weatherId >= 200 && weatherId <= 232): return "⛈️"; // Thunderstorm
    case (weatherId >= 300 && weatherId <= 321): return "🌦️"; // Drizzle
    case (weatherId >= 500 && weatherId <= 531): return "🌧️"; // Rain
    case (weatherId >= 600 && weatherId <= 622): return "❄️"; // Snow
    case (weatherId >= 701 && weatherId <= 781): return "🌫️"; // Fog
    case (weatherId === 800): return "☀️";            // Clear
    case (weatherId === 801): return "🌥️";           // Few clouds
    case (weatherId === 802): return "☁️";            // Scattered clouds
    case (weatherId === 803): return "⛅";             // Broken clouds
    case (weatherId === 804): return "🌤️";           // Overcast clouds
    default: return "❓";                             // Unknown condition
  }
}


// This function would clearly show error messages in the UI
function showError(message) {
  weatherInfo.innerHTML = `<p class="error-message" style="color:red; text-align:center;">${message}</p>`;
  weatherInfo.style.display = "block";
}
