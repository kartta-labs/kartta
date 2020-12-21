// map.addControl(new PhotoMapControl({
//   layer: "buildings",
//   outlineLayer: "buildings_outline",
//   editorUrl:   "https://re.city/e",
//   noterUrl: "https://re.city/nf",
//   noterApiUrl: "https://re.city/nb",
//   getYear: <function returning current time slider year>
// }));

class PhotoMapControl {
  constructor(options) {
    this.layer = options.layer;
    this.outlineLayer = options.outlineLayer;
    this.editorUrl = options.editorUrl;
    this.noterUrl = options.noterUrl; // https://re.city/nf/?query=312454650
    this.noterApiUrl = options.noterApiUrl;
    this.getYear = options.getYear;
    this.savedPhotoStyle = null;
    this.mapInfoZoomMessage = document.getElementById('map-info-zoom-message');

    this.mapOnClick = (e) => {
      if (!this.isActive()) {
        return;
      }
      this.handleMapClickEnterPhoto(e);
      this.handleMapSelectPolygon(e);
    };

    this.mapOnMoveend = () => {
      if (!this.isActive()) {
        this.removePhotoStyle();
        return;
      }
      this.loadPhotoData();
    }
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = "mapboxgl-ctrl button-photo";
    this._container.id = "button-photo";
    this._container.textContent = 'i';
    this.sideBarContainer =  document.getElementById("map-wrapper");
    this.searchResults = document.getElementById("search-results");
    this.searchResultsList = document.getElementById("search-results-list");
    this.searchResultsLoading = document.getElementById("search-results-loading");
    this.anno_ids = []; // array of ids suitable for mapping
    this.annotations = []; // structure from API containing 
    this.browseBounds; //current bounds of the map

    // Note on "enabled" vs "active" terminology used in this file:
    // 
    // "enabled" means the user has enabled the photo/info display feature, i.e. the 'i' button
    // is in its clicked/down state (grey).  The user toggles "enabled" explicitly by clicking
    // the 'i' button, or via the 'i' key shortcut.
    // 
    // "active" means the current zoom level is >= 17 so we can display photo data.
    // 
    // Photo data is displayed, and buildings can be clicked on, only when both "enabled" and "active" are true.
    // 
    // "enabled" is indicated/controlled by an instance variable.
    // 
    // "active" is indicated by the isActive method.

    this.enabled = false;

    // When button is clicked:
    this._container.addEventListener('click', () => this.toggleEnabled());
    
    return this._container;
  }

  isActive() {
    return this._map.getZoom() > 17 /*this._map.getLayer(this.layer).minzoom*/;
  }

  toggleEnabled() {
    if (this.enabled) {
      this.disable();
    } else{ 
      if (!this.isActive()) {

        this.mapInfoZoomMessage.classList.remove("kartta-hidden");
        setTimeout(() => {
          this.mapInfoZoomMessage.classList.add("kartta-hidden");
        }, 1500);

        return;
      }
      this.enable();
    }
  }

  enable() {
    this.enabled = true;
    this._map.on('click', this.layer, this.mapOnClick);
    this._map.on('moveend', this.layer, this.mapOnMoveend);

    this._container.className = this._container.className + " button-photo-enabled";
    this.loadPhotoData();
  }

  disable() {
    this.enabled = false;
    this.cancelPhotomap();
    this.removePhotoStyle();
  }

