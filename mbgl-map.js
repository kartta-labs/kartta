// Copyright 2020 Google LLC
// Copyright 2020 Tim Waters
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


class ThreeDControl {
  constructor(options) {
    this.getYear = options.getYear;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = "mapboxgl-ctrl button-3d";
    this._container.id = "button-3d";
    this._container.textContent = '3D';

    const message = document.getElementById('map-3d-message-overlay');

    const handle_map_click_enter_3d = (e) => {
      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;
      const url = new URL(window.location);
      //const year = document.getElementById('year-slider').value;
      const year = this.getYear();
      window.location.href = url.origin + "/3d?year=" + year + "&lon=" + lon + "&lat=" + lat;
    };

    let handle_keypress;

    // When 3D button is clicked:
    //   1. display the 3D message with cancel button
    //   2. change map cursor to crosshair
    //   3. listen for map clicks to switch to 3D
    //   4. listen for esc key
    this._container.addEventListener('click', () => {
      message.classList.remove('kartta-hidden');
      map._canvas.classList.add('crosshair-cursor');
      map.on('click', handle_map_click_enter_3d);
      window.addEventListener('keydown', handle_keypress, false);
    });

    // To cancel:
    //   1. hide the 3D message
    //   2. restore the normal map cursor
    //   3. stop listening for map clicks
    //   4. stop listening for esc key
    const cancel_3d = () => {
      message.classList.add('kartta-hidden');
      map._canvas.classList.remove('crosshair-cursor');
      map.off('click', handle_map_click_enter_3d);
      window.removeEventListener('keydown', handle_keypress, false);
    };

    handle_keypress = (e) => {
      if (e.key == 'Escape') {
        cancel_3d();
      }
    };

    document.getElementById('cancel-3d-button').addEventListener('click', cancel_3d);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}


/**
 * Updates the current page url without triggering a page reload, and without changing navigation history.
 * Takes an object containing parameter name,value settings, and affects only those parameter values in the
 * url -- any parameters present in the url and not present in params are left unchanged.
 */
const updatePageUrl = (params) => {
  const url = new URL(document.location);
  Object.keys(params).forEach(key => {
    url.searchParams.set(key, params[key]);
  });
  window.history.replaceState(
      null, '',
      location.origin + location.pathname + '?' + url.searchParams.toString() + location.hash);
};

document.addEventListener("DOMContentLoaded", function(){
  const params = (new URL(document.location)).searchParams;

  let currentYear = params.has("year") ? parseInt(params.get("year")) : "1940";

  const styleURL = '{{ APP_HOME_URL }}/mbgl-antique-style.json';

//  const filterStart = ['any',
//    ['!', ['has', this.startProp]],
//    ['<=', ['get', this.startProp], currentYear]
//  ];
//  const filterEnd = ['any',
//    ['!', ['has', this.endProp]],
//    ['>=', ['get', this.endProp], currentYear]
//  ];
//  const mapFilters = ['all', filterStart, filterEnd];

  const map = new mapboxgl.Map({
      container: 'map', // container id
      style: styleURL, // stylesheet location
      center: [-73.99,40.74], // starting position [lng, lat]lng: -73.99931073493184, lat: 40.74364982242477
      zoom: 14,
      minZoom: 0,
      hash: true,
      fadeDuration: 100 //controls the duration of the fade for text labels and symbols (default 300)
  });

  map.addControl(new mapboxgl.NavigationControl({
    showCompass: false
  }));

  map.addControl(new ThreeDControl({
    getYear: () => {
      return currentYear;
    }
  }));

  const layersToFilter = [
      "buildings",
      "building_names",
      "building_names__1",
      "buildings_outline",
      "landuse",
      "road_names",
      "minor_roads",
      "roads_casing_major",
      "roads_casing_mid",
      "roads_casing_major",
      "roads_centre_major",
      "roads_centre_mid"
  ];

  const timefilter = new MbglTimefilter(map, {
    layers: layersToFilter,
    showNoDates: true,
    startProp: 'start_date',
    endProp: 'end_date'
  });

  createKarttaSlider({
    minValue: 1800,
    maxValue: 2000,
    stepSize: 1,
    value: currentYear,
    change: (year) => {
      currentYear = year;
      timefilter.filter(year);
      updatePageUrl({year: year});
    },
    domElementToReplace: document.getElementById('year-slider-placeholder')
  });


  // set initial filter once the style is in the map.
  // fired once, hopefully should be after layers etc are loaded in, but may have to use 'idle' event
  map.once('sourcedata', function(e) {
    timefilter.filter(currentYear);
  });

// // idle is fired after sourcedata, is first fired when everything is initially set up. Might be used instead
// // of sourcedata, but initial idle takes a bit longer. Could be useful if there are multiple vector layers to load.
// map.once('idle', function() {
//   //timefilter.filter(1850)
// });
//
// // Get stats events listening.
// map.on('idle', function() {
//   //timefilter.getStats('antique','buildings', 1800, 2020)
// });
// map.on('sourcedata', function(e) {
//   if (e.isSourceLoaded == true) {
//     //stats = timefilter.getStats('antique','buildings', 1800, 2020)
//   }
// });

});
