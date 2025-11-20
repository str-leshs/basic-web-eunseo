const weatherCodeMap = {
  0: { emoji: '☀️', desc: '맑음', type: 'clear' },
  1: { emoji: '🌤️', desc: '대체로 맑음', type: 'clear' },
  2: { emoji: '⛅', desc: '부분적으로 흐림', type: 'cloudy' },
  3: { emoji: '☁️', desc: '흐림', type: 'cloudy' },
  45: { emoji: '🌫️', desc: '안개', type: 'fog' },
  48: { emoji: '🌫️', desc: '짙은 안개', type: 'fog' },
  51: { emoji: '🌧️', desc: '가벼운 이슬비', type: 'rain' },
  53: { emoji: '🌧️', desc: '이슬비', type: 'rain' },
  55: { emoji: '🌧️', desc: '강한 이슬비', type: 'rain' },
  61: { emoji: '🌧️', desc: '약한 비', type: 'rain' },
  63: { emoji: '🌧️', desc: '비', type: 'rain' },
  65: { emoji: '🌧️', desc: '강한 비', type: 'rain' },
  71: { emoji: '❄️', desc: '약한 눈', type: 'snow' },
  73: { emoji: '❄️', desc: '눈', type: 'snow' },
  75: { emoji: '❄️', desc: '강한 눈', type: 'snow' },
  77: { emoji: '🌨️', desc: '진눈깨비', type: 'snow' },
  80: { emoji: '🌦️', desc: '약한 소나기', type: 'rain' },
  81: { emoji: '🌦️', desc: '소나기', type: 'rain' },
  82: { emoji: '⛈️', desc: '강한 소나기', type: 'rain' },
  85: { emoji: '🌨️', desc: '약한 눈보라', type: 'snow' },
  86: { emoji: '🌨️', desc: '눈보라', type: 'snow' },
  95: { emoji: '⛈️', desc: '천둥번개', type: 'rain' },
  96: { emoji: '⛈️', desc: '우박을 동반한 천둥', type: 'rain' },
  99: { emoji: '⛈️', desc: '강한 우박을 동반한 천둥', type: 'rain' }
};

//DOM요소들
const weatherContainer = document.getElementById('weather-container');
const weatherContent = document.getElementById('weather-content');
const loadingDiv = document.getElementById('loading');
const weatherDisplay = document.getElementById('weather-display');
const errorDisplay = document.getElementById('error-display');
const rainContainer = document.getElementById('rain-container');
const snowContainer = document.getElementById('snow-container');

// (33.4996, 126.5312) → "제주시"
// (37.5665, 126.9780) → "서울특별시"

//사용자 위치 가져오기 
/**
 * Geolocation API
 * @returns {Promise<Object>} latitude(위도), longitude(경도) 객체
 */
function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        error => {
          // 위치 권한이 없으면 제주시 좌표 사용
          console.log('Using default location (Jeju)');
          resolve({
            latitude: 33.4996,
            longitude: 126.5312
          });
        }
      );
    } else {
      // Geolocation을 지원하지 않으면 제주시 좌표 사용
      resolve({
        latitude: 33.4996,
        longitude: 126.5312
      });
    }
  });
}

//TODO Open-Meteo API로 날씨 데이터 가져오기
async function fetchWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=Asia/Seoul&forecast_days=1`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('날씨 데이터를 가져올 수 없습니다.');
  }
  
  // JSON 형식으로 파싱하여 반환하도록
  return await response.json();
}

//TODO !!!!반대로 좌표를 도시 이름으로 변환할 것 
async function getLocationName(latitude, longitude) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ko`);
    const data = await response.json();
    
    // 주소에서 도시 이름 추출
    // 우선순위: city → town → village → county
    const address = data.address;
    return address.city || address.town || address.village || address.county || '위치 확인 중';
  } catch (error) {
    return '위치 확인 중';
  }
}

//TODO 비내리는 날씨면 확장 프로그램에서도 비내리게 : 비 애니메이션 동적 생성 
function createRainAnimation() {
  rainContainer.innerHTML = '';
  const numberOfDrops = 50;
  
  for (let i = 0; i < numberOfDrops; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    rainContainer.appendChild(drop);
  }
}

