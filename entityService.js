'use strict';

/**
 * @fileoverview Registry of updatable entities.
 */
angular.module('demo')
  .factory('EntityService',
    function(EventService, EventStreamService, $log, $timeout) {
      var containment = {
        "objects-wearer": "actors-clothing",
        "objects-owner": "actors-inventory",
        "objects-whereabouts": "rooms-contents",
        "objects-support": "supporters-contents",
        "objects-enclosure": "containers-contents",
      };

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
         * @type {Object.<string,Array<bool>>}
         */
        this.contents = {};
        this.clothing = {};
        this.inventory = {};
      };

      /**Object.<string, Entity>*/
      var entities = {};
      var entityService = {
        reset: function() {
          entities = {};
        },
        // create, ensure the existance of an object box.
        // starts listening for object changes, but doesnt request object data.
        getRef: function(ref) {
          if (!angular.isObject(ref) || !ref.id || !ref.type) {
            throw new Error("invalid ref");
          }
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
        getById: function(id) {
          var obj = entities[id];
          if (!obj) {
            throw new Error("couldnt find object: " + id);
          }
          return obj;
        },
      }; // entityService.

      Entity.prototype.is = function(state) {
        return this.states.indexOf(state) >= 0;
      };

      Entity.prototype.printedName = function() {
        return this.attr['kinds-printed-name'] || this.id.replace(/-/g, " ");
      };

      Entity.prototype.created = function() {
        return this.frame >= 0;
      };

      Entity.prototype.createOrUpdate = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        if (!this.created()) {
          this.create(frame, data);
        } else {
          this.updateData(frame, data);
        }
        return this;
      };

      Entity.prototype.addChild = function(child, list) {
        var contents = this[list];
        var existed = !!contents[child.id];
        //$log.debug("EntityService:", this.id, list, existed ? "replaced" : "added", "child", child.id);
        contents[child.id] = true;
        EventService.raise(this.id, 'x-mod', {
          'prop': list,
          'ent': this,
          'op': 'add',
          'child': child,
          adding: true,
        });
      };

      Entity.prototype.removeChild = function(child, list) {
        var contents = this[list];
        var ok = delete contents[child.id];
        //$log.debug("EntityService:", this.id, list, ok ? "removed" : "ignored", "child", child.id);
        EventService.raise(this.id, 'x-mod', {
          'prop': list,
          'ent': this,
          'op': 'rem',
          'child': child,
          removing: true,
        });
      };

      /**
       * Setup the object's initial fields from the passed data;
       * starts listening for changes about this object via the event service.
       * @param {Object} data - jsonapi-ish data.
       * @returns {Entity} - itself.
       */
      Entity.prototype.create = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("EntityService: frame is not a number");
        }
        if (this.created()) {
          // throw new Error("multiple creates received for:" + this.id);
          $log.error("EntityService: multiple creates received for:", this.id);
          return;
        }

        // setup data
        if (data) {
          this._validate(data, "create");
          this.attr = data.attr;
          this.states = data.meta['states'] || [];
          this.name = data.meta['name'] || ("unnamed:" + this.id);
        }

        // event helper
        var call = function(that, f, args) {
          var dat = args[0];
          var tgt = args[1];
          var evt = args[2];
          var frame = EventStreamService.currentFrame();
          //$log.debug("EntityService:", evt, tgt, frame, data);
          f.call(that, frame, dat);
        }

        // subscribe to events; these callback member methods
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

        // tell parent about us.
        for (var k in containment) {
          var c = containment[k];
          var shortName = c.slice(c.indexOf("-") + 1);

          var par = this.attr[k];
          if (par) {
            var newParent = entityService.getById(par);
            if (!newParent) {
              $log.error("EntityService:", this.id, "couldnt find parent", par);
            } else {
              newParent.addChild(this, shortName);
            }
            break;
          }
        }
        return this;
      };

      Entity.prototype.x_rel = function(frame, data) {
        if (!angular.isNumber(frame)) {
          throw new Error("frame is not a number");
        }
        // add/remove children on x_rel changes.
        var prop = data['prop'];
        var c = containment[prop];
        if (c) {
          var invRel = data['other'];
          if (c != invRel) {
            $log.error("EntityService: mismatched rel, want:", c, "got:", invRel);
          } else {
            var shortName = c.slice(c.indexOf("-") + 1);
            var prev = data['prev'];
            if (prev) {
              var oldParent = entityService.getRef(prev);
              oldParent.removeChild(this, shortName);
            }
            var next = data['next'];
            if (next) {
              var newParent = entityService.getRef(next);
              newParent.addChild(this, shortName);
            }
          }
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
          var prop = data['prop'];
          var now = data['next'];
          var was = data['prev'];
          this.attr[prop] = now;
          this.changeState(now, was);
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
          meta: {},
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
        if (this.created()) {
          if (frame < this.frame) {
            $log.warn("EntityService:", "rejecting stale frame", this.id, frame);
          } else {
            this.frame = frame;
            // merge data:
            var states = obj.meta['states'];
            if (states) {
              this.states = states;
            }

            var attr = obj.attr;
            for (var k in attr) {
              var v = attr[k];
              this.attr[k] = v;
            }
          }
        }
        return this;
      };

      return entityService;
    }); // function,factory
