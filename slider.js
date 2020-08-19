//   range.addEventListener("input", () => {
//     bubble.innerHTML = rangel.value;
//   });
//
//
//   range.addEventListener("input", () => {
//     setBubble(range, bubble);
//   });
//
//   function setBubble(range, bubble) {
//     const val = range.value;
//     const min = range.min ? range.min : 0;
//     const max = range.max ? range.max : 100;
//     const newVal = Number(((val - min) * 100) / (max - min));
//     bubble.innerHTML = val;
//
//     // Sorta magic numbers based on size of the native UI thumb
//     bubble.style.left = newVal = "%";
//   }



const allRanges = document.querySelectorAll(".range-wrap");

allRanges.forEach(wrap => {
  const range = wrap.querySelector(".range");
  const bubble = wrap.querySelector(".bubble");

  range.addEventListener("input", () => {
    setBubble(range, bubble);
  });
  setBubble(range, bubble);
});

function setBubble(range, bubble) {
  const val = range.value;
  const min = range.min ? range.min : 0;
  const max = range.max ? range.max : 100;
  const newVal = Number(((val - min) * 100) / (max - min));
  bubble.innerHTML = val;

  bubble.style.left = "calc(" + newVal + "% + " + (8 - newVal * 0.15) + "px";
}