  handleMapClickEnterPhoto(e) {
   // console.log('Click ',e.features[0].id, e.features[0], e.features[0].properties);
    this.searchResultsList.textContent = "";
    this.searchResultsList.appendChild(this.buildingItem(e.features[0]));
    const footprintId = this._map.getFeatureState({
      source: 'antique',
      sourceLayer: this.layer,
      id: e.features[0].id
      }).footprint;
    // check to see if the building has a photo associated with it
    if (this.anno_ids.indexOf(footprintId) != -1 && this.getPhotos(footprintId).length > 0) {
      this.searchResultsList.appendChild(this.photoItem(footprintId));
    }else {
      const helpDiv = document.createElement("div");
      helpDiv.classList.add("photodiv")
      const helpHeader = document.createElement("h3");
      helpHeader.textContent = "No Photos found."
      helpDiv.appendChild(helpHeader);
      const helpP = document.createElement("p")
      helpP.textContent = "There are currently no photos associated with this building."
      helpDiv.appendChild(helpP);
      this.searchResultsList.appendChild(helpDiv);
    }
    // append the please help text
    const commonDiv = document.createElement("div");
    commonDiv.classList.add("helpdiv")
    const commonHeader = document.createElement("h3");
    commonHeader.textContent = "Can you help?"
    commonDiv.appendChild(commonHeader);

    //editor link
    const commonP = document.createElement("p")
    commonP.textContent = "Do you have a photo for this feature? Want to make a correction to the shape and/or data associated with it?  You can upload photos and enter/edit the feature's data in the editor.";
    commonP.appendChild(document.createElement("br"));
    const a = document.createElement("a");
    a.setAttribute("href", "#");
    a.textContent = "Open Editor for this feature";
    a.addEventListener('click', (e) => {
      e.preventDefault();
      location.replace(this.editorUrl+"/edit?disable_features=date_range&start_date="+this.getYear()+"&way="+footprintId);
    });
    commonP.appendChild(a);

    commonDiv.appendChild(commonP);

    ////noter link
    //const commonP2 = document.createElement("p")
    //commonP2.textContent = "You can edit the annotation and facade directly in the Noter."
    //commonP2.appendChild(document.createElement("br"));
    //const url2 = this.noterUrl+"/?query="+footprintId;
    //const a2 = document.createElement("a");
    //a2.setAttribute("href", url2);
    //a2.setAttribute("target", "new");
    //a2.textContent = "Open Noter for this feature";
    //commonP2.appendChild(a2);
    //commonDiv.appendChild(commonP2);

    this.searchResultsList.appendChild(commonDiv);
    // append the common links

    this.searchResultsLoading.classList.add("kartta-hidden");
    this.searchResults.classList.remove('kartta-hidden');
   
    this.sideBarContainer.classList.add("sidebar-open")
  }

  getFeatureName(feature, wayId) {
    if (feature.properties.name) {
      return feature.properties.name;
    }
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['name'];
  }

  getFeatureType(feature, wayId) {
    if (feature.properties.type) {
      return feature.properties.type;
    }
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['building'];
  }

  getFeatureStartDate(feature, wayId) {
    if (feature.properties.start_date) {
      return feature.properties.start_date;
    }
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['start_date'];
  }

  getFeatureEndDate(feature, wayId) {
    if (feature.properties.end_date) {
      return feature.properties.end_date;
    }
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['end_date'];
  }

  getFeatureHouseNumber(feature, wayId) {
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['addr:housenumber'];
  }

  getFeaturePostCode(feature, wayId) {
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['addr:postcode'];
  }

  getFeatureStreet(feature, wayId) {
    if (!(wayId in this.elements['way'])) {
      return null;
    }
    return this.elements['way'][wayId]['tags']['addr:street'];
  }

  maybeAddBuildingInfoTableRow(table, name, value) {
    if (!value) { return; }
    const tr = document.createElement("tr");
    const td0 = document.createElement("td");
    td0.textContent = name;
    tr.appendChild(td0);
    const td1 = document.createElement("td");
    td1.textContent = value;
    tr.appendChild(td1);
    table.appendChild(tr);
  }

  buildingItem(feature) {
    const buildingDiv = document.createElement("div");
    buildingDiv.classList.add("photodiv");
    const header = document.createElement("h3");
    const footprintId = this._map.getFeatureState({
      source: 'antique',
      sourceLayer: this.layer,
      id: feature.id
      }).footprint;

    const table = document.createElement("table");
    table.classList.add("building-info");
    this.maybeAddBuildingInfoTableRow(table, "name", this.getFeatureName(feature, footprintId));
    this.maybeAddBuildingInfoTableRow(table, "type", this.getFeatureType(feature, footprintId));
    this.maybeAddBuildingInfoTableRow(table, "start_date", this.getFeatureStartDate(feature, footprintId));
    this.maybeAddBuildingInfoTableRow(table, "end_date", this.getFeatureEndDate(feature, footprintId));
    this.maybeAddBuildingInfoTableRow(table, "addr:housenumber", this.getFeatureHouseNumber(feature, footprintId));
    this.maybeAddBuildingInfoTableRow(table, "addr:street", this.getFeatureStreet(feature, footprintId));
    this.maybeAddBuildingInfoTableRow(table, "addr:postcode", this.getFeaturePostCode(feature, footprintId));
    buildingDiv.appendChild(table);
  
    return buildingDiv;
  }

  photoItem(id) {
    const photoDiv = document.createElement("div");
    const header = document.createElement("h3");
    header.textContent = "Photos: "
    photoDiv.appendChild(header);
    const photos = this.getPhotos(id);
    const ul = document.createElement("ul");
    ul.classList.add('unstyled');
    let imageLi;
    let imagea;
 
    for (var i=0;i< photos.length;i++){
      imageLi = document.createElement("li")
      imagea = document.createElement("img")
      imagea.setAttribute("src", photos[i].url );
      imagea.setAttribute("alt", "You may need to login first to be able to view this image.");
      imagea.setAttribute("width", "300px" );
      imageLi.appendChild(imagea);
      ul.appendChild(imageLi);
    }
 
    photoDiv.appendChild(ul);  
 
    return photoDiv;
  }

