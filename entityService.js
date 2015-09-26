'use strict';

/**
 * @fileoverview Registry of updatable entities.
 */
angular.module('demo')
  .factory('EntityService',
    function(EventService) {
      /**
       * Client-side game object.
       * ( declaring the class inside the object factory, gives us access to dependency injections. )
       * @param {string} id Unique id for the object.
       * @param {string} type Class name of the object.
       * @constructor
       */
      var Entity = function(id, type) {
        if (!id) {
          throw "missing id";
        }
        /**
         * Unique id.
         * @const  {string}
         */
        this.id = id;
        /**
         * Story defined class.
         * @const  {string}
         */
        this.type = type;
        /**
         * The current value of the object's enumerated properties in one helpful list
         * @type  {Array.<string>}
         */
        this.name = "pending:" + this.id;
        /**
         * Story defined attributes.
         * @type  {Object}
         */
        this.attr = {};
        /**
         * The current value of the object's enumerated properties in one helpful list
         * @type  {Array.<string>}
         */
        this.states = [];
        /**
         * Most recent update received from the server.
         * ( Race protection from simultaneous GETs. )
         * @type  {int}
         */
        this.frame = -1;
        /**
         * Relationships are built dynamically
         * Currently, they point one-way from primary to secondary
         + If that ever needs to change, a relation service might be better.
         * @type {Object.<string,Array<Entity>>}
         */
        this.relations = {};
      };

      Entity.prototype.created = function() {
        return this.frame >= 0;
      };

      Entity.prototype.createOrUpdate = function(frame, data) {
        if (this.frame < 0) {
          this.create(frame, data);
        } else {
          this.updateData(frame, data);
        }
        return this;
      };

      /**
       * Setup the object's initial fields from the passed data;
       * starts listening for changes about this object via the event service.
       * @param {Object} data - jsonapi-ish data.
       * @returns {Entity} - itself.
       */
      Entity.prototype.create = function(frame, data) {
        if (this.frame >= 0) {
          throw "multiple creates received for:" + this.id;
        }

        // setup data
        if (data) {
          this._validate(data, "create");
          this.attr = data.attr
          this.states = data.meta['states'] || [];
          this.name = data.meta['name'] || ("unnamed:" + this.id);
        }

        // subscribe to events
        var that = this;
        EventService.listen(this, "x-set", function(src) {
          that._handleSet(src);
        });
        EventService.listen(this, ["x-txt", "x-num"], function(src) {
          that.updateData(src.frame, src.data);
        });

        // finalize create
        this.frame = frame || 0;

        return this;
      };

      // triggered via runService())
      Entity.prototype._handleSet = function(src) {
        // FIX: when do we update this object's frame -- wouldnt that be something global, not per object?
        if (src.frame < this.frame) {
          $log.warn("skipping events for frame:", src.frame, ", this:", this.frame);
        } else {
          var data = src.data;
          var meta = data.meta;
          var v = meta["change-states"];
          if (v) {
            var was = v[0];
            var now = v[1];
            this.states = this.states.filter(function(value) {
              return value != was;
            });
            this.states.push(now);
          }
        } // else, frame
      }; // handle event;

      Entity.prototype._validate = function(obj, reason) {
        if ((obj.id != this.id) || (obj.type != this.type)) {
          throw "mismatched ids! " + reason + " was:" + this.id + " " + this.type +
            ", now:" + obj.id + " " + obj.type;
        }
      };

      /**
       * Apply new data ( ex. from a get or post )
       * attributes are applied directly, metadata contain commands to update the object.
       * @param {frame:number, data} frameData data is a jsonapi object.
       * @returns {Object|undefined} promise.
       */
      Entity.prototype.updateData = function(frame, obj) {
        // _validate data
        this._validate(obj, "updateData");

        // silent ignore events in frames before the object is fully created.
        if (this.frame >= 0) {
          if (frame < this.frame) {
            $log.warn("rejecting stale frame", this, frame);
          } else {
            this.frame = frame;
            // merge data:
            var attr = obj.attr;
            for (var k in attr) {
              var v = attr[k];
              this.attr[k] = v;
            }
          }
        }
        return this;
      };

      /**Object.<string, Entity>*/
      var entities= {};

      var entityService = {
        // create, ensure the existance of an object box.
        // starts listening for object changes, but doesnt request object data.
        getRef: function(ref) {
          var id = ref.id;
          var type = ref.type;
          var obj = entities[id];
          if (!obj) {
            obj = new Entity(id, type);
            entities[id] = obj;
          } else if (obj.type != type) {
            throw "type conflict detected!";
          }
          return obj;
        },

        // can return undefined.
        // mainly for testing.
        getById: function(id) {
          return entities[id];
        },
     
      }; // entityService.

      return entityService;
    }); // function,factory