//TDOO 눈도 : 눈 애니메이션 동적 생성 
function createSnowAnimation() {
  snowContainer.innerHTML = '';
  const numberOfFlakes = 30;
  
  for (let i = 0; i < numberOfFlakes; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.textContent = '❄';
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDuration = `${Math.random() * 3 + 3}s`;
    flake.style.animationDelay = `${Math.random() * 5}s`;
    flake.style.fontSize = `${Math.random() * 1 + 0.5}em`;
    snowContainer.appendChild(flake);
  }
}

// Set dynamic background and animations
function setWeatherTheme(weatherCode, isNight) {
  const weather = weatherCodeMap[weatherCode] || weatherCodeMap[0];
  
  // Remove all theme classes
  weatherContainer.className = '';
  rainContainer.classList.remove('active');
  snowContainer.classList.remove('active');
  
  // Set background based on weather and time
  if (isNight && (weather.type === 'clear' || weather.type === 'cloudy')) {
    weatherContainer.classList.add('clear-night');
  } else if (weather.type === 'clear') {
    weatherContainer.classList.add('clear-day');
  } else if (weather.type === 'rain') {
    weatherContainer.classList.add('rain');
    createRainAnimation();
    rainContainer.classList.add('active');
  } else if (weather.type === 'snow') {
    weatherContainer.classList.add('snow');
    createSnowAnimation();
    snowContainer.classList.add('active');
  } else if (weather.type === 'fog') {
    weatherContainer.classList.add('fog');
  } else {
    weatherContainer.classList.add('cloudy');
  }
}

// 날씨 코드와 시간대에 따라 배경색과 애니메이션 설정
function displayWeather(data, locationName) {
  const current = data.current;
  const hourly = data.hourly;
  const weather = weatherCodeMap[current.weather_code] || weatherCodeMap[0];
  
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 19 || currentHour < 6;

  setWeatherTheme(current.weather_code, isNight);

  document.getElementById('location').textContent = `📍 ${locationName}`;
  document.getElementById('weather-emoji').textContent = weather.emoji;
  document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById('weather-desc').textContent = weather.desc;
  document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
  document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°C`;
  

  const hourlyList = document.getElementById('hourly-list');
  hourlyList.innerHTML = '';
  
  for (let i = 0; i < 6; i++) {
    const time = new Date(hourly.time[i]);
    const hour = time.getHours();
    const temp = Math.round(hourly.temperature_2m[i]);
    const code = hourly.weather_code[i];
    const hourWeather = weatherCodeMap[code] || weatherCodeMap[0];
    
    const hourlyItem = document.createElement('div');
    hourlyItem.className = 'hourly-item';
    hourlyItem.innerHTML = `
      <div class="hourly-time">${hour}시</div>
      <div class="hourly-emoji">${hourWeather.emoji}</div>
      <div class="hourly-temp">${temp}°C</div>
    `;
    hourlyList.appendChild(hourlyItem);
  }
  
  loadingDiv.classList.add('hidden');
  weatherDisplay.classList.remove('hidden');
  errorDisplay.classList.add('hidden');
}

//API호출 실패 예외처리 -> 오류메시지 띄움
function showError(message) {
  document.getElementById('error-message').textContent = `⚠️ ${message}`;
  loadingDiv.classList.add('hidden');
  weatherDisplay.classList.add('hidden');
  errorDisplay.classList.remove('hidden');
}

//날씨 정보 로드 
async function loadWeather() {
  try {
    loadingDiv.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    errorDisplay.classList.add('hidden');
    
    const location = await getLocation();
    const weatherData = await fetchWeather(location.latitude, location.longitude);
    const locationName = await getLocationName(location.latitude, location.longitude);
    
    displayWeather(weatherData, locationName);
  } catch (error) {
    console.error('Weather error:', error);
    showError(error.message || '날씨 정보를 가져올 수 없습니다.');
  }
}

document.getElementById('refresh-btn').addEventListener('click', loadWeather);
document.getElementById('retry-btn').addEventListener('click', loadWeather);

loadWeather();