  getPhotos(id) {
    let photos = [];
    this.annotations.forEach(anno => {
      if (id == anno.buildingId){
        photos.push( {"url": this.noterApiUrl + "/download/"+ anno.noterImageId +"/"})
      }
    })
    return photos;
  }

  loadPhotoData() {
    const bounds = this._map.getBounds();
    //dont load data if the map is over the same areas
    if (this.browseBounds && (this.browseBounds.contains(bounds._sw) && this.browseBounds.contains(bounds._ne) )){
      return;
    }
    if (!this.isActive()) {
     return;
    }

    var mapbounds = [bounds._sw.lng, bounds._sw.lat, bounds._ne.lng, bounds._ne.lat].join(",")
    const url = this.editorUrl+ "/api/0.6/map?bbox=" + mapbounds;

     fetch(url, {
       headers: {
         Accept: 'application/json'
       }
     }).then(response => {
       return response.json();
     }).then(result => {
       this.annotations = this.photoAnnotations(result);
       this.anno_ids = this.idsFromAnnotations(this.annotations)

       this.updateFeatureState(this.getMultipolygons(result));
       
       this.showPhotoStyle();    
       this.browseBounds = bounds;  

     }).catch(error => {
       console.log('Error:', error);
     })
  }

  removeHighlight() {
    if (typeof this._map.getLayer('highlight') !== "undefined" ){
      this._map.removeLayer('highlight');
    }
  }

  handleMapSelectPolygon(e) {
     const features = this._map.queryRenderedFeatures(e.point, { layers: [this.layer] });
     if (!features.length) {
         return;
     }
     this.removeHighlight();

     let filter = ["==", '$id', features[0].id];
     if (features[0].properties.name){
       filter =   ["all",
         ["==", '$id', features[0].id],
         ["==", "name", features[0].properties.name]
       ]
     }

     this._map.addLayer(
       {
       'id': 'highlight',
       'type': 'line',
       'source': 'antique',
       'source-layer': 'buildings',
       "paint": {"line-color": "yellow", "line-width": 5 },
       'filter': filter
       }
     ); 
  }

  showPhotoStyle() {
    // highlight the building lines
    if (this.anno_ids.length > 0){
      this.savedPhotoStyle = {
        'line-color':    this._map.getPaintProperty(this.outlineLayer, 'line-color'),
        'line-width':    this._map.getPaintProperty(this.outlineLayer, 'line-width'),
        'line-opacity':  this._map.getPaintProperty(this.outlineLayer, 'line-opacity')
      };

      this._map.setPaintProperty(this.outlineLayer, 'line-color',   ['match', ['feature-state','footprint'], [...this.anno_ids], '#de683d', '#aaaaaa'  ]); 
      this._map.setPaintProperty(this.outlineLayer, 'line-width',   ['match', ['feature-state','footprint'], [...this.anno_ids], 4.5 , 1.5] ); 
      this._map.setPaintProperty(this.outlineLayer, 'line-opacity', ['match', ['feature-state','footprint'], [...this.anno_ids], 1 , 0.5 ]);  
    }
  }

  removePhotoStyle() {
    if (this.savedPhotoStyle != null) {
      this._map.setPaintProperty(this.outlineLayer, 'line-color', this.savedPhotoStyle['line-color']);
      this._map.setPaintProperty(this.outlineLayer, 'line-width', this.savedPhotoStyle['line-width']);
      this._map.setPaintProperty(this.outlineLayer, 'line-opacity', this.savedPhotoStyle['line-opacity']);
      this.savedPhotoStyle = null;
    }
  }
 
  cancelPhotomap() {
    this._map.off('click', this.layer, this.mapOnClick);
    this._map.off('moveend', this.layer, this.mapOnMoveend);
    this.removeHighlight();
    this.browseBounds = null;
    this._container.className = "mapboxgl-ctrl button-photo";
    this.sideBarContainer.classList.remove("sidebar-open");
    this.searchResults.classList.add('kartta-hidden');
  };

