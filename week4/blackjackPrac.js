// 플레이어와 딜러의 카드 합계가 21을 넘으면 Bust (패배).
// 플레이어가 21점을 달성하면 블랙잭 (즉시 승리).
// 딜러는 17점 이상일 때 멈춰야 하고, 그 이하일 때는 추가 카드를 뽑아야 함.
// 카드 합계가 같은 경우 무승부 (Draw).
// 21점을 초과한 쪽이 무조건 패배.

let cardOne = 7;
let cardTwo = 5;
let sum = cardOne + cardTwo;

let cardOneBank = 7;
let cardTwoBank = 5;
let bankSum = cardOneBank + cardTwoBank;

let cardThree = 7;
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
      let cardThreeBank = 6;
      bankSum += cardThreeBank;
        
        if (bankSum < 17) {
          let cardFourBank = 4;
          bankSum += cardFourBank;
        }
    }
    
    
    if (bankSum > 21) {
      console.log('You win');
    } 
    else if (bankSum === 21 && (cardOneBank + cardTwoBank === 21)) {
      console.log('You lose');
    }
    else if (sum > bankSum) {
      console.log('You win');
    } else if (sum < bankSum) {
      console.log('You lose');
    } 
    else {
      console.log('Draw');
    }
}