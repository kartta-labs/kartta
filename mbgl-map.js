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

  let currentYear = params.has("year") ? parseInt(params.get("year")) : "{{ INITIAL_YEAR }}";

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
      center: [{{ INITIAL_LON }}, {{ INITIAL_LAT }}],
      zoom: {{ INITIAL_ZOOM }},
      minZoom: 0,
      hash: true,
      fadeDuration: 100, //controls the duration of the fade for text labels and symbols (default 300)
      attributionControl: false
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
      "water",
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

  searchButton = document.getElementById("search-button");
  searchQueryText = document.getElementById("search-query-text");

  searchButton.addEventListener("click", (e) => {
    DoSearch();
  });
  searchQueryText.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      DoSearch();
    }
  });

  searchResults = document.getElementById("search-results");
  searchResultsList = document.getElementById("search-results-list");
  searchResultsCloseButton = document.getElementById("search-results-close-button");
  searchResultsLoading = document.getElementById("search-results-loading");

  function hideSearchResults() {
    searchResults.classList.add('kartta-hidden');
  }

  searchResultsCloseButton.addEventListener("click", hideSearchResults);

  function searchResultsItem(text, url) {
     const li = document.createElement("li");
     if (url) {
       const a = document.createElement("a");
       a.setAttribute("href", url);
       a.innerHTML = text;
       a.addEventListener("click", hideSearchResults);
       li.appendChild(a);
     } else {
       li.innerHTML = text;
     }
     return li;
  }

  // This picks the largest zoom level for which one tile fits within the lon range of the bbox.
  // Note: for zoom level z, one tile has width 260/2^z degrees.
  // A better implementation would also look at the latitude range.
  function zoomLevelForSearchResultsItem(item) {
    if (!('boundingbox' in item)) {
      return 13.5;
    }
    const lon1 = item['boundingbox'][2];
    const lon2 = item['boundingbox'][3];
    return 1 + Math.floor(Math.log(360/Math.abs(lon1 - lon2)) / Math.log(2));
  }

  function searchResultsURL(item) {
    return "/?year=" + currentYear + "#" + zoomLevelForSearchResultsItem(item) + "/" + item.lat + "/" + item.lon;
  }


  function DoSearch() {
    const query = searchQueryText.value.trim();
    const encodedQuery = encodeURIComponent(query);
    const bounds = map.getBounds();
    const viewbox = [bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth()].join(',');
    const url = 'https://nomina.re.city/search?format=json&extratags=1'
              + '&q=' + encodedQuery
              + '&viewbox=' + viewbox
              + '&accept-language=en-US,en';
    searchResults.classList.remove('kartta-hidden');
    searchResultsLoading.classList.remove("kartta-hidden");
    while (searchResultsList.firstChild) {
      searchResultsList.removeChild(searchResultsList.firstChild);
    }

    fetch(url)
    .then(response => {
      if (response.status === 200 || response.status === 0) {
        return Promise.resolve(response.json());
      } else {
        return Promise.reject(new Error(response.statusText));
      }
    })
    .then(data => {
      searchResultsLoading.classList.add("kartta-hidden");
      if (data.length == 0) {
        searchResultsList.appendChild(searchResultsItem("No results found."));
      }
      data.forEach(item => {
        searchResultsList.appendChild(searchResultsItem(item.display_name, searchResultsURL(item)));
      });
    })
    .catch(e => {
      console.log(e);
    });

  }
});
