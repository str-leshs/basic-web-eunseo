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
const startButton = document.getElementById('start');
const modal = document.getElementById('result-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const bestTimeDisplay = document.getElementById('best-time');

// 페이지 로드 시 최고 기록 표시
window.addEventListener('load', () => {
  displayBestScore();
});

// 최고 기록 표시 함수
function displayBestScore() {
  const bestTime = localStorage.getItem('bestTime');
  if (bestTime && bestTimeDisplay) {
    bestTimeDisplay.textContent = bestTime;
  } else if (bestTimeDisplay) {
    bestTimeDisplay.textContent = '--';
  }
}

// 게임 시작
startButton.addEventListener('click', startGame);

function startGame() {
  const quoteIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[quoteIndex];

  words = quote.split(' ');
  wordIndex = 0;

  const spanWords = words.map(word => `<span>${word} </span>`);
  quoteElement.innerHTML = spanWords.join('');
  quoteElement.childNodes[0].className = 'highlight';

  messageElement.innerText = '';
  typedValueElement.value = '';
  typedValueElement.disabled = false;
  typedValueElement.focus();
  typedValueElement.className = '';

  startButton.disabled = true;
  startButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Playing...';
  startTime = new Date().getTime();
}

// Enter키로 게임 시작하기 
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !startButton.disabled && modal && !modal.classList.contains('show')) {
    startGame();
  }
});

// 입력 이벤트 처리
typedValueElement.addEventListener('input', () => {
  const currentWord = words[wordIndex];
  const typedValue = typedValueElement.value;

  // 입력 시작 시 typing 클래스 추가
  if (typedValue.length > 0) {
    typedValueElement.classList.add('typing');
  } else {
    typedValueElement.classList.remove('typing');
  }

  // 마지막 단어까지 정확히 입력 완료
  if (typedValue === currentWord && wordIndex === words.length - 1) {
    finishGame();
  }
  // 현재 단어 완료 (공백 포함)
  else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) {
    // 완성시
    typedValueElement.className = 'perfect';
    
    // 완료된 단어
    quoteElement.childNodes[wordIndex].className = 'completed';
    
    setTimeout(() => {
      typedValueElement.value = '';
      typedValueElement.className = '';
      wordIndex++;
      
      if (wordIndex < words.length) {
        quoteElement.childNodes[wordIndex].className = 'highlight';
      }
    }, 200);
  }
  //올바르게 입력 중
  else if (currentWord.startsWith(typedValue)) {
    typedValueElement.className = 'typing correct-typing';
  }
  //잘못된입력
  else {
    typedValueElement.className = 'typing error';
  }
});

// 게임 완료 처리
function finishGame() {
  const elapsedTime = new Date().getTime() - startTime;
  const seconds = (elapsedTime / 1000).toFixed(2);

  // localStorage에서 최고 기록 가져오기
  const bestTime = localStorage.getItem('bestTime');
  let isNewRecord = false;

  // 최고 기록 갱신 확인
  if (!bestTime || parseFloat(seconds) < parseFloat(bestTime)) {
    localStorage.setItem('bestTime', seconds);
    isNewRecord = true;
    displayBestScore();
  }

  // 입력 필드 비활성화 및 버튼 활성화
  typedValueElement.disabled = true;
  typedValueElement.className = '';
  startButton.disabled = false;
  startButton.innerHTML = '<i class="fa-solid fa-play"></i> Start';

  //모달에 결과 표시
  showResultModal(seconds, localStorage.getItem('bestTime'), isNewRecord);
}

function showResultModal(time, bestTime, isNewRecord) {
  const modalTimeElement = document.getElementById('modal-time');
  const modalBestElement = document.getElementById('modal-best');
  const newRecordBadge = document.getElementById('new-record-badge');

  if (modalTimeElement) modalTimeElement.textContent = `${time}s`;
  if (modalBestElement) modalBestElement.textContent = `${bestTime}s`;

  if (newRecordBadge) {
    if (isNewRecord) {
      newRecordBadge.classList.remove('hidden');
    } else {
      newRecordBadge.classList.add('hidden');
    }
  }

  if (modal) {
    modal.classList.add('show');
  }
}

// 모달 닫기
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });
}
// 모달창 외부 클릭해도 창닫기
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

// 다시 플레이
if (playAgainBtn) {
  playAgainBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    startGame();
  });
}