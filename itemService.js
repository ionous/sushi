angular.module('demo')
  .factory('ItemService',
    function($http, $log) {
      'use strict';

      var promisedList = $http.get("/bin/item.list");
      // promisedList.then(function(resp) {
      //   $log.info("got image list", resp.data);
      // });
      var itemService = {
        defaultImage: "/bin/images/gift-small.png",
        getItemImage: function(name) {
          return promisedList.then(function(resp) {
            var ret;
            var itemList = resp.data;
            if (itemList) {
              var item = itemList[name];
              if (item) {
                var img = item.image;
                if (img) {
                  var src = img.source;
                  if (src) {
                    ret = "/bin/" + src;
                    //$log.info("ItemService:", name, "received", ret);
                  }
                }
              }
            }
            return ret || itemService.defaultImage;
          });
        },
      };
      return itemService;
    });
