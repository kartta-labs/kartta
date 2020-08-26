document.addEventListener("DOMContentLoaded", () => {


var antiqueStyleURL = '{{ APP_HOME_URL }}/antique_style.json';
var xrayStyleURL = '{{ APP_HOME_URL }}/xray_style.json';

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: antiqueStyleURL, // stylesheet location
    center: [-73.997381,40.740341], // starting position [lng, lat]lng: -73.99931073493184, lat: 40.74364982242477
    zoom: 17, // starting zoom,
    minZoom: 0,
    hash: true
});
map.addControl(new mapboxgl.NavigationControl());

function reload() {
  map.setStyle(styleURL);
}

const debugSplash = document.getElementById("debug-splash");
setTimeout(() => {
  debugSplash.classList.add("hidden");
}, 750);


const timeSlider = document.getElementById("timeslider");

const range = timeSlider.querySelector(".range");
const bubble = timeSlider.querySelector(".bubble");
range.addEventListener("input", () => {
  setBubble(range, bubble);
});

map.on('load', () => {
  range.value = "{{ INITIAL_YEAR }}";
  setBubble(range, bubble);
});



const debugPanel = document.getElementById("debug-panel");
document.addEventListener('keydown', e => {
  if (e.key == "0") {
    if (debugPanel.classList.contains("hidden")) {
      debugPanel.classList.remove("hidden");
    } else {
      debugPanel.classList.add("hidden");
    }
  }
});

const debugCloseButton = document.getElementById("debug-close");
debugCloseButton.addEventListener('click', () => {
  debugPanel.classList.add("hidden");
})

const debugGridCheckbox = document.getElementById("debug-grid");
debugGridCheckbox.addEventListener('change', () => {
  if (debugGridCheckbox.checked) {
    map.showTileBoundaries = true;
  } else {
    map.showTileBoundaries = false;
  }
});

const inspectControl = new MapboxInspect({
  showInspectButton: false,
  showMapPopup: true
});


const debugInspectCheckbox = document.getElementById("debug-inspect");
debugInspectCheckbox.addEventListener('change', () => {
  if (debugInspectCheckbox.checked) {
    map.addControl(inspectControl);
  } else {
    map.removeControl(inspectControl);
    // remove any remaining popup
    popups = document.getElementsByClassName("mapboxgl-popup");
    for (let i = 0; i < popups.length; ++i) {
      popups[i].parentNode.removeChild(popups[i]);
    }
  }
});


document.getElementsByName("debug-map-style").forEach(radio => {
  radio.addEventListener('change', e => {
    console.log(radio.value);
    if (radio.value == "antique") {
      map.setStyle(antiqueStyleURL);
    } else if (radio.value == "xray") {
      map.setStyle(xrayStyleURL);
    }
  });
});



function setBubble(range, bubble) {
  const val = range.value;
  const min = range.min ? range.min : 0;
  const max = range.max ? range.max : 100;
  const newVal = Number(((val - min) * 100) / (max - min));
  bubble.innerHTML = val;

  const width = bubble.offsetWidth;

//  bubble.style.left = "calc(" + newVal + "% + " + (8 - newVal * 0.15) + "px)";
  bubble.style.left = "calc(" + newVal + "% - " + (width/2) + "px)";

  filter =
    ['all',
     ['<=', ['get', 'start_date'], val ],
     ['any',
      ['!', ['has', 'end_date']],
      ['>=', ['get', 'end_date'], val ]
     ]
    ];

  [
    "buildings",
    "buildings__1",
    "buildings__2",
    "buildings__3",
    "buildings__4",
    "buildings_outline",
    "building_names",
    "building_names__1"
  ].forEach(layer => map.setFilter(layer, filter));

}

});