  // Extract photo annotatioin data from editor api db data.
  // Takes a json object containing editor api data (from the endpoint '/e/api/0.6/map?bbox=...').
  // Returns an array containing one json object for each photo annotation; each object looks like:
  //     {
  //       buildingId: < the building id (way id) of a building >
  //       noterAnnotationId: < id for the annotation in noter >
  //       noterImageId: < id for the image in noter >
  //       facadeLine: < coordinates of the facade line for the photo >
  //     }
  // Has the side effect of saving a map of the loaded data in this.elements.
  photoAnnotations(json) {
    const elements = {
      'node': {},
      'way': {},
      'relation': {}
    };
    json.elements.forEach(element => {
      elements[element.type][element.id] = element;
    });
    const noterAnnotationRelationIds = Object.keys(elements['relation']).filter(id => 'noter_annotation_id' in elements.relation[id].tags);
    const annotations =  noterAnnotationRelationIds.map(id => {
      const relation = elements.relation[id];
      const buildingId = relation.members.filter(member => member.role == 'footprint')[0].ref;
      // facade might be useful later
      // const facadeLineId = relation.members.filter(member => member.role == 'facadeline')[0].ref;
      // let facadeLine = [];
      // if  (elements.way[facadeLineId]) {
      //   const facadeLineNodeIds = elements.way[facadeLineId].nodes;
      //   const facadeLineNodes = facadeLineNodeIds.map(id => elements['node'][id]);
      //   facadeLine = facadeLineNodes.map(node => [node.lon, node.lat]);
      // }
  
      return {
        buildingId: buildingId,
        noterAnnotationId: relation.tags.noter_annotation_id,
        noterImageId: relation.tags.noter_image_id //,
       // facadeLine: facadeLine
      };
    });
    this.elements = elements;
    return annotations;
  };

  getMultipolygons(json) {
    const elements = {
      'node': {},
      'way': {},
      'relation': {}
    };
    json.elements.forEach(element => {
      elements[element.type][element.id] = element;
    });
    const multi = {};
    json.elements.forEach(element => {
      if (element.type == 'relation' && 'building' in element.tags ){
        if (element.tags.type && element.members && element.tags.type == 'multipolygon'){
          const outer = element.members.filter(member => member.role == 'outer')[0];
          multi[element.id] = elements['way'][outer.ref];
        }
      }
    });
    
    return {'elements':elements, 'multi': multi};
  }

  // updates the feature state of all buildings with their id, an updates those buildings which are multi polygons with the outer relation id
  updateFeatureState(elements_and_multi) {
    const elements = elements_and_multi.elements
    const multi = elements_and_multi.multi

    //add footprint feature state to all buildings
    const allfeatures = this._map.querySourceFeatures('antique', {sourceLayer: this.layer });
    allfeatures.forEach(feat => {
      this._map.setFeatureState({
        source: 'antique',
        sourceLayer: this.layer,
        id: feat.id
        }, {"footprint": feat.id}
      );
    })
  
    const node_keys = Object.keys(elements.node)
  
    for (let [key, outer] of Object.entries(multi)) {
      //console.log("outer",outer)
      let way_nodes = [];
      for (let a = 0; a<outer.nodes.length; a++){
        if (node_keys.indexOf(outer.nodes[a].toString()) > -1){
          const matchingid = outer.nodes[a];
          way_nodes.push(elements.node[matchingid]);
        }
      }
    
      //  Query the map for the building features, and set the footprint id as the outer way id.

      const centerPoint = this.calcCenter(way_nodes)
      const center = this._map.project(centerPoint)
      const intersects = this._map.queryRenderedFeatures(center, { layers: [this.layer] });

      if (intersects.length> 0) {
        intersects.forEach(feat => {
          this._map.setFeatureState({
            source: 'antique',
            sourceLayer: this.layer,
            id: feat.id
            }, {"footprint": outer.id}
          );
        })
      }
    }
  }

  // helper function to simply calcuate the center of a way
  calcCenter(way_nodes) {
    var minX, maxX, minY, maxY;
    for (var i = 0; i < way_nodes.length; i++) {
      minX = (way_nodes[i].lon < minX || minX == null) ? way_nodes[i].lon : minX;
      maxX = (way_nodes[i].lon > maxX || maxX == null) ? way_nodes[i].lon : maxX;
      minY = (way_nodes[i].lat < minY || minY == null) ? way_nodes[i].lat : minY;
      maxY = (way_nodes[i].lat > maxY || maxY == null) ? way_nodes[i].lat : maxY;
    }
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  }

  idsFromAnnotations(annotations) {
    const ids = [];
    annotations.forEach(annotation => {
      if(ids.indexOf(annotation.buildingId) == -1){
        ids.push(annotation.buildingId);
      }
    })

    return ids;
  }


  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

}
