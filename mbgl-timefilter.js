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

/* MbglTimefilter control
*  Filtering Mapbox GL JS Layers with dates
*  
*  timefilter = new MbglTimefilter(map, options)
*  options = {startProp: 'start_date_int, endProp: 'end_date_int', dateFormat: 'YYYYMMDD', layers: ['buildings'], filterNoDates: true}
* Options:
* startProp: property in the layers which holds the start date to filter by, defaults to 'start_date_int' 
* endProp:   property in the layers which holds the start date to filter by, defaults to 'end_date_int' 
* (Both startProp and endProp will be evaluated via toNumber and can support "-Infinity" and "Infinity")
* dateFormat: date format of the date property YYYYMMDD or YYYY. defaults to 'YYYYMMDD'
* layers: array of strings of layer names which should be filtered. Defaults to ['buildings']
* showNoDates: true. Boolean. Should features with no date properties be shown?. Defaults to true
* Methods:
* timefilter.filter(yyyy)
* Filters the map
* e.g. timefilter.filter(1985)
* timefilter.getStats(sourceLayer, layer, minDate, maxDate)
* Get statistics about the distributions of features in a layer by decade. a feature can space multiple decades
* e.g. timefilter.getStats('antique','buildings', 1800, 2020)

*/

function MbglTimefilter(map, opts = {}){

  this.map = map;
  this.originalFilters = this.originalFilters || [];
  //set up options
  this.startProp  = opts.startProp     || 'start_date_int';
  this.endProp     = opts.endProp       || 'end_date_int';
  this.dateFormat =  opts.dateFormat     || 'YYYYMMDD' ; //one of YYYY or YYYYMMDD currently.
  this.layers      = opts.layers        || ['buildings'];
  if (opts.showNoDates == false){
    this.showNoDates  = false;
  } else{
    this.showNoDates  = true;
  }

  this.filter = function(date_str){
    date_str = date_str.toString();
    // get the original filters once on first filter. 
    if (this.originalFilters.length == 0){
      this.originalFilters = this._getOriginalFilters();
    }
    var date = this._getdate(date_str);

    //var filterNoDateProp =  ['all', ["!=", ["typeof", ["get", this.startProp ]], "string"], ["!=", ["typeof", ["get", this.endProp]], "string"] ]  ;
    //var filterStart = ['<=', ['to-number', ['get', this.startProp]], date];
    //var filterEnd =   ['>=', ['to-number', ['get', this.endProp]], date];

    var filterStart = ['any',
      ['!', ['has', this.startProp]],
      ['<=', ['get', this.startProp], date_str]
     ];
    var filterEnd = ['any',
      ['!', ['has', this.endProp]],
      ['>=', ['get', this.endProp], date_str]
     ];

     //var filterBetweenTime =  ['all', filterStart, filterEnd];
     //var newFilters = []

    var newFilters = ['all', filterStart, filterEnd];

    //if (this.showNoDates) {
    //  newFilters = ['any', filterNoDateProp, filterBetweenTime];
    //}else{
    //  newFilters = filterBetweenTime;
    //}
  
    for (var i = 0; i < this.layers.length; i++) {
      var originalFilter = this.originalFilters[i];
      if (originalFilter) {
        this.map.setFilter(this.layers[i], ['all', originalFilter, newFilters]);
      }else{
        this.map.setFilter(this.layers[i],  newFilters);
      }
    }

    return date;
  }


  this._getdate = function(dateStr) {
    if (this.dateFormat == 'YYYYMMDD'){
      date = parseInt(dateStr + "0000");
    } else{
      date = parseInt(dateStr);
    }

    return date;
  }
  
  this._getOriginalFilters = function(){
    var filters = [];
    for (var i = 0; i < this.layers.length; i++) {
      filters[i] = this.map.getFilter(this.layers[i]);
    }

    return filters;
  }

  // getStats('antique','buildings', 1800, 2020)
  this.getStats = function(source, layer, minDate, maxDate){
    has_start_date = ['has', this.endProp];
    has_end_date = ['has', this.endProp];

    var features = this.map.querySourceFeatures(source, {
      sourceLayer: layer,
//      filter: ['all', has_start_date, has_end_date] ,
      filter: ['all'],
      validate: false
    });

    //just take the first 3000 if theres a bazillion of them
    if (features.length > 3000){
      features.length = 3000;
    }

    var start_dates = []
    var end_dates = []
    for (var i = 0; i < features.length; i++) {
      start_dates.push(features[i].properties.start_date)
      end_dates.push(features[i].properties.end_date)
    }

    const range = (start, stop, step = 1) =>
      Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)
      
    var decade_bins = range(Math.ceil(minDate / 10) * 10, maxDate, 10)
    
    var count_data = [decade_bins.length];

    for (var i = 0; i < decade_bins.length; i++) {
      count_data[i] = { year: decade_bins[i],   value: 0 }
    }


    for (var i = 0; i < start_dates.length; i++) {
      var start = start_dates[i];  
      var end = end_dates[i];     

      for (var a = 0; a < count_data.length; a++) {
        
        if (count_data[a].year >= start && count_data[a].year <= end){
          count_data[a].value += 1;
        }
      }
    }

    return count_data;
  }

}
