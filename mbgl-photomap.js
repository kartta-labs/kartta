// map.addControl(new PhotoMapControl({
//   layer: "buildings",
//   outlineLayer: "buildings_outline",
//   editorUrl:   "https://re.city/e",
//   noterUrl: "https://re.city/nf",
//   noterApiUrl: "https://re.city/nb"
// }));

class PhotoMapControl {
  constructor(options) {
    this.layer = options.layer;
    this.outlineLayer = options.outlineLayer;
    this.editorUrl = options.editorUrl;
    this.noterUrl = options.noterUrl; // https://re.city/nf/?query=312454650
    this.noterApiUrl = options.noterApiUrl;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = "mapboxgl-ctrl button-photo";
    this._container.id = "button-photo";
    this._container.textContent = 'PH';
    this.sideBarContainer =  document.getElementById("map-wrapper");
    this.searchResults = document.getElementById("search-results");
    this.searchResultsList = document.getElementById("search-results-list");
    this.searchResultsLoading = document.getElementById("search-results-loading");
    this.active = false;
    this.anno_ids = []; // array of ids suitable for mapping
    this.annotations = []; // structure from API containing 
    this.browseBounds; //current bounds of the map

    const handle_map_click_enter_photo = (e) => {
     // console.log('Click ',e.features[0].id, e.features[0], e.features[0].properties);
      this.searchResultsList.textContent = "";
      this.searchResultsList.appendChild(buildingItem(e.features[0]));

      // check to see if the building has a photo associated with it
      if (this.anno_ids.indexOf(e.features[0].id) != -1 && getPhotos(e.features[0].id).length > 0) {
        this.searchResultsList.appendChild(photoItem(e.features[0].id));
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
      commonP.textContent = "Do you have a photo for this feature? You can upload photos and annotate this building in the editor. "
      commonP.appendChild(document.createElement("br"));
      const url = this.editorUrl+"/edit?way="+e.features[0].id;
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("target", "new");
      a.textContent = "Open Editor for this feature";
      commonP.appendChild(a);

      commonDiv.appendChild(commonP);

      //noter link
      const commonP2 = document.createElement("p")
      commonP2.textContent = "You can edit the annotation and facade directly in the Noter."
      commonP2.appendChild(document.createElement("br"));
      const url2 = this.noterUrl+"/?query="+e.features[0].id;
      const a2 = document.createElement("a");
      a2.setAttribute("href", url2);
      a2.setAttribute("target", "new");
      a2.textContent = "Open Noter for this feature";
      commonP2.appendChild(a2);

      commonDiv.appendChild(commonP2);

      this.searchResultsList.appendChild(commonDiv);
      // append the common links

      this.searchResultsLoading.classList.add("kartta-hidden");
      this.searchResults.classList.remove('kartta-hidden');
     
      this.sideBarContainer.classList.add("sidebar-open")
    };

    const buildingItem = (feature) => {
      const buildingDiv = document.createElement("div");
      buildingDiv.classList.add("photodiv")
      const header = document.createElement("h3");
      
      if (feature.properties.name) {
        header.textContent = "Building: " + feature.properties.name;
      }else{
        header.textContent = "Unnamed Building: "+ feature.id;
      }
      buildingDiv.appendChild(header);
      const ul = document.createElement("ul");
      ul.classList.add('unstyled');

      if (feature.properties.type){
        const featuretype = document.createElement("li")
        let ftype = feature.properties.type;
        if (ftype == "yes") {
          ftype = "building"
        }
        featuretype.textContent = "Type: "+ ftype;
        ul.appendChild(featuretype)
      }
      if (feature.properties.start_date || feature.properties.start_date){
        const dates = document.createElement("li")
        if (feature.properties.start_date){
          dates.textContent = "Start: "+ feature.properties.start_date + " ";
        }
        if (feature.properties.end_date){
          dates.textContent = "End: "+ feature.properties.end_date
        }
        ul.appendChild(dates)
      }
 
      buildingDiv.appendChild(ul);
  
      return buildingDiv;
   }

   
   const photoItem = (id) => {
    const photoDiv = document.createElement("div");
    const header = document.createElement("h3");
    header.textContent = "Photos: "
    photoDiv.appendChild(header);
    const photos = getPhotos(id);
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

   const getPhotos = (id) => {
     let photos = []
     this.annotations.forEach(anno => {
       if (id == anno.buildingId){
        photos.push( {"url": this.noterApiUrl + "/download/"+ anno.noterImageId +"/"})
        }
      })
   
      return photos;
    
   }

   const loadPhotoData = () => {
     const bounds = map.getBounds();
     //dont load data if the map is over the same areas
     if (this.browseBounds && (this.browseBounds.contains(bounds._sw) && this.browseBounds.contains(bounds._ne) )){
       return;
     }
     if (map.getZoom() < map.getLayer(this.layer).minzoom ){
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
        this.annotations = photoAnnotations(result);
        this.anno_ids = idsFromAnnotations(this.annotations)
        showPhotoStyle();    
        this.browseBounds = bounds;  

      }).catch(error => {
        console.log('Error:', error);
      })
      
   }

   const removeHighlight = () =>{
     if (typeof map.getLayer('highlight') !== "undefined" ){
       map.removeLayer('highlight');
     }
   }

   const handle_map_select_polygon = (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [this.layer] });
      if (!features.length) {
          return;
      }
      removeHighlight();

      let filter = ["==", '$id', features[0].id];
      if (features[0].properties.name){
        filter =   ["all",
          ["==", '$id', features[0].id],
          ["==", "name", features[0].properties.name]
        ]
      }

      map.addLayer(
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


    // When button is clicked:
    this._container.addEventListener('click', () => {     

      if (this.active) {
        this.active = false;
        cancelPhotomap();
        removePhotoStyle();
      } else{ 
       
        if (map.getZoom() > map.getLayer(this.layer).minzoom ){
          this.active = true;
          map.on('click', this.layer, handle_map_click_enter_photo);
          map.on('click', this.layer, handle_map_select_polygon);
          map.on('moveend', loadPhotoData)
          this._container.className = this._container.className + " button-photo-active"
          
          loadPhotoData();
        }

      }

    });
    

    const showPhotoStyle = () => {
      // highlight the building lines
      if (this.anno_ids.length > 0){
        map.setPaintProperty(this.outlineLayer, 'line-color',   ['match', ['id'], [...this.anno_ids], '#de683d', '#aaaaaa'  ]); 
        map.setPaintProperty(this.outlineLayer, 'line-width',    ['match', ['id'], [...this.anno_ids], 4.5 , 1.5] ); 
        map.setPaintProperty(this.outlineLayer, 'line-opacity',   ['match', ['id'], [...this.anno_ids], 1 , 0.5 ]);  
      }

    }

    const removePhotoStyle = () => {
      map.setPaintProperty(this.outlineLayer, 'line-color',   '#aaaaaa' );  
      map.setPaintProperty(this.outlineLayer, 'line-width',   {"stops":[[15,0.5],[21,1.5]]});  
      map.setPaintProperty(this.outlineLayer, 'line-opacity',  1 );  
   }
   

    const cancelPhotomap = () => {
      map.off('click', this.layer, handle_map_click_enter_photo);
      map.off('click', this.layer, handle_map_select_polygon);
      map.off('moveend', loadPhotoData);
      removeHighlight();
      this.browseBounds = null;
      this._container.className = "mapboxgl-ctrl button-photo";
      this.sideBarContainer.classList.remove("sidebar-open")
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
    const photoAnnotations = (json) => {
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

      return annotations;
    };


    const idsFromAnnotations = (annotations) => {
      let ids = []
      annotations.forEach(annotation => {
        if(ids.indexOf(annotation.buildingId) == -1){
          ids.push(annotation.buildingId);
        }
      })

      return ids;
    }


    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

}
