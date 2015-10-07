'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * Transfers location change events from the player game object to the angular/rootScope.
 */
angular.module('demo')
  .factory('LocationService',
    function(EventService, ObjectService, PlayerService,
      $location, $log, $q, $rootScope) {

      var changeRoom = function(room, view) {
        if (view==room) {
          throw new Error("invalid view", view);
        }
        $log.info("changing room", room, view ? view : "");
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
              $log.info("wantUrl", wantUrl);
              defer.resolve(newUrl);
            } else {
              var reason = "wanted " + wantUrl + " received " + newUrl;
              $log.info("failed url", reason);
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
        $log.info("player relation changed", data);
        if (data['prop'] == "whereabouts") {
          $log.info("requesting location");
          ObjectService.getObjects(player, "whereabouts").then(function(arr) {
            var loc = arr[0];
            return changeRoom(loc.id);
          });
        }
      });

      var fetchContents = function(room) {
        $log.info("fetching", room, "contents");
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
          var promise = fetchContents(room).then(function(props) {
            refresh(props);
            $log.info("listening to content changes for", room);
            //
            var ch = EventService.listen(room, "x-rev", function(data) {
              var is = data["prop"] == "contents";
              $log.info("rel changes for", room, is);
              if (is) {
                fetchContents(room).then(refresh);
              }
            });
            return ch;
          });
          // return a function that, when called, will destroy the event listener
          return function() {
            promise.then(function(ch) {
              $log.info("killing content changes for", room);
              EventService.remove(ch);
            });
          };
        },
        // NOTE: $location has $locationChangeStart
        // and it can be preventDefaulted if needed.
        room: function() {
          return parse(1, "r");
        },
        changeRoom: changeRoom,
        view: function(view) {
          return parse(3, "v");
        },
        changeView: function(view) {
          var room = locationService.room();
          return changeRoom(room, view);
        },
      };
      return locationService;
    }
  );
