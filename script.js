// DOM Elements
const selectElement = document.querySelector('.js-select');
const buttonElement = document.querySelector('.js-button');
const weatherInfo = document.querySelector('.js-weather-info');
const unitToggleButton = document.querySelector('.js-unit-toggle');

// API Key
const apiKey = "617168c98b947f07b6c31f9938117583";

// Default unit
let currentUnit = "metric";
let weatherChart = null;

// Initialize the app
function init() {
  // Set up event listeners
  unitToggleButton.addEventListener('click', toggleUnit);
  buttonElement.addEventListener('click', handleSearch);
  
  // Display current time
  displayDayTime();
  setInterval(displayDayTime, 1000);
  
  // Load default location if needed
  // fetchAndDisplayWeather("Oye", currentUnit);
}

// Toggle between metric and imperial units
function toggleUnit() {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  unitToggleButton.textContent = currentUnit === "metric" ? "°C" : "°F";
  unitToggleButton.style.backgroundColor = currentUnit === "metric" ? "#005cbf" : "#6c757d";
  
  // Reload weather if location is selected
  const location = selectElement.value.trim();
  if (location) {
    fetchAndDisplayWeather(location, currentUnit);
  }
}

// Handle search button click
function handleSearch() {
  const location = selectElement.value.trim();
  
  if (!location) {
    showError("Please select a town.");
    return;
  }
  
  fetchAndDisplayWeather(location, currentUnit);
}

// Fetch and display weather data
async function fetchAndDisplayWeather(location, unit) {
  try {
    weatherInfo.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    weatherInfo.style.display = "block";
    
    const [currentData, forecastData] = await Promise.all([
      fetchCurrentWeather(location, unit),
      fetchForecast(location, unit)
    ]);
    
    displayWeather(currentData, forecastData, unit);
  } catch (error) {
    showError(error.message);
  }
}

// Fetch current weather
async function fetchCurrentWeather(location, unit) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location},NG&appid=${apiKey}&units=${unit}`;
  const response = await fetch(apiUrl);
  
  if (response.status === 404) throw new Error("Town not found");
  if (!response.ok) throw new Error("Failed to fetch current weather data.");
  
  return await response.json();
}

// Fetch forecast
async function fetchForecast(location, unit) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location},NG&appid=${apiKey}&units=${unit}`;
  const response = await fetch(apiUrl);
  
  if (response.status === 404) throw new Error("Town not found");
  if (!response.ok) throw new Error("Failed to fetch forecast data.");
  
  return await response.json();
}

// Display current time
function displayDayTime() {
  const displayElement = document.querySelector('.js-day-time-display');
  const current = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  displayElement.textContent = current.toLocaleDateString('en-US', options);
}

// Display weather data
function displayWeather(current, forecast, unit) {
  const {
    name,
    main: { temp, humidity, feels_like, temp_min, temp_max, pressure },
    weather,
    wind: { speed },
    dt
  } = current;

  const description = weather[0].description;
  const weatherId = weather[0].id;
  const emoji = getEmoji(weatherId);
  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "m/s" : "mph";
  
  const forecastHTML = generateForecastHTML(forecast.list, unitSymbol);
  const chartHTML = `<div class="chart-container"><canvas id="weatherChart"></canvas></div>`;
  
  weatherInfo.innerHTML = `
    <div class="current-weather">
      <div class="weather-main">
        <h2 class="location">${name}, Ekiti</h2>
        <div class="emoji-description">${emoji}</div>
        <div class="temperature">${temp.toFixed(1)}${unitSymbol}</div>
        <div class="weather-description">${description}</div>
        <div class="feels-like">Feels like: ${feels_like.toFixed(1)}${unitSymbol}</div>
      </div>
      
      
      <div class="weather-details">
        <div class="detail-card">
          <h3>Humidity</h3>
          <div><i class="bi bi-droplet-half" style="font-size:2rem;color:#2196f3;"></i></div>
          <p>${humidity}%</p>
        </div>
        <div class="detail-card">
          <h3>Pressure</h3>
          <div><i class="bi bi-speedometer2" style="font-size:2rem;color:#005cbf;"></i></div>
          <p>${pressure} hPa</p>
        </div>
        <div class="detail-card">
          <h3>Wind Speed</h3>
          <div><i class="bi bi-wind" style="font-size:2rem;color:#2196f3;"></i></div>
          <p>${speed} ${windUnit}</p>
        </div>
        <div class="detail-card">
          <h3>Min Temp</h3>
          <div><i class="bi bi-thermometer-snow" style="font-size:2rem;color:#005cbf;"></i></div>
          <p>${temp_min.toFixed(1)}${unitSymbol}</p>
        </div>
        <div class="detail-card">
          <h3>Max Temp</h3>
          <div><i class="bi bi-thermometer-sun" style="font-size:2rem;color:#e67e22;"></i></div>
          <p>${temp_max.toFixed(1)}${unitSymbol}</p>
        </div>
      </div>

    </div>
    
    ${chartHTML}
    
    <div class="forecast-section">
      <h3 class="section-title">4-Day Forecast</h3>
      <div class="forecast-container">
        ${forecastHTML}
      </div>
    </div>
  `;
  
  weatherInfo.style.display = "block";
  
  // Create temperature chart
  createTemperatureChart(forecast.list, unitSymbol);
}

