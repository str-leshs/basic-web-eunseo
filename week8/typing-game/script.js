const quotes = [
  'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
  'There is nothing more deceptive than an obvious fact.',
  'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
  'I never make exceptions. An exception disproves the rule.',
  'What one man can invent another can discover.',
  'Nothing clears up a case so much as stating it to another person.',
  'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
];

let words = [];
let wordIndex = 0;
let startTime = Date.now();

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');

document.getElementById('start').addEventListener('click', () => {
  const quoteIndex = Math.floor(Math.random() * quotes.length);  
  const quote = quotes[quoteIndex]; // 위에서 돌린 랜덤 인덱스 값으로 인용문 선택

  words = quote.split(' '); 
  wordIndex = 0;  //초기화하고 

  const spanWords = words.map(function(word) { return `<span>${word} </span>` }); //span 태그로 감싼 후 배열에 저장한다. 
  quoteElement.innerHTML = spanWords.join('');  // 하나의 문자열로 결합 및 설정
  quoteElement.childNodes[0].className = 'highlight';   // 첫 단어 하이라이트 

  messageElement.innerText = '';  // 메시지 요소 초기화 
  typedValueElement.value = ''; // 입력 필드 초기화 
  typedValueElement.focus();  //포커스 설정 
  startTime = new Date().getTime(); //타이필 시작 시간 기록 
});


typedValueElement.addEventListener('input', () => {
  const currentWord = words[wordIndex];
  const typedValue = typedValueElement.value; //입력값 저장 

  if (typedValue === currentWord && wordIndex === words.length - 1) { // 마지막 단어까지 정확히 입력했는지 체크하기 
  const elapsedTime = new Date().getTime() - startTime;   // 타이핑 소요 시간 계산 
  const message = `CONGRATULATIONS! You finished in ${elapsedTime / 1000} seconds.`;
  messageElement.innerText = message; 
  } 
  
  else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) { //입력값 공백으로 끝났는지, 공백 제거한 값이 현재 단어와 일치하는지 확인 
  typedValueElement.value = ''; // 입력 필드 초기화 -> 다음 입력 준비 
  wordIndex++;

  for (const wordElement of quoteElement.childNodes) {  // 모든 강조 표시 제거
  wordElement.className = '';
  }

  quoteElement.childNodes[wordIndex].className = 'highlight'; //다음 타이핑 단어에 클래스 추가 
  }

  else if (currentWord.startsWith(typedValue)) {  // 현재 단어 일부를 맞게 입력하고있는지 확인 
  typedValueElement.className = ''; //맞으면 클래스 제거 
  } 
  
  else {  
  typedValueElement.className = 'error';  //틀리면 에러 클래스 추가 
  }
});