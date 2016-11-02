var Alexa       = require('alexa-sdk');
var placesAPI   = require('./places.js');
var _           = require('lodash');
var places      = new placesAPI();
var photo       = "https://maps.googleapis.com/";
photo          += "maps/api/place/photo?";
var key         = "GOOGLE_API_KEY"; // your google api key
var temp;
var handlers = {
  "AskNearestIntent": function() {
     var req = this.event.request;
     var slots = req.intent.slots;
     var p = slots.Place.value;
     var el = this;
     var cur = el.attributes['location'];
     var n = (slots.Location.value) ? slots.Location.value: cur;
     if((!slots.Location.value) && (!el.attributes['location'])) {
        el.emit("AskLocationIntent");
        return false;
     }
     if(p != null && p != undefined) {
       places.setLocation(n)
       .then(function() {
         places.alexaResultNearest(p)
         .then(function(res) {
           if(res) {
             var r = res.response;
             var d = res.data;
             var withImg = false;
             if(d.photos) {
               if(d.photos.length) {
                 withImg = true;
               }
             }
             var t = d.name;
             var img = {};
             if(withImg) {
               var reference = d.photos[0].photo_reference;
               var url = photo + "photo_reference=" + reference;
               url += "&key=" + key;
               var urlSmal = url + "&maxwidth=720";
               url += "&maxwidth=1200";
               img.smallImageUrl = urlSmal;
               img.largeImageUrl = url;
             }
             el.emit(":tellWithCard", r, t, r, img);
           }
         });
       });
     }
  },
  "AskHoursIntent": function() {
    var req = this.event.request;
    var slots = req.intent.slots;
    var p = slots.HoursPlace.value;
    var el = this;
    var cur = el.attributes['location'];
    var n = (slots.HoursLocation.value) ? slots.HoursLocation.value: cur;
    if((!slots.HoursLocation.value) && (!el.attributes['location'])) {
       el.emit("AskLocationIntent");
       return false;
    }
    if(p != null && p != undefined) {
      places.setLocation(n)
      .then(function() {
        places.alexaResultIsOpen(p)
        .then(function(res) {
          if(res) {
            var r = res.response;
            var d = res.data;
            var t = d.name;
            el.emit(":tellWithCard", r, t, r);
          }
        });
      });
    }
  },
  "AskPhoneIntent": function() {
    var req = this.event.request;
    var slots = req.intent.slots;
    var p = slots.PhonePlace.value;
    var el = this;
    var cur = el.attributes['location'];
    var n = (slots.PhoneLocation.value) ? slots.PhoneLocation.value: cur;
    if((!slots.PhoneLocation.value) && (!el.attributes['location'])) {
       el.emit("AskLocationIntent");
       return false;
    }
    if(p != null && p != undefined) {
      places.setLocation(n)
      .then(function() {
        places.alexaResultPhone(p)
        .then(function(res) {
          if(res) {
            var r = res.response;
            var d = res.data;
            var t = d.name;
            el.emit(":tellWithCard", r, t, r);
          }
        });
      });
    }
  },
  "AskDirectionsIntent": function() {
    var req = this.event.request;
    var slots = req.intent.slots;
    var p = slots.DirectionsPlace.value;
    var el = this;
    var cur = el.attributes['location'];
    var n = (slots.DirectionsLocation.value) ? slots.DirectionsLocation.value: cur;
    if((!slots.DirectionsLocation.value) && (!el.attributes['location'])) {
       el.emit("AskLocationIntent");
       return false;
    }
    if(p != null && p != undefined) {
      places.setLocation(n)
      .then(function() {
        places.alexaResultDirections(p)
        .then(function(res) {
          if(res) {
            var r = res.response;
            var d = res.data;
            var t = "Directions to " + p;
            var img = {};
            img.smallImageUrl = d.map.small;
            img.largeImageUrl = d.map.large;
            var s = "";
            var num = 1;
            _.forEach(d.steps, function(step) {
               s += num + ".) " + step + "\r\n";
               num++;
            });
            el.emit(":tellWithCard", r, t, s, img);
          }
        });
      });
    }
  },
  "AskLocationIntent": function() {
     var m = "Your location is not currently set, to continue ";
     m += "please say your address or zip code for ";
     m += "accurate results.";
     var zip = "Please say your zip code";
     this.handler.state = '_RECIEVE';
     this.emit(":ask", m, zip);
  },
  "SetLocationIntent": function() {
     var req = this.event.request;
     var slots = req.intent.slots;
     var el = this;
     if(slots.LocationAnswer.value) {
       var l = String(slots.LocationAnswer.value);
       l = l.replace(",", "");
       places.fetchLocation(l)
       .then(function(res) {
         if(res) {
           var a = res.formatted_address;
           temp = a;
           var message = "Thank you, I got " + a + ", ";
           message += "is that correct?";
           el.handler.state = "_VERIFY";
           el.emit(":ask", message, message);
         }
       });
     }
  },
  "GetLocationIntent": function() {
    var el = this;
    var location = this.attributes['location'];
    if(location) {
      var res = "Your location is currently set ";
      res += "to " + location;
      var t = "Your current location";
      el.emit(":tellWithCard", res, t, res);
    } else {
      el.emit("AskLocationIntent");
    }
  },
  "Unhandled":function() {
    var message = "Sorry, I could not understand ";
    message += "your request. Please try again. ";
    this.emit(":tell", message);
  }
};

var recieveModeHandlers = Alexa.CreateStateHandler('_RECIEVE', {
  "RecieveLocationIntent": function() {
     var el = this;
     var req = this.event.request;
     var slots = req.intent.slots;
     if(slots.LocationResponse.value) {
        var val = slots.LocationResponse.value;
        places.fetchLocation(val)
        .then(function(res) {
          if(res) {
            var a = res.formatted_address;
            temp = a;
            var message = "Thank you, I got " + a + ", ";
            message += "is that correct?";
            el.handler.state = "_VERIFY";
            el.emit(":ask", message, message);
          }
        });
     }
  },
  "Unhandled": function() {
     var message = "Sorry, I didn't get that. Please try again";
     this.handler.state = "_RECIEVE";
     this.emit(":ask", message, message);
  }
});

var verifyModeHandlers = Alexa.CreateStateHandler("_VERIFY", {
  "VerifyLocationIntent": function() {
    var req = this.event.request;
    var slots = req.intent.slots;
    var el = this;
    if(slots.VerifyResponse.value) {
       var response = slots.VerifyResponse.value;
       if(response == 'Yes' || response == 'yes') {
         var message = "Great! Thank you, location ";
         message += "has been saved.";
         el.attributes['location'] = temp;
         this.emit(":tell", message, message);
       } else if(response == 'No' || response == 'no') {
         var message = "Sorry about that, ";
         message += "please try saying your address ";
         message += "or zip code again.";
         this.handler.state = "_RECIEVE";
         this.emit(":ask", message, message);
       } else {
          this.emit("Unhandled");
       }
     } else {
        this.emit("Unhandled");
     }
  },
  "Unhandled": function() {
    var message = "Sorry, I didn't get that. ";
    message += "Please try again.";
    this.emit(":ask", message, message);
  }
});

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  var appId = "ALEXA_APP_ID"; //your app ID
  alexa.appId = appId;
  alexa.dynamoDBTableName = "alexaStorage";
  alexa.registerHandlers(handlers, recieveModeHandlers, verifyModeHandlers);
  alexa.execute();
};