// Generate forecast HTML
function generateForecastHTML(forecastList, unitSymbol) {
  const dailyForecasts = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect one forecast per day (preferably at 12:00:00)
  forecastList.forEach(entry => {
    const entryDate = new Date(entry.dt_txt);
    entryDate.setHours(0, 0, 0, 0);
    const dateStr = entryDate.toISOString().split("T")[0];

    // Exclude today
    if (entryDate > today && !dailyForecasts[dateStr]) {
      // Prefer 12:00:00, but accept first available
      if (entry.dt_txt.includes("12:00:00") || !Object.values(dailyForecasts).some(e => e.dt_txt.startsWith(dateStr))) {
        dailyForecasts[dateStr] = entry;
      }
    }
  });

  // Get the next 4 days, sorted
  const sortedDates = Object.keys(dailyForecasts).sort().slice(0, 4);

  return sortedDates.map(date => {
    const entry = dailyForecasts[date];
    const dateObj = new Date(entry.dt_txt);
    const day = dateObj.toLocaleDateString(undefined, { weekday: "short" });
    const fullDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const emoji = getEmoji(entry.weather[0].id);
    const description = entry.weather[0].description;

    return `
      <div class="forecast-card">
        <div class="forecast-day">${day}</div>
        <div class="forecast-date">${fullDate}</div>
        <div class="forecast-emoji">${emoji}</div>
        <div class="forecast-temp">${entry.main.temp.toFixed(1)}${unitSymbol}</div>
        <div class="forecast-desc">${description}</div>
      </div>
    `;
  }).join('');
}

// Create temperature chart
function createTemperatureChart(forecastData, unitSymbol) {
  const ctx = document.getElementById('weatherChart').getContext('2d');
  
  // Prepare data for chart
  const labels = [];
  const temps = [];
  const feelsLike = [];
  
  forecastData.forEach(entry => {
    const date = new Date(entry.dt_txt);
    labels.push(date.toLocaleTimeString([], {hour: '2-digit'}));
    temps.push(entry.main.temp);
    feelsLike.push(entry.main.feels_like);
  });
  
  // Destroy previous chart if exists
  if (weatherChart) {
    weatherChart.destroy();
  }
  
  weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperature (${unitSymbol})`,
          data: temps,
          borderColor: 'rgba(0, 92, 191, 1)',
          backgroundColor: 'rgba(0, 92, 191, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: `Feels Like (${unitSymbol})`,
          data: feelsLike,
          borderColor: 'rgba(220, 53, 69, 1)',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Temperature Forecast',
          font: {
            size: 16
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: `Temperature (${unitSymbol})`
          }
        }
      }
    }
  });
}

// Get weather emoji
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

// Show error message
function showError(message) {
  weatherInfo.innerHTML = `<div class="error-message">${message}</div>`;
  weatherInfo.style.display = "block";
}

// Initialize the app
init();
