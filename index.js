var Alexa       = require('alexa-sdk');
var placesAPI   = require('./places.js');
var _           = require('lodash');
var places      = new placesAPI();
var photo       = "https://maps.googleapis.com/";
photo          += "maps/api/place/photo?";
var key         = "GOOGLE_API_KEY"; //your google api key
var temp;

var promptLocation = function(el) {
  var m = "Your location is not currently set, to continue ";
  m += "please say your address or zip code for ";
  m += "accurate results.";
  var zip = "Please say your zip code";
  el.handler.state = '_RECIEVE';
  el.emit(":ask", m, zip);
};

var handleError = function(el) {
  var m = "Sorry I didn't catch that. ";
  m += "Please try saying again. ";
  el.emit(":ask", m, m);
};

var handlers = {
  "AskNearestIntent": function() {
     var req = this.event.request;
     var slots = req.intent.slots;
     var p = slots.Place.value;
     var el = this;
     var cur = el.attributes['location'];
     var n = (slots.Location.value) ? slots.Location.value: cur;
     if((!slots.Location.value) && (!el.attributes['location'])) {
        promptLocation(el);
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
             var card = d.name + "\r\n";
             card += d.formatted_address + "\r\n";
             if(d.formatted_phone_number) {
               card += d.formatted_phone_number + "\r\n";
             }
             card += d.distance + " miles away\r\n";
             card += places.fetchRating(d);
             card += '\r\n';
             if(d.opening_hours) {
               if(d.opening_hours.weekday_text) {
                 card += "\r\n" + places.fetchHours(d);
               }
             }
             card += '\r\n\r\nNeed directions? Try saying ';
             card += "'Alexa, ask nearby places for directions to ";
             card += p + "'";
             var title = d.name;
             var img = {};
             if(withImg) {
               var reference = d.photos[0].photo_reference;
               places.fetchResource(reference)
               .then(function(src) {
                 img.smallImageUrl = src;
                 img.largeImageUrl = src;
                 el.emit(":tellWithCard", r, title, card, img);
               });
             } else {
               el.emit(":tellWithCard", r, title, card, img);
             }
           }
         });
       });
     }
     else {
       handleError(el);
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
       promptLocation(el);
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
    else {
      handleError(el);
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
       promptLocation(el);
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
    else {
      handleError(el);
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
       promptLocation(el);
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
            var details = d.details;
            var t = "Directions to " + p;
            var img = {};
            img.smallImageUrl = d.map.small;
            img.largeImageUrl = d.map.large;
            var s = "";
            var num = 1;
            var duration = details.duration.text;
            var dist = details.distance.text;
            // s += details.end_address + "\r\n";
            s += duration + " (" + dist + ") ";
            if(details.via) {
              s += "via " + details.via;
            }
            s += "\r\n \r\n";
            _.forEach(d.steps, function(step) {
               s += num + ".) " + step + "\r\n \r\n";
               num++;
            });
            el.emit(":tellWithCard", r, t, s, img);
          }
          else {
            var m = "Sorry, I am unable to get ";
            m += "accurate directions to " + p + ".";
            el.emit(":tell", m, m);
          }
        });
      });
    }
    else {
      handleError(el);
    }
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
     else {
       var m = "Sorry I didn't catch your ";
       m += "location. Please try saying: ";
       m += "Set location to, followed by your ";
       m += "zip code or address. ";
       el.emit(":ask", m, m);
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
      promptLocation(el);
    }
  },
  "AMAZON.CancelIntent": function() {
    var el = this;
    el.emit(":tell", "", "");
  },
  "AMAZON.StopIntent": function() {
    var el = this;
    el.emit(":tell", "", "");
  },
  "AMAZON.HelpIntent": function() {
    var el = this;
    promptHelp(el);
  },
  "LaunchRequest": function() {
    var m = "The places skill allows ";
    m += "you to ask for directions, location information, ";
    m += "and hours of operation. For a list of available commands, ";
    m += "Please say help. You can also say cancel or stop ";
    m += "at any time to exit. What would you like to do?";
    var r = "What would you like to do?";
    this.emit(":ask", m, m);
  },
  "Unhandled":function() {
    var message = "Sorry, I could not understand ";
    message += "your request. Please try again. ";
    this.emit(":ask", message, message);
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

var promptHelp = function(el) {
  var m = "Here are a few examples of things you can say: ";
  m += "where is the closest Target, how can I get ";
  m += "to the closest Walgreens, what is the phone number";
  m += "for the closest Pizza Hut, what is my location. ";
  m += "What would you like to do?";
  el.emit(":ask", m, m);
};

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
