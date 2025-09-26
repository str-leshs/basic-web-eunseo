// 플레이어와 딜러의 카드 합계가 21을 넘으면 Bust (패배).
// 플레이어가 21점을 달성하면 블랙잭 (즉시 승리).
// 딜러는 17점 이상일 때 멈춰야 하고, 그 이하일 때는 추가 카드를 뽑아야 함.
// 카드 합계가 같은 경우 무승부 (Draw).
// 21점을 초과한 쪽이 무조건 패배.

//숫자 카드 2~10, 그림 카드(J, Q, K)는 10, 에이스(A)는 1 or 10
function randCard(){
  return Math.floor(Math.random()*10 +1);
}

let cardOne = randCard();
let cardTwo = randCard();
let sum = cardOne + cardTwo;

let cardOneBank = randCard();
let cardTwoBank = randCard();
let bankSum = cardOneBank + cardTwoBank;

let cardThree = randCard();
sum += cardThree;

console.log(`You have ${sum} points`);

if (sum === 21 && (cardOne + cardTwo === 21)) {
  console.log('You win');
}else if (sum > 21) {
  console.log('You lose');
} 

//플레이어가 21점 이하인 경우
else {
    if (bankSum < 17) {
      let cardThreeBank = randCard();
      bankSum += cardThreeBank;
        
        if (bankSum < 17) {
          let cardFourBank = randCard();
          bankSum += cardFourBank;
        }
    }
    
    
    if (bankSum > 21) {
      console.log('You win');
    } else if (bankSum === 21 && (cardOneBank + cardTwoBank === 21)) {
      console.log('You lose');
    } else if (sum > bankSum) {
      console.log('You win');
    } else if (sum < bankSum) {
      console.log('You lose');
    } else {
      console.log('Draw');
    }
}