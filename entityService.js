'use strict';

/**
 * @fileoverview Registry of updatable entities.
 */
angular.module('demo')
  .factory('EntityService',
    function(EventService, EventStreamService, $log, $timeout) {
      /**
       * Client-side game object.
       * ( declaring the class inside the object factory, gives us access to dependency injections. )
       * @param {string} id Unique id for the object.
       * @param {string} type Class name of the object.
       * @constructor
       */
      var Entity = function(id, type) {
        if (!id) {
          throw new Error("missing id");
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
        this.classInfo = {};
      };

      Entity.prototype.is = function(state) {
        return this.states.indexOf(state) >= 0;
      };

      Entity.prototype.created = function() {
        return this.frame >= 0;
      };

      Entity.prototype.createOrUpdate = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
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
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        if (this.frame >= 0) {
          // throw new Error("multiple creates received for:" + this.id);
          return;
        }

        // setup data
        if (data) {
          this._validate(data, "create");
          this.attr = data.attr;
          this.states = data.meta['states'] || [];
          this.name = data.meta['name'] || ("unnamed:" + this.id);
        }

        var call = function(that, f, args) {
          var data = args[0];
          var tgt = args[1];
          var evt = args[2];
          var frame = EventStreamService.currentFrame();
          //$log.debug("EntityService:", evt, tgt, frame, data);
          f.call(that, frame, data);
        }

        // subscribe to events
        var that = this;
        EventService.listen(this.id, 'x-set', function() {
          call(that, that.x_set, arguments);
        });
        EventService.listen(this.id, 'x-rel', function() {
          call(that, that.x_rel, arguments);
        });
        EventService.listen(this.id, 'x-txt', function() {
          call(that, that.x_val, arguments);
        });
        EventService.listen(this.id, 'x-num', function() {
          call(that, that.x_val, arguments);
        });

        // finalize create
        this.frame = frame || 0;
        return this;
      };

      Entity.prototype.x_rel = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        var invRel = data['other'];
        if (invRel) {
          ['prev', 'next'].forEach(function(side) {
            var owner = data[side];
            if (owner) {
              // the x-rel generally tells us when an object has had its parent changed
              // generate x-rev so the parent can hear when its children have changed.
              $log.debug("EntityService:", "x-rev", owner.id, invRel);
              // FIX? when we change rooms, we get this x-rev change before the player whereabouts change, leading to a map refresh of the room we're leaving.
              $timeout(function() {
                EventService.raise(owner.id, 'x-rev', {
                  'prop': invRel
                });
              });
            }
          });
        }
      };

      Entity.prototype.changeState = function(now, was) {
        if (!angular.isUndefined(was)) {
          this.states = this.states.filter(function(value) {
            return value != was;
          });
        }
        this.states.push(now);
      };

      Entity.prototype.x_set = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        // FIX: when do we update this object's frame -- wouldnt this be something global, not per object?
        if (frame < this.frame) {
          $log.warn("EntityService:", "skipping events for frame:", frame, ", this:", this.frame);
        } else {
          this.changeState(data['next'], data['prev']);
        }
      };

      Entity.prototype.x_val = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        var p = data['prop'];
        var now = data['value'];

        // mimic a json-object so we can merge in the data changes
        var obj = {
          id: this.id,
          type: this.type,
          attr: {},
        };
        obj.attr[p] = now;
        this.updateData(frame, obj);
        //$log.debug("updating", this.id, " with ", p, "=", now);
      };

      Entity.prototype._validate = function(obj, reason) {
        if (!angular.isObject(obj)) {
          throw new Error("not an object " + reason);
        }

        if ((obj.id != this.id) || (obj.type != this.type)) {
          throw new Error("mismatched ids! " + reason + " was:" + this.id + " " + this.type +
            ", now:" + obj.id + " " + obj.type);
        }
      };

      /**
       * Apply new data ( ex. from a get or post )
       * attributes are applied directly, metadata contain commands to update the object.
       * @param {frame:number, data} frameData data is a jsonapi object.
       * @returns {Object|undefined} promise.
       */
      Entity.prototype.updateData = function(frame, obj) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        this._validate(obj, "updateData");

        // silent ignore events in frames before the object is fully created.
        if (this.frame >= 0) {
          if (frame < this.frame) {
            $log.warn("EntityService:", "rejecting stale frame", this.id, frame);
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
      var entities = {};

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
            throw new Error("type conflict detected!");
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
