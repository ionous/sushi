'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * Transfers location change events from the player game object to the angular/rootScope.
 */
angular.module('demo')
  .factory('LocationService',
    function(EventService, ObjectService, PlayerService,
      $location, $log, $q, $rootScope) {

      var changeLocation = function(room, view) {
        if (view == room) {
          throw new Error("invalid view", view);
        }
        // by changing the location, the router in demo.js will re-layout game.html
        $log.info("LocationService: changing", room, view ? view : "");
        // want the url: /r/room/v/view
        var p = ["", "r", room].concat(view ? ["v", view] : []);
        var wantUrl = p.join("/");
        // 
        var defer = $q.defer();
        if ($location.url() == wantUrl) {
          defer.resolve(wantUrl);
        } else {
          // report once we have succesfully changed locations.
          // note: there's no failure event, so... that's grand.
          var rub = $rootScope.$on("$locationChangeSuccess", function(evt) {
            var newUrl = $location.url(); // location success passes full url, we want the parsed url
            if (newUrl == wantUrl) {
              $log.debug("LocationService: wantUrl", wantUrl);
              defer.resolve(newUrl);
            } else {
              var reason = "wanted " + wantUrl + " received " + newUrl;
              $log.error("LocationService: failed url", reason);
              defer.reject(reason);
            }
            rub();
          });
          // change it.
          $location.url(wantUrl);
        }
        return defer.promise;
      }

      // whenever the player location changes, change the browser location
      var player = PlayerService.getPlayer();
      EventService.listen("player", "x-rel", function(data) {
        if (data['prop'] == "whereabouts" && data['next']) {
          $log.debug("LocationService: requesting player location");
          ObjectService.getObjects(player, "whereabouts").then(function(arr) {
            var loc = arr[0];
            return changeLocation(loc.id);
          });
        }
      });

      var fetchContents = function(room) {
        $log.debug("LocationService: fetching", room, "contents");
        return ObjectService.getObjects({
            id: room,
            type: "rooms"
          }, 'contents')
          .then(function(contents) {
            var props = {};
            contents.map(function(prop) {
              props[prop.id] = prop;
            });
            // locData.id = room.id;
            // locData.room = room;
            // locData.contents = props;
            return props;
          })
      };

      //$location.path()
      var parse = function(path, sep) {
        var p = $location.path().split("/");
        return p[path] == sep ? p[path + 1] : null;
      };
      var locationService = {

        // pass contents of this room to the refresh function whenever the contents changes.
        fetchContents: function(refresh) {
          var room = locationService.room();
          var handler = EventService.listen(room, "x-rev", function(data) {
            var prop = data["prop"];
            var iscontent = prop == "contents";
            $log.debug("LocationService: x-rev for", room, prop);
            if (iscontent) {
              var curRoom = locationService.room();
              if (curRoom != room) {
                $log.debug("LocationService: ignoring fetch for old room");
              } else {
                fetchContents(room).then(function(contents) {
                  var nowRoom = locationService.room();
                  if (nowRoom != room) {
                    $log.debug("LocationService: ignoring refresh for old room");
                  } else {
                    refresh(contents);
                  }
                }); //fetch
              } // same room
            } // is content
          });
          // initial request:
          fetchContents(room).then(function(contents) {
            if (!!handler) {
              refresh(contents);
            }
          });
          // return a function that, when called, will destroy the event listener
          return function() {
            $log.debug("LocationService: killing content changes for", room);
            EventService.remove(handler);
            handler = null;
          };
        },
        // NOTE: $location has $locationChangeStart
        // and it can be preventDefaulted if needed.
        room: function() {
          return parse(1, "r");
        },
        changeRoom: changeLocation,
        view: function(view) {
          return parse(3, "v");
        },
        changeView: function(view) {
          var room = locationService.room();
          return changeLocation(room, view);
        },
      };
      return locationService;
    }
  );
