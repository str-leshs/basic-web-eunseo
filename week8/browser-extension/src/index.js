// form fields
const form = document.querySelector('.form-data');
const region = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');

// results
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

// 이벤트 리스너
form.addEventListener('submit', (e) => handleSubmit(e));
clearBtn.addEventListener('click', (e) => reset(e));
init();

// reset 함수
function reset(e) {
  e.preventDefault();
  localStorage.removeItem('regionName');
  localStorage.removeItem('apiKey');
  init();
}

// init 함수
function init() {
  const storedApiKey = localStorage.getItem('apiKey');
  const storedRegion = localStorage.getItem('regionName');

  //set icon to be generic green
  //todo
  
  if (storedApiKey === null || storedRegion === null) {
    form.style.display = 'block';
    results.style.display = 'none';
    loading.style.display = 'none';
    clearBtn.style.display = 'none';
    errors.textContent = '';
  } else {
    displayCarbonUsage(storedApiKey, storedRegion);
    results.style.display = 'none';
    form.style.display = 'none';
    clearBtn.style.display = 'block';
  }
}

// handleSubmit 함수
function handleSubmit(e) {
  e.preventDefault();
  setUpUser(apiKey.value, region.value);
}

// setUpUser 함수
function setUpUser(apiKey, regionName) {
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('regionName', regionName);
  loading.style.display = 'block';
  errors.textContent = '';
  clearBtn.style.display = 'block';
  displayCarbonUsage(apiKey, regionName);
}

// displayCarbonUsage 함수 (임시)
function displayCarbonUsage(apiKey, regionName) {
  console.log('API Key:', apiKey);
  console.log('Region:', regionName);
  loading.style.display = 'none';
  form.style.display = 'none';
  clearBtn.style.display = 'block';
  results.style.display = 'block';
  
  // 임시 데이터 표시
  myregion.textContent = regionName;
  usage.textContent = '292 grams (grams CO2 emitted per kilowatt hour)';
  fossilfuel.textContent = '55.41% (percentage of fossil fuels used to generate electricity)';
}