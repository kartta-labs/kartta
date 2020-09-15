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

document.addEventListener("DOMContentLoaded", function(){
  var styleURL = '{{ APP_HOME_URL }}/mbgl-antique-style.json';

  var map = new mapboxgl.Map({
      container: 'map', // container id
      style: styleURL, // stylesheet location
      center: [-73.99,40.74], // starting position [lng, lat]lng: -73.99931073493184, lat: 40.74364982242477
      zoom: 14,
      minZoom: 0,
      hash: true,
      fadeDuration: 100 //controls the duration of the fade for text labels and symbols (default 300)

  });

  map.addControl(new mapboxgl.NavigationControl());

  var timefilter;
  var layersToFilter = [ "buildings", "building_names","building_names__1", "buildings_outline",  "landuse", "road_names", "minor_roads", "roads_casing_major","roads_casing_mid","roads_casing_major", "roads_centre_major","roads_centre_mid"]

  timefilter = new MbglTimefilter(map, {layers: layersToFilter, showNoDates: true})

  // set initial filter once the style is in the map.
  // fired once, hopefully should be after layers etc are loaded in, but may have to use 'idle' event
  map.once('sourcedata', function(e) {
    timefilter.filter(1850)
  });

  // idle is fired after sourcedata, is first fired when everything is initially set up. Might be used instead of sourcedata, but initial idle takes a bit longer. Could be useful if there are multiple vector layers to load.
  map.once('idle', function() {
  //  timefilter.filter(1850)
  });


  // listen to the slider changes
  document.getElementById('year-slider').addEventListener('change', function(e) {
    var year = e.target.value;
    timefilter.filter(year);
    document.getElementById('filter-year-label').innerText = e.target.value;
  });


  // Get stats events listening.
  map.on('idle', function() {
  //timefilter.getStats('antique','buildings', 1800, 2020)
  });
  map.on('sourcedata', function(e) {
    if (e.isSourceLoaded == true) {
    //  stats = timefilter.getStats('antique','buildings', 1800, 2020)
    }
  });
});
