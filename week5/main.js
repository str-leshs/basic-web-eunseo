let maxZIndex = 2;
dragElement(document.getElementById('plant1'));
dragElement(document.getElementById('plant2'));
dragElement(document.getElementById('plant3'));
dragElement(document.getElementById('plant4'));
dragElement(document.getElementById('plant5'));
dragElement(document.getElementById('plant6'));
dragElement(document.getElementById('plant7'));
dragElement(document.getElementById('plant8'));
dragElement(document.getElementById('plant9'));
dragElement(document.getElementById('plant10'));
dragElement(document.getElementById('plant11'));
dragElement(document.getElementById('plant12'));
dragElement(document.getElementById('plant13'));
dragElement(document.getElementById('plant14'));


function dragElement(terrariumElement) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  terrariumElement.onpointerdown = pointerDrag;

  // 더블클릭으로 z-index 변경
  terrariumElement.ondblclick = function() {
    let currentZIndex = parseInt(window.getComputedStyle(terrariumElement).zIndex);      // 현재 z-index를 가져와서
    terrariumElement.style.zIndex = currentZIndex >= 10 ? 2 : currentZIndex + 1;        // z-index를 증가시키기 
  }; 
  
  function pointerDrag(e) {
    e.preventDefault();
    console.log(e);

    maxZIndex++;    
    terrariumElement.style.zIndex = maxZIndex; //맨 마지막에 드래그 한거 가장 위로 올리기
    
    pos3 = e.clientX;                        // 초기 마우스 위치
    pos4 = e.clientY;
    document.onpointermove = elementDrag;    // 마우스 이동 및 버튼 떼기 이벤트 등록
    document.onpointerup = stopElementDrag;
  }
  
  function elementDrag(e) {     //마우스 이동거리 계산하기
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    console.log(pos1, pos2, pos3, pos4);
    
    //새 위치 픽스
    terrariumElement.style.top = (terrariumElement.offsetTop - pos2) + 'px';
    terrariumElement.style.left = (terrariumElement.offsetLeft - pos1) + 'px';
  }
  
  function stopElementDrag() {
    document.onpointerup = null;
    document.onpointermove = null;
  }
}