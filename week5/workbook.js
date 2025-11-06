// 6주차 과제: Drag and Drop API 활용
let maxZIndex = 2;

const plants = document.querySelectorAll('.plant');
const dropArea = document.querySelector('.jar-walls');

plants.forEach(plant => {
  plant.setAttribute('draggable', 'true');

  plant.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  });

  plant.addEventListener('dragend', (e) => {
    e.target.style.opacity = '1';
  });

  // 더블클릭으로 z-index 변경
  plant.addEventListener('dblclick', function() {
    let currentZIndex = parseInt(window.getComputedStyle(this).zIndex) || 2;
    this.style.zIndex = currentZIndex >= 10 ? 2 : currentZIndex + 1;
  });
});

dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();

  const plantId = e.dataTransfer.getData('text/plain');
  const plant = document.getElementById(plantId);

  if (!plant) return;

  // z-index 업데이트
  maxZIndex++;
  plant.style.zIndex = maxZIndex;

  dropArea.appendChild(plant);
  
  plant.style.position = 'absolute';
  
  const jarRect = dropArea.getBoundingClientRect();
  
  const x = e.clientX - jarRect.left - (plant.offsetWidth / 2);
  const y = e.clientY - jarRect.top - (plant.offsetHeight / 2);
  
  plant.style.left = `${x}px`;
  plant.style.top = `${y}px`;
});