var $q        = require('q');
var moment    = require('moment');
var _         = require('lodash');
var request   = require('request');
var key       = "GOOGLE_API_KEY"; //your google api key
var photoUrl  = "https://maps.googleapis.com/";
photoUrl      += "maps/api/place/photo?";
var mapsClient = require('@google/maps').createClient({
  Promise: $q.Promise,
  key: key
});
var placesAPI = function() {
  var args = arguments;
  var loc = (args[0]) ? args[0]: [];
  var address = "";
  return {
    /**
     *
     * @function searchPlaces
     * @memberof placesAPI
     * @desc Will search for places
     * with current location set
     *
     */
    searchPlaces: function(term) {
      var d = $q.defer();
      var el = this;
      mapsClient.places({
        query: term,
        language: 'en',
        location: loc,
        radius: 5000
      })
      .asPromise()
      .then(function(res) {
        if(res) {
          var data = res.json;
          var results = data.results;
          results = _.sortBy(results, function(o) {
              return el.calculateDistance(o);
          });
          var close = results.splice(0, 5);
          d.resolve(close);
        }
      });
      return d.promise;
    },
    /**
     *
     * @function getDetails
     * @memberof placesAPI
     * @desc Will get details
     * for a specific placeId
     *
     */
    getDetails: function(placeId) {
      var d = $q.defer();
      if(!placeId) {
        return false;
      }
      mapsClient.place({
        placeid: placeId,
        language: 'en'
      })
      .asPromise()
      .then(function(res) {
        if(res) {
          var data = res.json;
          var result = data.result;
          d.resolve(result);
        }
      });
      return d.promise;
    },
    /**
     *
     * @function setLocation
     * @memberof placesAPI
     * @desc Will set location
     * and store in loc var
     * as latitude/longitude
     *
     */
    setLocation: function(query) {
      var d = $q.defer();
      mapsClient.geocode({
        address: query
      }, function(err, response) {
        if(!err) {
          var res = response.json;
          var data = res.results[0];
          address = data.formatted_address;
          var geo = data.geometry;
          var location = geo.location;
          var t = [];
          t.push(location.lat);
          t.push(location.lng);
          loc = t;
          d.resolve(t);
        }
      });
      return d.promise;
    },
    /**
     *
     * @function fetchLocation
     * @memberof placesAPI
     * @desc Will get the formatted
     * address of a location
     *
     */
    fetchLocation: function(query) {
      var d = $q.defer();
      mapsClient.geocode({
        address: query
      }, function(err, response) {
        if(!err) {
          var res = response.json;
          var data = res.results[0];
          var addr = data.formatted_address;
          var a = addr.replace(", USA", "");
          data.formatted_address = a;
          d.resolve(data);
        }
      });
      return d.promise;
    },
    /**
     *
     * @function fetchResource
     * @memberof placesAPI
     * @desc Will get the resource
     * from photo reference
     *
     */
    fetchResource: function(photo) {
      var d = $q.defer();
      var url = photoUrl;
      url += "photo_reference=" + photo;
      url += "&key=" + key;
      url += "&maxwidth=720";
      var r = request.get(url, function() {
          d.resolve(r.uri.href);
      });
      return d.promise;
    },
    /**
     *
     * @function fetchHours
     * @memberof placesAPI
     * @desc Will get hours
     * for provided day
     *
     */
    fetchHours: function(place) {
      var hours = place.opening_hours;
      var days = hours.weekday_text;
      var s = days.join('\r\n');
      return s;
    },
    /**
     *
     * @function fetchRating
     * @memberof placesAPI
     * @desc Will get rating
     * for a specific location
     *
     */
    fetchRating: function(place) {
      var stars = "";
      var sopen = "☆";
      var sfilled = "★";
      if(place.rating) {
        var rating = Math.floor(place.rating);
        var diff = 5 - rating;
        for(var i = 1; i <= rating; i++) {
            stars += sfilled;
        }
        for(var a = 0; a < diff; a++) {
           stars += sopen;
        }
      }
      return stars;
    },
    /**
     *
     * @function getMap
     * @memberof placesAPI
     * @memberof Will get the map
     * with markers on both locations
     *
     */
    getMap: function(route) {
       if(!route) {
         return false;
       }
       var leg = route.legs[0];
       var gmaps = "https://maps.googleapis.com/";
       var base = gmaps + "maps/api/staticmap";
       var start = leg.start_location;
       var end = leg.end_location;
       var center = [];
       center.push(start.lat);
       center.push(start.lng);
       var zoom = "13";
       var vis = "&visible=";
       vis += end.lat + "," + end.lng;
       var url = base;
       url += "?center=" + center;
       url += "&key=" + key;
       url += vis;
       var icon = "https://res.cloudinary.com/cinemate/";
       icon += "image/upload/w_32/icon_fvijz1.png";
       url += "&markers=icon:" + icon + "%7Csize:mid%7C";
       url += center + "&markers=icon:" + icon + "%7Csize:mid";
       url += "%7C" + end.lat + "," + end.lng;
       url += "&path=weight:6%7Ccolor:0x545454%7Cenc:";
       var enc = route.overview_polyline.points;
       enc = enc.replace(/(\\)/g, '%5C');
       url += enc;
       var urlSm = url + "&size=720x480";
       url += "&size=1200x800";
       return {large: url, small: urlSm};
    },
    /**
     *
     * @function getDirections
     * @memberof placesAPI
     * @desc Will get directions
     * from current location
     *
     */
    getDirections: function(origin, dest) {
      var d = $q.defer();
      var el = this;
      mapsClient.directions({
        origin: origin,
        destination: dest
      })
      .asPromise()
      .then(function(res) {
        var data = res.json;
        if(data.routes.length) {
          var route = data.routes[0];
          var leg = route.legs[0];
          var steps = [];
          var l = {};
          l.distance = leg.distance;
          l.duration = leg.duration;
          l.end_address = leg.end_address;
          l.via = (route.summary) ? route.summary: "";
          _.forEach(leg.steps, function(step) {
            var text = step.html_instructions;
            var stripped = text.replace(/(<([^>]+)>)/ig,"");
            var searchFor = "Destination will be";
            var replaceWith = "\r\n\r\nDestination will be";
            stripped = stripped.replace(searchFor, replaceWith);
            if(step.distance) {
              if(step.distance.text) {
                var dist = step.distance.text;
                stripped += " (" + dist + ")";
              }
            }
            steps.push(stripped);
          });
          var map = el.getMap(route);
          var t = {};
          t.steps = steps;
          t.map = map;
          t.details = l;
          t.duration = leg.duration;
          d.resolve(t);
        } else {
            d.resolve(false);
        }
      });
      return d.promise;
    },
    /**
     *
     * @function calculateDistance
     * @memberof placesAPI
     * @desc Will return the total
     * distance in miles from location
     */
    calculateDistance: function(place) {
       var latLng = place.geometry.location;
       var radLat1 = Math.PI * loc[0]/180;
       var radLat2 = Math.PI * latLng.lat/180;
       var radLon1 = Math.PI * loc[1]/180;
       var radLon2 = Math.PI * latLng.lng/180;
       var theta = loc[1]-latLng.lng;
       var radtheta = Math.PI * theta/180;
       var dist = Math.sin(radLat1) * Math.sin(radLat2) +
       Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radtheta);
       dist = Math.acos(dist)
       dist = dist * 180/Math.PI
       dist = dist * 60 * 1.1515
       dist = ((dist * 0.8684) * 100);
       return Math.floor(dist)/100; //miles
    },
    /**
     *
     * @function alexaResult
     * @memberof placesAPI
     * @desc Will return details
     * about the closest location
     */
     alexaResultNearest: function(query) {
       var d = $q.defer();
       var el = this;
       var returnText = "";
       returnText =  "The closest {{query}} ";
       returnText += "is about {{miles}} miles away ";
       returnText += "and is located at {{location}}";
       el.searchPlaces(query)
       .then(function(res) {
         if(!res) return false;
         var c = res[0];
         var placeId = c.place_id;
         el.getDetails(placeId)
         .then(function(res) {
            var a = res.formatted_address;
            var distance = el.calculateDistance(res);
            var r = returnText.replace('{{query}}', query);
            a = a.replace(", USA", "");
            r = r.replace('{{location}}', a);
            r = r.replace('{{miles}}', distance);
            var t = {};
            res.distance = distance;
            t.response = r;
            t.data = res;
            d.resolve(t);
         });
       })
       return d.promise;
     },
     /**
      *
      * @function alexaResultIsOpen
      * @memberof placesAPI
      * @desc Will check if the current
      * location is open
      *
      */
     alexaResultIsOpen: function(query) {
       var d = $q.defer();
       var el = this;
       var returnText = "";
       returnText =  "The closest {{query}} ";
       el.searchPlaces(query)
       .then(function(res) {
         if(!res) return false;
         var c = res[0];
         var placeId = c.place_id;
         el.getDetails(placeId)
         .then(function(res) {
            if(!res.opening_hours) {
              returnText = "Sorry, ";
              returnText += "could not ";
              returnText += "find operating hours ";
              returnText += "for {{query}}";
            }
            else {
              returnText += "is open ";
              if(res.opening_hours.periods) {
                var periods = res.opening_hours.periods;
                var day = moment().format('d');
                var cur = {};
                _.forEach(periods, function(val) {
                  if(val.close) {
                    if(val.close.day == day) {
                      cur = val.close;
                      var date = moment(cur.time, 'HHmm');
                      var f = date.format('h A');
                      returnText += "until " + f;
                    }
                  }
                });
              }
            }
            var r = returnText.replace("{{query}}", query);
            var t = {};
            t.response = r;
            t.data = res;
            d.resolve(t);
         });
       });
       return d.promise;
     },
     /**
      *
      * @function alexaResultPhone
      * @memberof placesAPI
      * @desc Will get the phone number
      * for a location
      *
      */
     alexaResultPhone: function(query) {
       var d = $q.defer();
       var el = this;
       var returnText = "";
       returnText =  "The phone number for the closest {{query}} ";
       el.searchPlaces(query)
       .then(function(res) {
         if(!res) return false;
         var c = res[0];
         var placeId = c.place_id;
         el.getDetails(placeId)
         .then(function(res) {
           if(!res.formatted_phone_number) {
             returnText = "Sorry, ";
             returnText += "could not ";
             returnText += "find phone number ";
             returnText += "for {{query}}";
           }
           else {
             var phone = res.formatted_phone_number;
             returnText += "is " + phone;
            }
            var r = returnText.replace('{{query}}', query);
            var t = {};
            t.response = r;
            t.data = res;
            d.resolve(t);
         });
       })
       return d.promise;
     },
     /**
      *
      * @function alexaResultDirections
      * @memberof placesAPI
      * @desc Will return directions
      * and format return text
      */
     alexaResultDirections: function(query) {
       var d = $q.defer();
       var el = this;
       var returnText = "";
       returnText =  "The directions for the closest {{query}} ";
       returnText += "that is about {{time}} away, ";
       returnText += "have been sent to your phone";
       el.searchPlaces(query)
       .then(function(res) {
         if(!res) d.resolve(false);
         var c = res[0];
         var placeId = c.place_id;
         el.getDetails(placeId)
         .then(function(res) {
            var a = res.formatted_address;
            // var distance = el.calculateDistance(res);
            // r = r.replace("{{distance}}", distance);
            var r = returnText.replace('{{query}}', query);
            el.getDirections(address, a)
            .then(function(res) {
              if(!res) d.resolve(false);
              if(res) {
                var time = res.duration.text;
                r = r.replace("{{time}}", time);
                var t = {};
                t.response = r;
                t.data = res;
                d.resolve(t);
              }
            });
         });
       })
       return d.promise;
     }
  };
};

module.exports = placesAPI;
