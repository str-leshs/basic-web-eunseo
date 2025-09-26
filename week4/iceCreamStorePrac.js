// 가장 많이 팔린 아이스크림 맛 찾아서 출력하기
// Object.keys() 메서드를 사용

let iceCreamFlavors = [
  { name: "Chocolate", type: "Chocolate", price: 2 },
  { name: "Strawberry", type: "Fruit", price: 1 },
  { name: "Vanilla", type: "Vanilla", price: 2 },
  { name: "Pistachio", type: "Nuts", price: 1.5 },
  { name: "Neapolitan", type: "Chocolate", price: 2},
  { name: "Mint Chip", type: "Chocolate", price: 1.5 },
  { name: "Raspberry", type: "Fruit", price: 1},
];

// { scoops: [], total: }
let transactions = []

// { scoops: [], total: }
transactions.push({ scoops: ["Chocolate", "Vanilla", "Mint Chip"], total: 5.5 })
transactions.push({ scoops: ["Raspberry", "StrawBerry"], total: 2 })
transactions.push({ scoops: ["Vanilla", "Vanilla"], total: 4 })

// 수익 계산
const total = transactions.reduce((acc, curr) => acc + curr.total, 0);
console.log(`You've made ${total} $ today`); 

// 각 맛의 판매량
let flavorDistribution = transactions.reduce((acc, curr) => {
  curr.scoops.forEach(scoop => {
  if (!acc[scoop]) {
  acc[scoop] = 0;
  }
  acc[scoop]++;
  })
  return acc;
}, {})
console.log(flavorDistribution);


// 아이스크림 이름으로 배열 만들고, 배열 첫 번째 값으로 초기화 해놓고
const flavorNames = Object.keys(flavorDistribution);
let mostSold = flavorNames[0]; 
let maxCount = flavorDistribution[mostSold]; 

// 가장 많이 팔린 아이스크림 맛 찾기
flavorNames.forEach(flavor => {
  if (flavorDistribution[flavor] > maxCount) {
    maxCount = flavorDistribution[flavor];
    mostSoldFlavor =flavor;
  }
});
console.log(`가장 많이 팔린 아이스크림은 ${mostSoldFlavor}맛!`);
