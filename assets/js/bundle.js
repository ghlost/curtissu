(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.3.1';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
                                  * Stores initialized plugins.
                                  */
    _plugins: {},

    /**
                   * Stores generated unique ids for plugin instances
                   */
    _uuids: [],

    /**
                 * Returns a boolean for RTL support
                 */
    rtl: function rtl() {
      return $('html').attr('dir') === 'rtl';
    },
    /**
        * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
        * @param {Object} plugin - The constructor of the plugin.
        */
    plugin: function plugin(_plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(_plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = _plugin;
    },
    /**
        * @function
        * Populates the _uuids array with pointers to each individual plugin instance.
        * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
        * Also fires the initialization event for each plugin, consolidating repetitive code.
        * @param {Object} plugin - an instance of a plugin, usually `this` in context.
        * @param {String} name - the name of the plugin, passed as a camelCased string.
        * @fires Plugin#init
        */
    registerPlugin: function registerPlugin(plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {plugin.$element.attr('data-' + pluginName, plugin.uuid);}
      if (!plugin.$element.data('zfPlugin')) {plugin.$element.data('zfPlugin', plugin);}
      /**
                                                                                          * Fires when the plugin has initialized.
                                                                                          * @event Plugin#init
                                                                                          */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
        * @function
        * Removes the plugins uuid from the _uuids array.
        * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
        * Also fires the destroyed event for the plugin, consolidating repetitive code.
        * @param {Object} plugin - an instance of a plugin, usually `this` in context.
        * @fires Plugin#destroyed
        */
    unregisterPlugin: function unregisterPlugin(plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
                                                                               * Fires when the plugin has been destroyed.
                                                                               * @event Plugin#destroyed
                                                                               */.
      trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
        * @function
        * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
        * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
        * @default If no argument is passed, reflow all currently active plugins.
        */
    reInit: function reInit(plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins === 'undefined' ? 'undefined' : _typeof(plugins),
          _this = this,
          fns = {
            'object': function object(plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function string() {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function undefined() {
              this['object'](Object.keys(_this._plugins));
            } };

          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
        * returns a random base-36 uid with namespacing
        * @function
        * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
        * @param {String} namespace - name of plugin to be incorporated in uid, optional.
        * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
        * @returns {String} - unique id
        */
    GetYoDigits: function GetYoDigits(length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
        * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
        * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
        * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
        */
    reflow: function reflow(elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
          opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {return el.trim();});
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function transitionend($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend' };

      var elem = document.createElement('div'),
      end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    } };


  Foundation.util = {
    /**
                       * Function for applying a debounce effect to a function call.
                       * @function
                       * @param {Function} func - Function to be called at end of timeout.
                       * @param {Number} delay - Time in ms to delay the call of `func`.
                       * @returns function
                       */
    throttle: function throttle(func, delay) {
      var timer = null;

      return function () {
        var context = this,args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    } };


  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function foundation(method) {
    var type = typeof method === 'undefined' ? 'undefined' : _typeof(method),
    $meta = $('meta.foundation-mq'),
    $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {//needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {//an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {//make sure both the class and method exist
        if (this.length === 1) {//if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {//otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {//error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {//error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now)
    window.Date.now = Date.now = function () {return new Date().getTime();};

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] ||
      window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) ||
    !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {callback(lastTime = nextTime);},
        nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
       * Polyfill for performance.now, required by rAF
       */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function now() {return Date.now() - this.start;} };

    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function fNOP() {},
      fBound = function fBound() {
        return fToBind.apply(this instanceof fNOP ?
        this :
        oThis,
        aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else
    if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else
    {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if ('true' === str) return true;else
    if ('false' === str) return false;else
    if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

}(jQuery);

},{}],2:[function(require,module,exports){
'use strict';var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

!function ($) {

  /**
                * OffCanvas module.
                * @module foundation.offcanvas
                * @requires foundation.util.keyboard
                * @requires foundation.util.mediaQuery
                * @requires foundation.util.triggers
                * @requires foundation.util.motion
                */var

  OffCanvas = function () {
    /**
                            * Creates a new instance of an off-canvas wrapper.
                            * @class
                            * @fires OffCanvas#init
                            * @param {Object} element - jQuery object to initialize.
                            * @param {Object} options - Overrides to the default plugin settings.
                            */
    function OffCanvas(element, options) {_classCallCheck(this, OffCanvas);
      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();
      this.$triggers = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
      Foundation.Keyboard.register('OffCanvas', {
        'ESCAPE': 'close' });


    }

    /**
       * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
       * @function
       * @private
       */_createClass(OffCanvas, [{ key: '_init', value: function _init()
      {
        var id = this.$element.attr('id');

        this.$element.attr('aria-hidden', 'true');

        this.$element.addClass('is-transition-' + this.options.transition);

        // Find triggers that affect this element and add aria-expanded to them
        this.$triggers = $(document).
        find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').
        attr('aria-expanded', 'false').
        attr('aria-controls', id);

        // Add an overlay over the content if necessary
        if (this.options.contentOverlay === true) {
          var overlay = document.createElement('div');
          var overlayPosition = $(this.$element).css("position") === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
          overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
          this.$overlay = $(overlay);
          if (overlayPosition === 'is-overlay-fixed') {
            $('body').append(this.$overlay);
          } else {
            this.$element.siblings('[data-off-canvas-content]').append(this.$overlay);
          }
        }

        this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

        if (this.options.isRevealed === true) {
          this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
          this._setMQChecker();
        }
        if (!this.options.transitionTime === true) {
          this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas]')[0]).transitionDuration) * 1000;
        }
      }

      /**
         * Adds event handlers to the off-canvas wrapper and the exit overlay.
         * @function
         * @private
         */ }, { key: '_events', value: function _events()
      {
        this.$element.off('.zf.trigger .zf.offcanvas').on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'keydown.zf.offcanvas': this._handleKeyboard.bind(this) });


        if (this.options.closeOnClick === true) {
          var $target = this.options.contentOverlay ? this.$overlay : $('[data-off-canvas-content]');
          $target.on({ 'click.zf.offcanvas': this.close.bind(this) });
        }
      }

      /**
         * Applies event listener for elements that will reveal at certain breakpoints.
         * @private
         */ }, { key: '_setMQChecker', value: function _setMQChecker()
      {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          } else {
            _this.reveal(false);
          }
        }).one('load.zf.offcanvas', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          }
        });
      }

      /**
         * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
         * @param {Boolean} isRevealed - true if element should be revealed.
         * @function
         */ }, { key: 'reveal', value: function reveal(
      isRevealed) {
        var $closer = this.$element.find('[data-close]');
        if (isRevealed) {
          this.close();
          this.isRevealed = true;
          this.$element.attr('aria-hidden', 'false');
          this.$element.off('open.zf.trigger toggle.zf.trigger');
          if ($closer.length) {$closer.hide();}
        } else {
          this.isRevealed = false;
          this.$element.attr('aria-hidden', 'true');
          this.$element.on({
            'open.zf.trigger': this.open.bind(this),
            'toggle.zf.trigger': this.toggle.bind(this) });

          if ($closer.length) {
            $closer.show();
          }
        }
      }

      /**
         * Stops scrolling of the body when offcanvas is open on mobile Safari and other troublesome browsers.
         * @private
         */ }, { key: '_stopScrolling', value: function _stopScrolling(
      event) {
        return false;
      }

      // Taken and adapted from http://stackoverflow.com/questions/16889447/prevent-full-page-scrolling-ios
      // Only really works for y, not sure how to extend to x or if we need to.
    }, { key: '_recordScrollable', value: function _recordScrollable(event) {
        var elem = this; // called from event handler context with this as elem

        // If the element is scrollable (content overflows), then...
        if (elem.scrollHeight !== elem.clientHeight) {
          // If we're at the top, scroll down one pixel to allow scrolling up
          if (elem.scrollTop === 0) {
            elem.scrollTop = 1;
          }
          // If we're at the bottom, scroll up one pixel to allow scrolling down
          if (elem.scrollTop === elem.scrollHeight - elem.clientHeight) {
            elem.scrollTop = elem.scrollHeight - elem.clientHeight - 1;
          }
        }
        elem.allowUp = elem.scrollTop > 0;
        elem.allowDown = elem.scrollTop < elem.scrollHeight - elem.clientHeight;
        elem.lastY = event.originalEvent.pageY;
      } }, { key: '_stopScrollPropagation', value: function _stopScrollPropagation(

      event) {
        var elem = this; // called from event handler context with this as elem
        var up = event.pageY < elem.lastY;
        var down = !up;
        elem.lastY = event.pageY;

        if (up && elem.allowUp || down && elem.allowDown) {
          event.stopPropagation();
        } else {
          event.preventDefault();
        }
      }

      /**
         * Opens the off-canvas menu.
         * @function
         * @param {Object} event - Event object passed from listener.
         * @param {jQuery} trigger - element that triggered the off-canvas to open.
         * @fires OffCanvas#opened
         */ }, { key: 'open', value: function open(
      event, trigger) {
        if (this.$element.hasClass('is-open') || this.isRevealed) {return;}
        var _this = this;

        if (trigger) {
          this.$lastTrigger = trigger;
        }

        if (this.options.forceTo === 'top') {
          window.scrollTo(0, 0);
        } else if (this.options.forceTo === 'bottom') {
          window.scrollTo(0, document.body.scrollHeight);
        }

        /**
           * Fires when the off-canvas menu opens.
           * @event OffCanvas#opened
           */
        _this.$element.addClass('is-open');

        this.$triggers.attr('aria-expanded', 'true');
        this.$element.attr('aria-hidden', 'false').
        trigger('opened.zf.offcanvas');

        // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
        if (this.options.contentScroll === false) {
          $('body').addClass('is-off-canvas-open').on('touchmove', this._stopScrolling);
          this.$element.on('touchstart', this._recordScrollable);
          this.$element.on('touchmove', this._stopScrollPropagation);
        }

        if (this.options.contentOverlay === true) {
          this.$overlay.addClass('is-visible');
        }

        if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
          this.$overlay.addClass('is-closable');
        }

        if (this.options.autoFocus === true) {
          this.$element.one(Foundation.transitionend(this.$element), function () {
            _this.$element.find('a, button').eq(0).focus();
          });
        }

        if (this.options.trapFocus === true) {
          this.$element.siblings('[data-off-canvas-content]').attr('tabindex', '-1');
          Foundation.Keyboard.trapFocus(this.$element);
        }
      }

      /**
         * Closes the off-canvas menu.
         * @function
         * @param {Function} cb - optional cb to fire after closure.
         * @fires OffCanvas#closed
         */ }, { key: 'close', value: function close(
      cb) {
        if (!this.$element.hasClass('is-open') || this.isRevealed) {return;}

        var _this = this;

        _this.$element.removeClass('is-open');

        this.$element.attr('aria-hidden', 'true')
        /**
                                                   * Fires when the off-canvas menu opens.
                                                   * @event OffCanvas#closed
                                                   */.
        trigger('closed.zf.offcanvas');

        // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
        if (this.options.contentScroll === false) {
          $('body').removeClass('is-off-canvas-open').off('touchmove', this._stopScrolling);
          this.$element.off('touchstart', this._recordScrollable);
          this.$element.off('touchmove', this._stopScrollPropagation);
        }

        if (this.options.contentOverlay === true) {
          this.$overlay.removeClass('is-visible');
        }

        if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
          this.$overlay.removeClass('is-closable');
        }

        this.$triggers.attr('aria-expanded', 'false');

        if (this.options.trapFocus === true) {
          this.$element.siblings('[data-off-canvas-content]').removeAttr('tabindex');
          Foundation.Keyboard.releaseFocus(this.$element);
        }
      }

      /**
         * Toggles the off-canvas menu open or closed.
         * @function
         * @param {Object} event - Event object passed from listener.
         * @param {jQuery} trigger - element that triggered the off-canvas to open.
         */ }, { key: 'toggle', value: function toggle(
      event, trigger) {
        if (this.$element.hasClass('is-open')) {
          this.close(event, trigger);
        } else
        {
          this.open(event, trigger);
        }
      }

      /**
         * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
         * @function
         * @private
         */ }, { key: '_handleKeyboard', value: function _handleKeyboard(
      e) {var _this2 = this;
        Foundation.Keyboard.handleKey(e, 'OffCanvas', {
          close: function close() {
            _this2.close();
            _this2.$lastTrigger.focus();
            return true;
          },
          handled: function handled() {
            e.stopPropagation();
            e.preventDefault();
          } });

      }

      /**
         * Destroys the offcanvas plugin.
         * @function
         */ }, { key: 'destroy', value: function destroy()
      {
        this.close();
        this.$element.off('.zf.trigger .zf.offcanvas');
        this.$overlay.off('.zf.offcanvas');

        Foundation.unregisterPlugin(this);
      } }]);return OffCanvas;}();


  OffCanvas.defaults = {
    /**
                          * Allow the user to click outside of the menu to close it.
                          * @option
                          * @type {boolean}
                          * @default true
                          */
    closeOnClick: true,

    /**
                         * Adds an overlay on top of `[data-off-canvas-content]`.
                         * @option
                         * @type {boolean}
                         * @default true
                         */
    contentOverlay: true,

    /**
                           * Enable/disable scrolling of the main content when an off canvas panel is open.
                           * @option
                           * @type {boolean}
                           * @default true
                           */
    contentScroll: true,

    /**
                          * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
                          * @option
                          * @type {number}
                          * @default 0
                          */
    transitionTime: 0,

    /**
                        * Type of transition for the offcanvas menu. Options are 'push', 'detached' or 'slide'.
                        * @option
                        * @type {string}
                        * @default push
                        */
    transition: 'push',

    /**
                         * Force the page to scroll to top or bottom on open.
                         * @option
                         * @type {?string}
                         * @default null
                         */
    forceTo: null,

    /**
                    * Allow the offcanvas to remain open for certain breakpoints.
                    * @option
                    * @type {boolean}
                    * @default false
                    */
    isRevealed: false,

    /**
                        * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
                        * @option
                        * @type {?string}
                        * @default null
                        */
    revealOn: null,

    /**
                     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
                     * @option
                     * @type {boolean}
                     * @default true
                     */
    autoFocus: true,

    /**
                      * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
                      * @option
                      * @type {string}
                      * @default reveal-for-
                      * @todo improve the regex testing for this.
                      */
    revealClass: 'reveal-for-',

    /**
                                 * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
                                 * @option
                                 * @type {boolean}
                                 * @default false
                                 */
    trapFocus: false


    // Window exports
  };Foundation.plugin(OffCanvas, 'OffCanvas');

}(jQuery);

},{}],3:[function(require,module,exports){
'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets


    /**
                            * Compares the dimensions of an element to a container and determines collision events with container.
                            * @function
                            * @param {jQuery} element - jQuery object to test for collisions.
                            * @param {jQuery} parent - jQuery object to use as bounding container.
                            * @param {Boolean} lrOnly - set to true to check left and right values only.
                            * @param {Boolean} tbOnly - set to true to check top and bottom values only.
                            * @default if no parent object passed, detects collisions with `window`.
                            * @returns {Boolean} - true if collision free, false if a collision in any direction.
                            */ };
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
    top,bottom,left,right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
    } else
    {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
      * Uses native methods to return an object of dimension values.
      * @function
      * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
      * @returns {Object} - nested object of integer pixel values
      * TODO - if element is window, return only those values.
      */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
    parRect = elem.parentNode.getBoundingClientRect(),
    winRect = document.body.getBoundingClientRect(),
    winY = window.pageYOffset,
    winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX },

      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX } },


      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX } } };



  }

  /**
     * Returns an object of top and left integer pixel values for dynamically rendered elements,
     * such as: Tooltip, Reveal, and Dropdown
     * @function
     * @param {jQuery} element - jQuery object for the element being positioned.
     * @param {jQuery} anchor - jQuery object for the element's anchor point.
     * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
     * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
     * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
     * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
     * TODO alter/rewrite to work with `em` values as well/instead of pixels
     */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
    $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset) };

        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top };

        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top };

        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset) };

        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset };

        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2 };

        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2 };

        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2 };

        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset };

      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top };

        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset };

        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset };

        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left + hOffset,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset };}


  }

}(jQuery);

},{}],4:[function(require,module,exports){
/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN' };


  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
                                  * Parses the (keyboard) event and returns a String that represents its key
                                  * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
                                  * @param {Event} event - the event generated by the event handler
                                  * @return String key - String that represents the key pressed
                                  */
    parseKey: function parseKey(event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();

      // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
      key = key.replace(/\W+/, '');

      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;

      // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
      key = key.replace(/_$/, '');

      return key;
    },

    /**
        * Handles the given (keyboard) event
        * @param {Event} event - the event generated by the event handler
        * @param {String} component - Foundation component's name, e.g. Slider or Reveal
        * @param {Objects} functions - collection of functions that are to be executed
        */
    handleKey: function handleKey(event, component, functions) {
      var commandList = commands[component],
      keyCode = this.parseKey(event),
      cmds,
      command,
      fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {// this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {// merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else

        cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {// execute function  if exists
        var returnValue = fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {// execute function when event was handled
          functions.handled(returnValue);
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {// execute function when event was not handled
          functions.unhandled();
        }
      }
    },

    /**
        * Finds all focusable elements within the given `$element`
        * @param {jQuery} $element - jQuery object to search within
        * @return {jQuery} $focusable - all focusable elements within `$element`
        */
    findFocusable: function findFocusable($element) {
      if (!$element) {return false;}
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {return false;} //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },

    /**
        * Returns the component name name
        * @param {Object} component - Foundation component, e.g. Slider or Reveal
        * @return String componentName
        */

    register: function register(componentName, cmds) {
      commands[componentName] = cmds;
    },

    /**
        * Traps the focus in the given element.
        * @param  {jQuery} $element  jQuery object to trap the foucs into.
        */
    trapFocus: function trapFocus($element) {
      var $focusable = Foundation.Keyboard.findFocusable($element),
      $firstFocusable = $focusable.eq(0),
      $lastFocusable = $focusable.eq(-1);

      $element.on('keydown.zf.trapfocus', function (event) {
        if (event.target === $lastFocusable[0] && Foundation.Keyboard.parseKey(event) === 'TAB') {
          event.preventDefault();
          $firstFocusable.focus();
        } else
        if (event.target === $firstFocusable[0] && Foundation.Keyboard.parseKey(event) === 'SHIFT_TAB') {
          event.preventDefault();
          $lastFocusable.focus();
        }
      });
    },
    /**
        * Releases the trapped focus from the given element.
        * @param  {jQuery} $element  jQuery object to release the focus for.
        */
    releaseFocus: function releaseFocus($element) {
      $element.off('keydown.zf.trapfocus');
    } };


  /*
          * Constants for easier comparing.
          * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
          */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {k[kcs[kc]] = kcs[kc];}
    return k;
  }

  Foundation.Keyboard = Keyboard;

}(jQuery);

},{}],5:[function(require,module,exports){
'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' +
    'only screen and (min--moz-device-pixel-ratio: 2),' +
    'only screen and (-o-min-device-pixel-ratio: 2/1),' +
    'only screen and (min-device-pixel-ratio: 2),' +
    'only screen and (min-resolution: 192dpi),' +
    'only screen and (min-resolution: 2dppx)' };


  var MediaQuery = {
    queries: [],

    current: '',

    /**
                  * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
                  * @function
                  * @private
                  */
    _init: function _init() {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        if (namedQueries.hasOwnProperty(key)) {
          self.queries.push({
            name: key,
            value: 'only screen and (min-width: ' + namedQueries[key] + ')' });

        }
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },

    /**
        * Checks if the screen is at least as wide as a breakpoint.
        * @function
        * @param {String} size - Name of the breakpoint to check.
        * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
        */
    atLeast: function atLeast(size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },

    /**
        * Checks if the screen matches to a breakpoint.
        * @function
        * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
        * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
        */
    is: function is(size) {
      size = size.trim().split(' ');
      if (size.length > 1 && size[1] === 'only') {
        if (size[0] === this._getCurrentSize()) return true;
      } else {
        return this.atLeast(size[0]);
      }
      return false;
    },

    /**
        * Gets the media query of a breakpoint.
        * @function
        * @param {String} size - Name of the breakpoint to get.
        * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
        */
    get: function get(size) {
      for (var i in this.queries) {
        if (this.queries.hasOwnProperty(i)) {
          var query = this.queries[i];
          if (size === query.name) return query.value;
        }
      }

      return null;
    },

    /**
        * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
        * @function
        * @private
        * @returns {String} Name of the current breakpoint.
        */
    _getCurrentSize: function _getCurrentSize() {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },

    /**
        * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
        * @function
        * @private
        */
    _watcher: function _watcher() {var _this = this;
      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize(),currentSize = _this.current;

        if (newSize !== currentSize) {
          // Change the current media query
          _this.current = newSize;

          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
        }
      });
    } };


  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit
    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
      script = document.getElementsByTagName('script')[0],
      info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script && script.parentNode && script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function matchMedium(media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        } };

    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all' };

    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;

}(jQuery);

},{}],6:[function(require,module,exports){
'use strict';

!function ($) {

  /**
                * Motion module.
                * @module foundation.motion
                */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function animateIn(element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function animateOut(element, animation, cb) {
      animate(false, element, animation, cb);
    } };


  function Move(duration, elem, fn) {
    var anim,prog,start = null;
    // console.log('called');

    if (duration === 0) {
      fn.apply(elem);
      elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      return;
    }

    function move(ts) {
      if (!start) start = ts;
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {anim = window.requestAnimationFrame(move, elem);} else
      {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
     * Animates an element in or out using a CSS transition class.
     * @function
     * @private
     * @param {Boolean} isIn - Defines if the animation is in or out.
     * @param {Object} element - jQuery or HTML object to animate.
     * @param {String} animation - CSS class to use.
     * @param {Function} cb - Callback to run when animation is finished.
     */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.
    addClass(animation).
    css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.
      css('transition', '').
      addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;

}(jQuery);

},{}],7:[function(require,module,exports){
'use strict';

!function ($) {

  var Nest = {
    Feather: function Feather(menu) {var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';
      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
      subMenuClass = 'is-' + type + '-submenu',
      subItemClass = subMenuClass + '-item',
      hasSubClass = 'is-' + type + '-submenu-parent';

      items.each(function () {
        var $item = $(this),
        $sub = $item.children('ul');

        if ($sub.length) {
          $item.
          addClass(hasSubClass).
          attr({
            'aria-haspopup': true,
            'aria-label': $item.children('a:first').text() });

          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if (type === 'drilldown') {
            $item.attr({ 'aria-expanded': false });
          }

          $sub.
          addClass('submenu ' + subMenuClass).
          attr({
            'data-submenu': '',
            'role': 'menu' });

          if (type === 'drilldown') {
            $sub.attr({ 'aria-hidden': true });
          }
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },

    Burn: function Burn(menu, type) {
      var //items = menu.find('li'),
      subMenuClass = 'is-' + type + '-submenu',
      subItemClass = subMenuClass + '-item',
      hasSubClass = 'is-' + type + '-submenu-parent';

      menu.
      find('>li, .menu, .menu > li').
      removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').
      removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    } };


  Foundation.Nest = Nest;

}(jQuery);

},{}],8:[function(require,module,exports){
'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
    duration = options.duration, //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
    remain = -1,
    start,
    timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        if (cb && typeof cb === 'function') {cb();}
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
     * Runs a callback function when images are fully loaded.
     * @param {Object} images - Image(s) to check if loaded.
     * @param {Func} callback - Function to execute when image is fully loaded.
     */
  function onImagesLoaded(images, callback) {
    var self = this,
    unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      // Check if image is loaded
      if (this.complete || this.readyState === 4 || this.readyState === 'complete') {
        singleImageLoaded();
      }
      // Force load the image
      else {
          // fix for IE. See https://css-tricks.com/snippets/jquery/fixing-load-in-ie-for-cached-images/
          var src = $(this).attr('src');
          $(this).attr('src', src + (src.indexOf('?') >= 0 ? '&' : '?') + new Date().getTime());
          $(this).one('load', function () {
            singleImageLoaded();
          });
        }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;

}(jQuery);

},{}],9:[function(require,module,exports){
'use strict'; //**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200 };


	var startPosX,
	startPosY,
	startTime,
	elapsedTime,
	isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {e.preventDefault();}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function setup() {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
             * Method for adding psuedo drag events to elements *
             ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function handleTouch(event) {
			var touches = event.changedTouches,
			first = touches[0],
			eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup' },

			type = eventTypes[event.type],
			simulatedEvent;


			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY });

			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);


//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/

},{}],10:[function(require,module,exports){
'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function triggers(el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else
    {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    var id = $(this).data('toggle');
    if (id) {
      triggers($(this), 'toggle');
    } else {
      $(this).trigger('toggle.zf.trigger');
    }
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
      * Fires once after all other scripts have loaded
      * @function
      * @private
      */
  $(window).on('load', function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    mutateListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
    plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
    $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').
      on('resize.zf.trigger', function (e) {
        if (timer) {clearTimeout(timer);}

        timer = setTimeout(function () {

          if (!MutationObserver) {//fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
    $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').
      on('scroll.zf.trigger', function (e) {
        if (timer) {clearTimeout(timer);}

        timer = setTimeout(function () {

          if (!MutationObserver) {//fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function mutateListener(debounce) {
    var $nodes = $('[data-mutate]');
    if ($nodes.length && MutationObserver) {
      //trigger all listening elements and signal a mutate event
      //no IE 9 or 10
      $nodes.each(function () {
        $(this).triggerHandler('mutateme.zf.trigger');
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {return false;}
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);

      //trigger the event handler for the element depending on type
      switch (mutationRecordsList[0].type) {

        case "attributes":
          if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          }
          if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
            $target.triggerHandler('resizeme.zf.trigger', [$target]);
          }
          if (mutationRecordsList[0].attributeName === "style") {
            $target.closest("[data-mutate]").attr("data-events", "mutate");
            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
          }
          break;

        case "childList":
          $target.closest("[data-mutate]").attr("data-events", "mutate");
          $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
          break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: true, characterData: false, subtree: true, attributeFilter: ["data-events", "style"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;

}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }

},{}],11:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _InViewport = require('./components/views/InViewport');var _InViewport2 = _interopRequireDefault(_InViewport);
var _ComponentMap = require('./ComponentMap');var _ComponentMap2 = _interopRequireDefault(_ComponentMap);
var _services = require('./components/services');var _services2 = _interopRequireDefault(_services);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                                                                                                                                                                                        * The top-level controller for the whole page. This component is responsible
                                                                                                                                                                                                                                                                                                                                                        * for loading other controllers and views.
                                                                                                                                                                                                                                                                                                                                                        */var
App = function () {
  /**
                    * Initialize all global JS components and call `loadcomponents`
                    * to initialize all unique JS components
                    */
  function App() {_classCallCheck(this, App);
    /**
                                               * Services is the object which holds references to all services
                                               * created for pages. Services should be instantiated there and
                                               * then will be injected into each component for optional use via the
                                               * `loadcomponents` function
                                               *
                                               * @type {Services}
                                               * @property {Services}
                                               */
    this.Services = new _services2.default();

    /**
                                               * The InViewport view component which needs to run globally for all components.
                                               * @type {InViewport}
                                               * @property {InViewport}
                                               */
    this.inViewport = new _InViewport2.default(this.Services);

    // Load each component
    this.loadPagecomponents();
  }

  /**
     * This function loops over all elements in the DOM with the
     * `data-loadcomponent` attribute and loads the specified view
     * or controller.
     *
     * To attach a JS component to an HTML element, in your markup you'd
     * do something like: <section class="example-component" data-loadcomponent='Examplecomponent'>
     * where 'Examplecomponent' is your JS class name. You'd need to add that component to the ./componentMap.js
     * and make sure the component exists and is a proper ES6 class, and then you'll end up with
     * an ES6 class that is passed a reference to section.example-component on init.
     */_createClass(App, [{ key: 'loadPagecomponents', value: function loadPagecomponents()
    {var _this = this;
      var attribute = 'data-loadcomponent';
      Array.prototype.forEach.call(document.querySelectorAll('[' + attribute + ']'), function (element) {
        console.log('loading component ', element.getAttribute(attribute));
        new _ComponentMap2.default[element.getAttribute(attribute)](element, _this.Services);
      });
    } }]);return App;}();exports.default = App;

},{"./ComponentMap":12,"./components/services":32,"./components/views/InViewport":34}],12:[function(require,module,exports){
'use strict';

// Import all required modules
// import Header from './components/views/Header';
Object.defineProperty(exports, "__esModule", { value: true });var _File = require('./components/views/File');var _File2 = _interopRequireDefault(_File);
var _Nav = require('./components/views/Nav');var _Nav2 = _interopRequireDefault(_Nav);
var _Video = require('./components/views/Video');var _Video2 = _interopRequireDefault(_Video);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}
// import Form from './components/views/Form';
// import Filter from './components/views/Filter';
// import Video from './components/views/Video';
// import Slider from './components/views/Slider';
// import Anchor from './components/views/Anchor';
// import SocialShare from './components/views/SocialShare';
// import InViewport from './components/views/InViewport';
// import Banner from './components/views/Banner';

// Export reference to all modules in an object
exports.default = {
    // Header,
    File: _File2.default,
    Nav: _Nav2.default,
    Video: _Video2.default
    // Form,
    // Filter,
    // Video
    // Anchor,
    // Slider,
    // SocialShare,
    // InViewport,
    // Banner,
};

},{"./components/views/File":33,"./components/views/Nav":35,"./components/views/Video":36}],13:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $ARIA STRINGS
//* ------------------------------------*/

var ARIA = exports.ARIA = {
  EXPANDED: 'aria-expanded',
  HIDDEN: 'aria-hidden',
  SELECTED: 'aria-selected' };

},{}],14:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $CLASS NAMES - for class names
//      not CSS selectors
//* ------------------------------------*/

var CLASS_NAMES = exports.CLASS_NAMES = {
  ABOVE_BOTTOM: 'above-bottom',
  ABOVE_HALFWAY: 'above-halfway',
  ABOVE_VIEWPORT: 'above-viewport',
  ACTIVE: 'active',
  BANNER_ACTIVE: 'banner-active',
  BUTTON_SUBMITTING: 'button--submitting',
  BUTTON_SUBMITTED: 'button--submitted',
  ERROR: 'error',
  CLICK: 'click',
  CLOSED: 'closed',
  FIRST_BATCH: 'first-batch',
  FIXED: 'nav-fixed',
  HIDING: 'hiding',
  HIDDEN: 'hidden',
  HOVER: 'hover',
  INVALID: 'invalid',
  IN_VIEWPORT: 'in-viewport',
  LOADING: 'loading',
  MINI: 'mini',
  OPEN: 'open',
  OPENED: 'opened',
  SCROLLED: 'scrolled',
  SELECTED: 'selected',
  SUBMITTED: 'submitted',
  VISUALLY_HIDDEN: 'visually-hidden',
  VALID: 'valid' };

},{}],15:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $MISC STRINGS
//* -----------------------------------*/

var ENDPOINTS = exports.ENDPOINTS = {
  SEARCH: '/wp-json/relevanssi/v1/search?',
  WPAPI: '/wp-json/wp/v2/',
  WPAPITOTAL: 'X-WP-Total' };

},{}],16:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $ERROR Messages
//* ------------------------------------*/

var ERRORS = exports.ERRORS = {
  FEATURED_IMAGE: 'A featured image is required' };

},{}],17:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $EVENTS
//* ------------------------------------*/

var EVENTS = exports.EVENTS = {
  ANIMATIONEND: 'animationend',
  BEFOREUNLOAD: 'beforeunload',
  BLUR: 'blur',
  CHANGE: 'change',
  CLEAR_FILTERS: 'clearfilters',
  CLICK: 'click',
  CUSTOM_EVENT: 'customevent',
  DISPLAY_SUBHEADING: 'displaysubheading',
  DROPDOWN_CHANGED: 'dropdownchanged',
  FORM_ERROR: 'formerror',
  FORM_SUCCESS: 'formsuccess',
  FOCUS: 'focus',
  HEADER_HIDING: 'header-hiding',
  INPUT: 'input',
  KEY_DOWN: 'keydown',
  MOUSEOUT: 'mouseout',
  MOUSEOVER: 'mouseover',
  PAGESHOW: 'pageshow',
  REQUEST_MADE: 'requestmade',
  RESIZE: 'resize',
  RESULTS_RETURNED: 'resultsreturnd',
  SCROLL: 'scroll',
  SIMULATED_CLICK: 'simulated-click',
  SHOW_HIDE: 'showhide',
  SUBMIT: 'submit',
  TOUCH_END: 'touchend',
  TOUCH_START: 'touchstart',
  TRANSITIONEND: 'transitionend',
  UPDATE_POST_COUNT: 'updatepostcount',
  UPDATE_IN_VIEWPORT_MODULES: 'updateinviewportmodules',
  UPDATE_SEARCH_WITH_NEW_ITEMS: 'updatesearchwithnewitems',
  UPDATE_SETTINGS: 'updatesettings',
  WHEEL: 'wheel' };

},{}],18:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _aria = require('./aria');Object.defineProperty(exports, 'ARIA', { enumerable: true, get: function get() {return _aria.ARIA;} });var _classNames = require('./class-names');Object.defineProperty(exports, 'CLASS_NAMES', { enumerable: true, get: function get() {return _classNames.
    CLASS_NAMES;} });var _endpoints = require('./endpoints');Object.defineProperty(exports, 'ENDPOINTS', { enumerable: true, get: function get() {return _endpoints.
    ENDPOINTS;} });var _errors = require('./errors');Object.defineProperty(exports, 'ERRORS', { enumerable: true, get: function get() {return _errors.
    ERRORS;} });var _events = require('./events');Object.defineProperty(exports, 'EVENTS', { enumerable: true, get: function get() {return _events.
    EVENTS;} });var _misc = require('./misc');Object.defineProperty(exports, 'MISC', { enumerable: true, get: function get() {return _misc.
    MISC;} });var _keyCodes = require('./key-codes');Object.defineProperty(exports, 'KEY_CODES', { enumerable: true, get: function get() {return _keyCodes.
    KEY_CODES;} });var _selectors = require('./selectors');Object.defineProperty(exports, 'SELECTORS', { enumerable: true, get: function get() {return _selectors.
    SELECTORS;} });

},{"./aria":13,"./class-names":14,"./endpoints":15,"./errors":16,"./events":17,"./key-codes":19,"./misc":20,"./selectors":21}],19:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $KEY CODES
//* ------------------------------------*/

var KEY_CODES = exports.KEY_CODES = {
  ESCAPE: 27,
  ENTER: 13,
  SPACEBAR: 32 };

},{}],20:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* ------------------------------------*\
//    $MISC STRINGS
//* -----------------------------------*/

var MISC = exports.MISC = {
  BANNER_COOKIE: 'banner_viewed',
  BANNER_COOKIE_VIEWED: 'viewed',
  BUTTON_SUBMITTED: 'Thank You',
  BUTTON_PROCESSING: 'Working',
  BEFOREEND: 'beforeend',
  CHANGE: 'Change ',
  DATA_VISIBLE: 'data-visible',
  DISABLED: 'disabled',
  fURL1: '//www.facebook.com/sharer.php?u=',
  LARGE: 1024,
  MEDIUM: 640,
  mURL1: 'mailto:',
  mURL2: '?subject=',
  mURL3: '&body=',
  tURL1: 'https://twitter.com/share?url=',
  tURLText: '&text=',
  tURLVia: '&via=TheDemocrats' };

},{}],21:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true }); //* --------------------------------------------------*\
//    $SELECTORS - CSS selectors ONLY
// -  tag names, #ids, .classnames, [attributes], etc
//* --------------------------------------------------*/

var SELECTORS = exports.SELECTORS = {
  ALL: '#all',
  ANCHOR: 'a',
  ANCHOR_WITH_HREF: 'a[href]',
  API_RESULTS: '[data-loadcomponent="APIResults"]',
  BACKGROUND: '.background',
  BANNER_TRIGGER: '.banner-close',
  BUTTON: 'button',
  CHECKED: ':checked',
  CHECKED_LABEL: ':checked + label',
  CHECKBOX: 'checkbox',
  CHEVRON_STRIPE: '.chevron-stripe',
  CLOSE: '.close',
  CLOSE_SEARCH: '.close-search',
  DATA_BOTTOM: 'data-bottomposition',
  DATA_HALFWAY: 'data-halfway',
  DATA_HAS_ANIMATED: 'data-has-animated',
  DATA_LAZY_LOAD: 'data-lazyload',
  DATA_POSITION: 'data-position',
  DATA_VISIBLE: '[data-visible]',
  DIV: 'div',
  DROPDOWN: '.dropdown',
  DROPDOWN_CONTENT: '.dropdown__content',
  DROPDOWN_TOGGLE: '.dropdown__toggle',
  DROPDOWN_TOGGLE_CLICK: '.dropdown.click',
  DROPDOWN_TOGGLE_HOVER: '.dropdown.hover',
  EMAIL: '.share--email',
  FACEBOOK: '.share--fb',
  FEATUREDVIDEO: '.featured-video video',
  FILE_INPUT: 'input[type=file]',
  FILTER: '.filter',
  FILTER_CHOICE: '.filter-choice',
  FILTER_OPTION: '.filter-option',
  FILTER_TRIGGER: '.filter-trigger',
  FORM: 'form',
  FORM_FIELDS: 'input, select, textarea',
  HTML: 'html',
  INVALID: ':invalid',
  LANDING_PAGE_TITLE: '.landing-page-header__title',
  LINKEDIN: '.share--li',
  LOADING: '.loading',
  LOAD_MORE: '.load-more',
  NAV: '.primary-nav',
  NAV_TRIGGER: '.nav-trigger',
  NESTED: '.nested',
  OGDESC: 'meta[property="og:description"]',
  OGTITLE: 'meta[property="og:title"]',
  OGURL: 'meta[property="og:url"]',
  OPEN_SEARCH: '.open-search',
  OPTGROUP: 'optgroup',
  PARAGRAPH: 'p',
  PLAYER: '.player',
  PLAY_TRIGGER: '.video__play-trigger',
  POST_COUNT: '.post-count .count',
  POST_LISTING: '.post-listing',
  RESULTS_CONTAINER: '.results-container',
  SECONDARY_BLOG_LISTING: '.secondary-blog-listing',
  SEARCH_INPUT: '.search-field__input',
  SELECTED: '.selected',
  SITE_NAV: '.navigation',
  STATISTIC_VALUE: '.statistic__value',
  SUBMIT: '[type="submit"]',
  SVG_BG_CONTAINER: '.svg-background',
  TAB: '[role="tab"]',
  TABPANEL: '[role="tabpanel"]',
  TWITTER: '.share--tw' };

},{}],22:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.










debounce = debounce; /**
                      * Returns a function, that, as long as it continues to be invoked, will not
                      * be triggered. The function will be called after it stops being called for
                      * N milliseconds. If `immediate` is passed, trigger the function on the
                      * leading edge, instead of the trailing.
                      *
                      * @param  {Function} func A function to call after N milliseconds
                      * @param  {number} wait The number of milliseconds to wait
                      * @param  {boolean} immediate Trigger the function on the leading edge instead of the trailing
                      * @return {Function} A function, that, as long as it continues to be invoked, will not be triggered
                      */function debounce(func, wait, immediate) {var timeout = void 0;return function () {var context = this;var args = arguments;var later = function later() {timeout = null;if (!immediate) func.apply(context, args);};var callNow = immediate && !timeout;clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

},{}],23:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.





getcookie = getcookie; /**
                        * Returns the cookie or undefined if not found
                        * 
                        * @param {String} name of the cookie to find
                        * @return {Object} cookie based on name passed in
                        */function getcookie(name) {var cookies = {};var cookieSet = document.cookie.split('; ');cookieSet.forEach(function (cookie) {return cookies[cookie.split('=')[0]] = cookie.split('=')[1];});return cookies[name];
};

},{}],24:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _debounce = require('./debounce');Object.defineProperty(exports, 'debounce', { enumerable: true, get: function get() {return _debounce.


    debounce;} });var _getcookie = require('./getcookie');Object.defineProperty(exports, 'getcookie', { enumerable: true, get: function get() {return _getcookie.
    getcookie;} });var _isscrolledintoview = require('./isscrolledintoview');Object.defineProperty(exports, 'isscrolledintoview', { enumerable: true, get: function get() {return _isscrolledintoview.




    isscrolledintoview;} });var _openpopup = require('./openpopup');Object.defineProperty(exports, 'openpopup', { enumerable: true, get: function get() {return _openpopup.

    openpopup;} });var _randomsecurestring = require('./randomsecurestring');Object.defineProperty(exports, 'randomsecurestring', { enumerable: true, get: function get() {return _randomsecurestring.

    randomsecurestring;} });var _scrollto = require('./scrollto');Object.defineProperty(exports, 'scrollto', { enumerable: true, get: function get() {return _scrollto.
    scrollto;} });

},{"./debounce":22,"./getcookie":23,"./isscrolledintoview":25,"./openpopup":26,"./randomsecurestring":27,"./scrollto":28}],25:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.








isscrolledintoview = isscrolledintoview; /**
                                          * A function which measures the elements position on the page in
                                          * relation to the what the user can currently see on their screen
                                          * and returns a boolean value with `true` being that the element
                                          * is visible and `false` being that it is not visible.
                                          *
                                          * @param  {Object}  elem A DOM element
                                          * @return {Boolean} isVisible A boolean value with `true` representing that the element is visible
                                          */function isscrolledintoview(elem) {var elementBounds = elem.getBoundingClientRect();return elementBounds.top < window.innerHeight && elementBounds.bottom >= 0;}

},{}],26:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.








openpopup = openpopup; /**
                        * A function which opens a popup window
                        *
                        * @param  {String} url the url to open in the popup
                        * @param  {String} windowName a unique name for the popup
                        * @param  {Integer} w the desired width of the popup
                        * @param  {Integer} h the desired height of the popup
                        * @return {Object} an object the popup function is bound to
                        */function openpopup(url, windowName, w, h) {return window.open(url, windowName, 'menubar=no,status=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no,width=' + w + ',height=' + h + '');}

},{}],27:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.






randomsecurestring = randomsecurestring; /**
                                          * A function that takes a length and
                                          * returns a random string
                                          *
                                          * @param  {Number} length of the random string
                                          * @return {String} random string
                                          */function randomsecurestring(length) {var text = '';var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';for (var i = 0; i < length; i++) {text += possible.charAt(Math.floor(Math.random() * possible.length));}return text;
}

},{}],28:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.






scrollto = scrollto; /**
                      * A function that scrolls to a target on page
                      *
                      * @param  {Object} event
                      * @param  {HTMLNode} element
                      * @param  {Integer} offset
                      */function scrollto(event, element) {var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;var hash = element.getAttribute('href').charAt(0) === '#' ? element.getAttribute('href') : undefined;if (hash && window.scroll !== undefined) {var $target = document.querySelector(hash);var targetY = $target.offsetTop - offset;
    event.preventDefault();

    window.scrollTo({
      top: targetY,
      behavior: 'smooth' });

  }
}

},{}],29:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Constants = require('../../Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                                   * ID
                                                                                                                                                                                                   *
                                                                                                                                                                                                   * @type {Number}
                                                                                                                                                                                                   * @ignore
                                                                                                                                                                                                   */
var id = 0;

/**
             * Get ID
             *
             * Because file is loaded only once, this function
             * can be used to generate a unique id every time
             * it is called.
             *
             * @return {Number} Unique ID value
             * @ignore
             */
function getId() {
  return id++;
}

/**
   * Click Service
   */var
ClickService = function () {
  /**
                             * Click Service constructor in which the `callbacks` array is created
                             * as a property of the class.
                             */
  function ClickService() {_classCallCheck(this, ClickService);
    /**
                                                                 * An array to be populated with callback functions that will be triggered on Click
                                                                 *
                                                                 * @property {Array} callbacks
                                                                 */
    this.callbacks = [];

    this.init();
  }

  /**
    * @desc Initialize the singleton by attaching the event listener to the window
    * @listens {Event} listens to the window Click event
    */_createClass(ClickService, [{ key: 'init', value: function init()
    {
      window.addEventListener(_Constants.EVENTS.CLICK, this.onClick.bind(this));
    }

    /**
      * @desc The click event handler. Iterates through the `callback` array and invokes each callback in the Array
      * @param  {Event} event the event object
      */ }, { key: 'onClick', value: function onClick(
    event) {
      this.callbacks.forEach(function (callback) {
        if (callback.isElementMatch) {
          if (event.target === callback.targetElement) {
            callback.callback(event);
          }
        } else {
          callback.callback(event);
        }
      });
    }

    /**
       * @desc A hook for pushing a callback function
       * into the `callbacks` array. A unique
       * ID value for the callback is generated
       * and a function is returned for removing
       * the callback if need be.
       *
       * @param {HTMLElement} element A reference to the DOM element that triggers the event
       * @param {Function} callback A function to invoke by the ClickService
       * @param {Boolean} isElementMatch A flag used to invert the conditional check for firing the callback
       * @return {Function} `removeCallback` A function which will remove an entry from the `callbacks` array
       */ }, { key: 'addCallback', value: function addCallback(
    element, callback, isElementMatch) {
      // Generate an id for the callback
      var id = getId();
      // module can't be undefined because it's as in identifier for the callbacks array.
      var module = element.dataset && element.dataset.loadmodule ? element.dataset.loadmodule : element;
      var flag = false;
      var targetElement = element;

      for (var i = 0; i < this.callbacks.length; i++) {
        if (this.callbacks[i].module === module) {
          flag = true;
        }
      }

      if (!flag) {
        // Push function into array with a unique id
        this.callbacks.push({
          module: module,
          id: id,
          targetElement: targetElement,
          isElementMatch: isElementMatch,
          callback: callback });

      }

      // Return the remove function
      return this.removeCallback.bind(this, id);
    }

    /**
       * Filters through the `callback` array and removes
       * the entry that corresponds to the id passed
       * in as an argument
       *
       * @param  {Number} id An id value to filter by
       */ }, { key: 'removeCallback', value: function removeCallback(
    id) {
      this.callbacks = this.callbacks.filter(function (item) {
        return item.id !== id;
      });
    } }]);return ClickService;}();exports.default = ClickService;

},{"../../Constants":18}],30:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Utils = require('../../Utils');
var _Constants = require('../../Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                                   * ID
                                                                                                                                                                                                   *
                                                                                                                                                                                                   * @type {Number}
                                                                                                                                                                                                   * @ignore
                                                                                                                                                                                                   */
var id = 0;

/**
             * Get ID
             *
             * Because file is loaded only once, this function
             * can be used to generate a unique id every time
             * it is called.
             *
             * @return {Number} Unique ID value
             * @ignore
             */
function getId() {
  return id++;
}

/**
   * Resize Service
   */var
ResizeService = function () {
  /**
                              * ResizeService constructor in which the `callbacks` array is created
                              * as a property of the class.
                              */
  function ResizeService() {_classCallCheck(this, ResizeService);
    /**
                                                                   * An array to be populated with callback functions that will be triggered on resize
                                                                   *
                                                                   * @property {Array} callbacks
                                                                   */
    this.callbacks = [];

    this.init();
  }

  /**
     * @desc Initialize the singleton by attaching the event listener to the window
     * @listens {Event} listens to the window resize event
     */_createClass(ResizeService, [{ key: 'init', value: function init()
    {
      window.addEventListener(_Constants.EVENTS.RESIZE, (0, _Utils.debounce)(this.onResize.bind(this), 10));
    }

    /**
       * @desc The resize event handler. Itertates through the `callback` array and invokes each callback in the Array
       */ }, { key: 'onResize', value: function onResize()
    {
      this.callbacks.forEach(function (callback) {
        callback.callback();
      });
    }

    /**
       * @desc A hook for pushing a callback function
       * into the `callbacks` array. A unique
       * ID value for the callback is generated
       * and a function is returned for removing
       * the callback if need be.
       *
       * @param {Function} callback A function to invoke by the ResizeService
       * @return {Function} `removeCallback` A function which will remove an entry from the `callbacks` array
       */ }, { key: 'addCallback', value: function addCallback(
    callback) {
      // Generate an id for the callback
      var id = getId();

      // Push function into array with a unique id
      this.callbacks.push({
        id: id,
        callback: callback });


      // Return the remove function
      return this.removeCallback.bind(this, id);
    }

    /**
       * Filters through the `callback` array and removes
       * the entry that corresponds to the id passed
       * in as an argument
       *
       * @param  {Number} id An id value to filter by
       */ }, { key: 'removeCallback', value: function removeCallback(
    id) {
      this.callbacks = this.callbacks.filter(function (item) {
        return item.id !== id;
      });
    } }]);return ResizeService;}();exports.default = ResizeService;

},{"../../Constants":18,"../../Utils":24}],31:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Utils = require('../../Utils');
var _Constants = require('../../Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                                   * ID
                                                                                                                                                                                                   *
                                                                                                                                                                                                   * @type {Number}
                                                                                                                                                                                                   * @ignore
                                                                                                                                                                                                   */
var id = 0;

/**
             * Get ID
             *
             * Because file is loaded only once, this function
             * can be used to generate a unique id every time
             * it is called.
             *
             * @return {Number} Unique ID value
             * @ignore
             */
function getId() {
  return id++;
}

/**
   * Scroll Service
   */var
ScrollService = function () {
  /**
                              * Scroll Service constructor in which the `callbacks` array is created
                              * as a property of the class.
                              */
  function ScrollService() {_classCallCheck(this, ScrollService);
    /**
                                                                   * An array to be populated with callback functions that will be triggered on scroll
                                                                   *
                                                                   * @property {Array} callbacks
                                                                   */
    this.callbacks = [];

    /**
                          * The current position of the user based on scroll, vertically
                          *
                          * @property {number} position
                          */
    this.scrollY = 0;

    this.init();
  }

  /**
     * @desc Initialize the singleton by attaching the event listener to the window
     * @listens {Event} listens to the window scroll event
     */_createClass(ScrollService, [{ key: 'init', value: function init()
    {
      window.addEventListener(_Constants.EVENTS.SCROLL, (0, _Utils.debounce)(this.onScroll.bind(this), 10));
    }

    /**
       * @desc The scroll event handler. Iterates through the `callback` array and invokes each callback in the Array
       */ }, { key: 'onScroll', value: function onScroll()
    {
      this.scrollY = window.scrollY;
      this.callbacks.forEach(function (callback) {
        callback.callback();
      });
    }

    /**
       * @desc A hook for pushing a callback function into the `callbacks` array. A unique
       * ID value for the callback is generated and a function is returned for removing
       * the callback if need be.
       *
       * @param {Function} callback A function to invoke by the ScrollService
       * @return {Function} `removeCallback` A function which will remove an entry from the `callbacks` array
       */ }, { key: 'addCallback', value: function addCallback(
    callback) {
      // Generate an id for the callback
      var id = getId();

      // Push function into array with a unique id
      this.callbacks.push({
        id: id,
        callback: callback });


      // Return the remove function
      return this.removeCallback.bind(this, id);
    }

    /**
       * Filters through the `callback` array and removes
       * the entry that corresponds to the id passed
       * in as an argument
       *
       * @param  {Number} id An id value to filter by
       */ }, { key: 'removeCallback', value: function removeCallback(
    id) {
      this.callbacks = this.callbacks.filter(function (item) {
        return item.id !== id;
      });
    } }]);return ScrollService;}();exports.default = ScrollService;

},{"../../Constants":18,"../../Utils":24}],32:[function(require,module,exports){
'use strict';

// Import services
Object.defineProperty(exports, "__esModule", { value: true });var _ClickService = require('./ClickService');var _ClickService2 = _interopRequireDefault(_ClickService);
var _ResizeService = require('./ResizeService');var _ResizeService2 = _interopRequireDefault(_ResizeService);
var _ScrollService = require('./ScrollService');var _ScrollService2 = _interopRequireDefault(_ScrollService);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                                                                                                                                                                                                 * A singleton whose properties are individual services.
                                                                                                                                                                                                                                                                                                                                                                 *
                                                                                                                                                                                                                                                                                                                                                                 * Any service singleton service that needs to be instantiated
                                                                                                                                                                                                                                                                                                                                                                 * should be done so in the Services class.
                                                                                                                                                                                                                                                                                                                                                                 *
                                                                                                                                                                                                                                                                                                                                                                 * Services should not interact with the DOM, that should be
                                                                                                                                                                                                                                                                                                                                                                 * left to the Views. Services can simply be used to consolidate
                                                                                                                                                                                                                                                                                                                                                                 * an expensive event listener ('scroll', 'resize', etc). or
                                                                                                                                                                                                                                                                                                                                                                 * track state (like which modal is open at which time).
                                                                                                                                                                                                                                                                                                                                                                 */var
Services =
/**
            * Services constructor that instantiates each service individually.
            * To add another services instiate it here.
            */
function Services() {_classCallCheck(this, Services);
  /**
                                                       * A service which listens to the `window` click event and
                                                       * invokes an array of callbacks
                                                       *
                                                       * @property {Object} ClickService A singleton instance of the ClickService class
                                                       */
  this.ClickService = new _ClickService2.default();

  /**
                                                     * A service which listens to the `window` resize event and
                                                     * invokes an array of callbacks
                                                     *
                                                     * @property {Object} ResizeService A singleton instance of the ResizeService class
                                                     */
  this.ResizeService = new _ResizeService2.default();

  /**
                                                       * A service which listens to the `window` scroll event and
                                                       * invokes an array of callbacks
                                                       *
                                                       * @property {Object} ScrollService A singleton instance of the ScrollService class
                                                       */
  this.ScrollService = new _ScrollService2.default();
};exports.default = Services;

},{"./ClickService":29,"./ResizeService":30,"./ScrollService":31}],33:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Constants = require('../../Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                                   * A class that shows the first file uploaded to file field on matching label
                                                                                                                                                                                                   */var
File = function () {
  /**
                     * Constructor for File
                     *
                     * @param {HTMLElement} element - REQUIRED - the module's container
                     */
  function File(element) {_classCallCheck(this, File);
    /**
                                                        * DOM node that is passed into the constructor
                                                        *
                                                        * @property {Object} element DOM node that is passed into the constructor
                                                        */
    this.element = element;

    // Initialize the view
    this.init();
  }

  /**
     * Initializes the view by calling the functions to
     * create DOM references, setup event handlers and
     * then create the event listeners
     *
     * @return {Object} Header A reference to the current instance of the class
     * @chainable
     */_createClass(File, [{ key: 'init', value: function init()
    {
      this.cacheDomReferences().
      setupHandlers().
      enable();

      return this;
    }

    /**
       * Cache DOM References
       *
       * Find all necessary DOM elements used in the view and cache them
       *
       * @return {Object} Header A reference to the current instance of the class
       * @chainable
       */ }, { key: 'cacheDomReferences', value: function cacheDomReferences()
    {
      this.file = document.getElementById(this.element.getAttribute('for'));

      return this;
    }

    /**
       * Bind event handlers with the proper context of `this`.
       *
       * @return {Object} Nav A reference to the current instance of the class
       * @chainable
       */ }, { key: 'setupHandlers', value: function setupHandlers()
    {
      /**
       * A reference to the `scrollTo` function with the proper
       * context bound to the SVGScrollAnimations class.
       *
       * @property {Function}
       */
      this.onChangeHandler = this.onChange.bind(this);

      return this;
    }

    /**
       * Create event handlers to enable interaction with view
       *
       * @return {Object} Nav A reference to the current instance of the class
       * @chainable
       */ }, { key: 'enable', value: function enable()
    {
      this.file.addEventListener(_Constants.EVENTS.CHANGE, this.onChangeHandler);

      return this;
    }

    /**
       * Changing file uploaded will replace the name
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'onChange', value: function onChange(
    event) {
      console.log('changed');

      this.element.innerText = this.file.files.length > 0 ? this.file.files[0].name : 'Any Attachment?';

      return this;
    } }]);return File;}();exports.default = File;

},{"../../Constants":18}],34:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Utils = require('../../Utils');
var _Constants = require('Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

/**
                                                                                                                                                                                             * In Viewport
                                                                                                                                                                                             */var
InViewport = function () {
  /**
                           * Constructor for inviewport which simply assigns the ScrollService
                           * to a property on the contructor for reference.
                           *
                           * @param {Object} Services various services, passed in as param
                           */
  function InViewport(Services) {_classCallCheck(this, InViewport);
    /**
                                                                     * Reference to the ScrollService singleton
                                                                     * @property {Object}
                                                                     */
    this.ScrollService = Services.ScrollService;

    // Initialize the view
    this.init();
  }

  /**
     * Initializes the view by calling the functions to
     * create DOM references, setup event handlers and
     * then create the event listeners
     *
     * @return {Object} A reference to the current instance of this class
     * @chainable
     */_createClass(InViewport, [{ key: 'init', value: function init()
    {
      this.cacheDomReferences().
      setupHandlers().
      enable();

      return this;
    }

    /**
       * Find all necessary DOM elements used in the view and cache them
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'cacheDomReferences', value: function cacheDomReferences()
    {
      /**
       * All DOM elements with the `data-visible` attribute
       * @property {NodeList}
       */
      this.modules = document.querySelectorAll(_Constants.SELECTORS.DATA_VISIBLE);

      return this;
    }

    /**
       * Bind event handlers with the proper context of `this`.
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'setupHandlers', value: function setupHandlers()
    {
      /**
       * A reference to the `onScroll` function with the proper
       * context bound to the InViewport class.
       *
       * @property {Function}
       */
      this.onScrollHandler = this.onScroll.bind(this);

      /**
                                                        * A reference to the `updateModules` function with the proper
                                                        * context bound to the InViewport class.
                                                        *
                                                        * @property {Function}
                                                        */
      this.onModuleUpdateHandler = this.updateModules.bind(this);

      return this;
    }

    /**
       * Create event handlers to enable interaction with view
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'enable', value: function enable()
    {
      // Call scroll handler on load to get initial viewable elements
      window.setTimeout(this.onScrollHandler, 300);

      // Add to ScrollSerive callbacks
      this.ScrollService.addCallback(this.onScrollHandler);

      document.body.addEventListener(_Constants.EVENTS.UPDATE_IN_VIEWPORT_MODULES, this.onModuleUpdateHandler);

      return this;
    }

    /**
       * A function which loops over the current modules and determines
       * which are currently in the viewport. Depending on whether or
       * not they are visible a data attribute boolean is toggled
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'onScroll', value: function onScroll()
    {
      Array.prototype.forEach.call(this.modules, function (module) {
        if ((0, _Utils.isscrolledintoview)(module)) {
          if (module.getAttribute(_Constants.MISC.DATA_VISIBLE) === 'false') {
            module.setAttribute(_Constants.MISC.DATA_VISIBLE, true);
          }
          if (!module.hasAttribute(_Constants.SELECTORS.DATA_HAS_ANIMATED) && module.getAttribute(_Constants.SELECTORS.DATA_BOTTOM) === 'above-bottom') {
            module.setAttribute(_Constants.SELECTORS.DATA_HAS_ANIMATED, true);
          }
        } else {
          if (module.getAttribute(_Constants.MISC.DATA_VISIBLE) === 'true') {
            module.setAttribute(_Constants.MISC.DATA_VISIBLE, false);
          }
        }
        var rect = module.getBoundingClientRect();
        var currentDataPosition = module.getAttribute(_Constants.SELECTORS.DATA_POSITION);
        var calculatedDataPosition = rect.bottom < 0 ? _Constants.CLASS_NAMES.ABOVE_VIEWPORT : rect.top >= window.innerHeight ? _Constants.CLASS_NAMES.BELOW_VIEWPORT : _Constants.CLASS_NAMES.IN_VIEWPORT;
        var calculatedBottomPosition = rect.bottom > window.innerHeight ? _Constants.CLASS_NAMES.BELOW_BOTTOM : _Constants.CLASS_NAMES.ABOVE_BOTTOM;
        var halfwayPosition = rect.bottom <= window.innerHeight / 1.25 ? _Constants.CLASS_NAMES.ABOVE_HALFWAY : _Constants.CLASS_NAMES.BELOW_HALFWAY;
        if (currentDataPosition !== calculatedDataPosition) {
          module.setAttribute(_Constants.SELECTORS.DATA_POSITION, calculatedDataPosition);
        }
        module.setAttribute(_Constants.SELECTORS.DATA_BOTTOM, calculatedBottomPosition);
        module.setAttribute(_Constants.SELECTORS.DATA_HALFWAY, halfwayPosition);
      });

      return this;
    }

    /**
       * A function which updates the list of data-visible modules by calling `cacheDomReferences` and calls `onScroll`
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'updateModules', value: function updateModules()
    {
      // console.log('scroll');
      this.cacheDomReferences().onScroll();

      return this;
    } }]);return InViewport;}();exports.default = InViewport;

},{"../../Utils":24,"Constants":18}],35:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Constants = require('../../Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}


/**
                                                                                                                                                                                                   * A class which hides and reveals hidden menu content based on user click of a button.
                                                                                                                                                                                                   */var
Nav = function () {
  /**
                    * Constructor for Nav which simply assigns the ScrollService
                    * to a property on the contructor for reference.
                    *
                    * @param {HTMLElement} element - REQUIRED - the module's container
                    * @param {Object} Services various services, passed in as param
                    */
  function Nav(element, Services) {_classCallCheck(this, Nav);
    /**
                                                                * DOM node that is passed into the constructor
                                                                *
                                                                * @property {Object} element DOM node that is passed into the constructor
                                                                */
    this.element = element;


    // Initialize the view
    this.init();
  }

  /**
     * Initializes the view by calling the functions to
     * create DOM references, setup event handlers and
     * then create the event listeners
     *
     * @return {Object} Header A reference to the current instance of the class
     * @chainable
     */_createClass(Nav, [{ key: 'init', value: function init()
    {
      this.cacheDomReferences().
      setupHandlers().
      enable();

      return this;
    }

    /**
       * Cache DOM References
       *
       * Find all necessary DOM elements used in the view and cache them
       *
       * @return {Object} Header A reference to the current instance of the class
       * @chainable
       */ }, { key: 'cacheDomReferences', value: function cacheDomReferences()
    {
      this.navTrigger = this.element.querySelector(_Constants.SELECTORS.NAV_TRIGGER);
      this.siteNav = document.querySelector(_Constants.SELECTORS.SITE_NAV);

      return this;
    }

    /**
       * Bind event handlers with the proper context of `this`.
       *
       * @return {Object} Nav A reference to the current instance of the class
       * @chainable
       */ }, { key: 'setupHandlers', value: function setupHandlers()
    {
      /**
       * A reference to the `onClick` function with the proper
       * context bound to the SVGScrollAnimations class.
       *
       * @property {Function}
       */
      this.onClickHandler = this.onClick.bind(this);

      return this;
    }

    /**
       * Create event handlers to enable interaction with view
       *
       * @return {Object} Nav A reference to the current instance of the class
       * @chainable
       */ }, { key: 'enable', value: function enable()
    {
      // handle nav trigger click
      this.navTrigger.addEventListener(_Constants.EVENTS.CLICK, this.onClickHandler);
      this.navTrigger.addEventListener(_Constants.EVENTS.KEY_DOWN, this.onClickHandler);

      return this;
    }

    /**
       * Scrolling beyond the height of the nav will trigger a class change
       * and vice versa.
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'onClick', value: function onClick()
    {
      var isOpen = this.element.classList.contains(_Constants.CLASS_NAMES.OPEN);
      this.headerOpen = !isOpen;
      if (event.type === _Constants.EVENTS.KEY_DOWN && (
      event.target.nodeName.match(/a|input|textarea|select|button/i) ||
      isOpen && event.keyCode !== _Constants.KEY_CODES.ESCAPE && (event.keyCode !== _Constants.KEY_CODES.SPACEBAR || event.currentTarget === window) ||
      !isOpen && event.keyCode !== _Constants.KEY_CODES.SPACEBAR))
      {
        return;
      }
      if (event.type === _Constants.EVENTS.KEY_DOWN && event.keyCode === _Constants.KEY_CODES.SPACEBAR) {
        return;
      }
      event.preventDefault();
      this.element.classList.toggle(_Constants.CLASS_NAMES.OPEN);
      this.navTrigger.classList.toggle(_Constants.CLASS_NAMES.OPEN);
      this.siteNav.classList.toggle(_Constants.CLASS_NAMES.OPEN);
      this.navTrigger.setAttribute(_Constants.ARIA.EXPANDED, isOpen);
      this.siteNav.setAttribute(_Constants.ARIA.HIDDEN, isOpen);
      document.body.classList.toggle(_Constants.CLASS_NAMES.OPENED);
    } }]);return Nav;}();exports.default = Nav;

},{"../../Constants":18}],36:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Constants = require('../../Constants');
var _Utils = require('../../Utils');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}


/**
                                                                                                                                                                                           * A class which hides and reveals hidden menu content based on user click of a button.
                                                                                                                                                                                           */var
Video = function () {
  /**
                      * Constructor for Video which simply assigns the ScrollService
                      * to a property on the contructor for reference.
                      *
                      * @param {HTMLElement} element - REQUIRED - the module's container
                      * @param {Object} Services various services, passed in as param
                      */
  function Video(element, Services) {_classCallCheck(this, Video);
    /**
                                                                    * DOM node that is passed into the constructor
                                                                    *
                                                                    * @property {Object} element DOM node that is passed into the constructor
                                                                    */
    this.element = element;


    // Initialize the view
    this.init();
  }

  /**
     * Initializes the view by calling the functions to
     * create DOM references, setup event handlers and
     * then create the event listeners
     *
     * @return {Object} Header A reference to the current instance of the class
     * @chainable
     */_createClass(Video, [{ key: 'init', value: function init()
    {
      console.log((0, _Utils.getcookie)('video'));
      if ((0, _Utils.getcookie)('video') !== 'true') {
        this.cacheDomReferences().
        setupHandlers().
        enable();


        document.body.classList.add('video-open');
        document.cookie = 'video=true;';
        this.content.classList.remove('hidden');
      } else {
        this.element.classList.add('fade');
        this.element.classList.add('hidden');
      }

      return this;
    }

    /**
       * Cache DOM References
       *
       * Find all necessary DOM elements used in the view and cache them
       *
       * @return {Object} Header A reference to the current instance of the class
       * @chainable
       */ }, { key: 'cacheDomReferences', value: function cacheDomReferences()
    {
      this.content = this.element.querySelector('.video__content');

      return this;
    }

    /**
       * Bind event handlers with the proper context of `this`.
       *
       * @return {Object} Video A reference to the current instance of the class
       * @chainable
       */ }, { key: 'setupHandlers', value: function setupHandlers()
    {
      /**
       * A reference to the `onClick` function with the proper
       * context bound
       *
       * @property {Function}
       */
      this.onClickHandler = this.onClick.bind(this);

      return this;
    }

    /**
       * Create event handlers to enable interaction with view
       *
       * @return {Object} Video A reference to the current instance of the class
       * @chainable
       */ }, { key: 'enable', value: function enable()
    {
      // handle Video trigger click
      this.element.addEventListener(_Constants.EVENTS.CLICK, this.onClickHandler);
      this.element.addEventListener(_Constants.EVENTS.KEY_DOWN, this.onClickHandler);

      return this;
    }

    /**
       * Clicking the content will cause it to be removed from sight
       *
       * @return {Object} A reference to the current instance of this class
       * @chainable
       */ }, { key: 'onClick', value: function onClick()
    {
      event.preventDefault();
      this.element.classList.add('fade');
      document.body.classList.remove('video-open');
    } }]);return Video;}();exports.default = Video;

},{"../../Constants":18,"../../Utils":24}],37:[function(require,module,exports){
(function (global){
/* eslint-env browser */
'use strict';

// Foundation Core
require('foundation-sites/js/foundation.core.js');

require('foundation-sites/js/foundation.util.box.js');
require('foundation-sites/js/foundation.util.keyboard.js');
require('foundation-sites/js/foundation.util.mediaQuery.js');
require('foundation-sites/js/foundation.util.motion.js');
require('foundation-sites/js/foundation.util.nest.js');
require('foundation-sites/js/foundation.util.timerAndImageLoader.js');
require('foundation-sites/js/foundation.util.touch.js');
require('foundation-sites/js/foundation.util.triggers.js');




require('foundation-sites/js/foundation.offcanvas.js');

var _jquery = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null);var _jquery2 = _interopRequireDefault(_jquery);

var _socialShare = require('modules/socialShare.js');var _socialShare2 = _interopRequireDefault(_socialShare);


var _App = require('./App');var _App2 = _interopRequireDefault(_App);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} // import prepInputs from 'modules/prepinputs.js';
// Foundation Plugins. Add or remove as needed for your site
// import 'foundation-sites/js/foundation.drilldown.js';
// import 'foundation-sites/js/foundation.dropdownMenu.js';
// import 'foundation-sites/js/foundation.responsiveMenu.js';
// Foundation Utilities
(function ($) {// Initialize Foundation
  $(document).foundation(); // Prepare form inputs
  // prepInputs();
  // Initialize social share functionality
  // Replace the empty string parameter with your Facebook ID
  (0, _socialShare2.default)('');
  // Attach App to the window
  window.App = new _App2.default();
})(_jquery2.default); // import carousel from 'modules/carousel.js';

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./App":11,"foundation-sites/js/foundation.core.js":1,"foundation-sites/js/foundation.offcanvas.js":2,"foundation-sites/js/foundation.util.box.js":3,"foundation-sites/js/foundation.util.keyboard.js":4,"foundation-sites/js/foundation.util.mediaQuery.js":5,"foundation-sites/js/foundation.util.motion.js":6,"foundation-sites/js/foundation.util.nest.js":7,"foundation-sites/js/foundation.util.timerAndImageLoader.js":8,"foundation-sites/js/foundation.util.touch.js":9,"foundation-sites/js/foundation.util.triggers.js":10,"modules/socialShare.js":38}],38:[function(require,module,exports){
(function (global){
/* eslint-env browser */
'use strict';Object.defineProperty(exports, "__esModule", { value: true });

var _jquery = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null);var _jquery2 = _interopRequireDefault(_jquery);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var socialShare = function socialShare(fbId) {
  var $body = (0, _jquery2.default)('body');

  // Facebook sharing with the SDK
  _jquery2.default.getScript('//connect.facebook.net/en_US/sdk.js').done(function () {
    $body.on('click.sharer-fb', '.sharer-fb', function (e) {
      var $link = (0, _jquery2.default)(e.currentTarget);
      var options = {
        method: 'feed',
        display: 'popup' };

      var newUrl = $link.data('redirect-to') ?
      $link.data('redirect-to') : null;

      e.preventDefault();

      window.FB.init({
        appId: fbId,
        xfbml: false,
        version: 'v2.0',
        status: false,
        cookie: true });


      if ($link.data('title')) {
        options.name = $link.data('title');
      }

      if ($link.data('url')) {
        options.link = $link.data('url');
      }

      if ($link.data('picture')) {
        options.picture = $link.data('picture');
      }

      if ($link.data('description')) {
        options.description = $link.data('description');
      }

      window.FB.ui(options, function (response) {
        if (newUrl) {
          window.location.href = newUrl;
        }
      });
    });
  });

  // Twitter sharing
  $body.on('click.sharer-tw', '.sharer-tw', function (e) {
    var $link = (0, _jquery2.default)(e.currentTarget);
    var url = $link.data('url');
    var text = $link.data('description');
    var via = $link.data('source');
    var twitterURL = 'https://twitter.com/share?url=' + encodeURIComponent(url);

    e.preventDefault();

    if (text) {
      twitterURL += '&text=' + encodeURIComponent(text);
    }
    if (via) {
      twitterURL += '&via=' + encodeURIComponent(via);
    }
    window.open(twitterURL, 'tweet',
    'width=500,height=384,menubar=no,status=no,toolbar=no');
  });

  // LinkedIn sharing
  $body.on('click.sharer-li', '.sharer-li', function (e) {
    var $link = (0, _jquery2.default)(e.target);
    var url = $link.data('url');
    var title = $link.data('title');
    var summary = $link.data('description');
    var source = $link.data('source');
    var linkedinURL = 'https://www.linkedin.com/shareArticle?mini=true&url=' +
    encodeURIComponent(url);

    e.preventDefault();

    if (title) {
      linkedinURL += '&title=' + encodeURIComponent(title);
    } else {
      linkedinURL += '&title=';
    }

    if (summary) {
      linkedinURL += '&summary=' +
      encodeURIComponent(summary.substring(0, 256));
    }

    if (source) {
      linkedinURL += '&source=' + encodeURIComponent(source);
    }

    window.open(linkedinURL, 'linkedin',
    'width=520,height=570,menubar=no,status=no,toolbar=no');
  });
};exports.default =

socialShare;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[37])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmNvcmUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5ib3guanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwic3JjL2pzL0FwcC5qcyIsInNyYy9qcy9Db21wb25lbnRNYXAuanMiLCJzcmMvanMvQ29uc3RhbnRzL2FyaWEuanMiLCJzcmMvanMvQ29uc3RhbnRzL2NsYXNzLW5hbWVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9lbmRwb2ludHMuanMiLCJzcmMvanMvQ29uc3RhbnRzL2Vycm9ycy5qcyIsInNyYy9qcy9Db25zdGFudHMvZXZlbnRzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9pbmRleC5qcyIsInNyYy9qcy9Db25zdGFudHMva2V5LWNvZGVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9taXNjLmpzIiwic3JjL2pzL0NvbnN0YW50cy9zZWxlY3RvcnMuanMiLCJzcmMvanMvVXRpbHMvZGVib3VuY2UuanMiLCJzcmMvanMvVXRpbHMvZ2V0Y29va2llLmpzIiwic3JjL2pzL1V0aWxzL2luZGV4LmpzIiwic3JjL2pzL1V0aWxzL2lzc2Nyb2xsZWRpbnRvdmlldy5qcyIsInNyYy9qcy9VdGlscy9vcGVucG9wdXAuanMiLCJzcmMvanMvVXRpbHMvcmFuZG9tc2VjdXJlc3RyaW5nLmpzIiwic3JjL2pzL1V0aWxzL3Njcm9sbHRvLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvQ2xpY2tTZXJ2aWNlLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvUmVzaXplU2VydmljZS5qcyIsInNyYy9qcy9jb21wb25lbnRzL3NlcnZpY2VzL1Njcm9sbFNlcnZpY2UuanMiLCJzcmMvanMvY29tcG9uZW50cy9zZXJ2aWNlcy9pbmRleC5qcyIsInNyYy9qcy9jb21wb25lbnRzL3ZpZXdzL0ZpbGUuanMiLCJzcmMvanMvY29tcG9uZW50cy92aWV3cy9JblZpZXdwb3J0LmpzIiwic3JjL2pzL2NvbXBvbmVudHMvdmlld3MvTmF2LmpzIiwic3JjL2pzL2NvbXBvbmVudHMvdmlld3MvVmlkZW8uanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9tb2R1bGVzL3NvY2lhbFNoYXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO3NSQ0FBLENBQUMsVUFBUyxDQUFULEVBQVk7O0FBRWI7O0FBRUEsTUFBSSxxQkFBcUIsT0FBekI7O0FBRUE7QUFDQTtBQUNBLE1BQUksYUFBYTtBQUNmLGFBQVMsa0JBRE07O0FBR2Y7OztBQUdBLGNBQVUsRUFOSzs7QUFRZjs7O0FBR0EsWUFBUSxFQVhPOztBQWFmOzs7QUFHQSxTQUFLLGVBQVU7QUFDYixhQUFPLEVBQUUsTUFBRixFQUFVLElBQVYsQ0FBZSxLQUFm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TixDQUFTLGlCQUFULEVBQTRCLFlBQTVCLEVBQTBDLFVBQVMsQ0FBVCxFQUFZO0FBQ3BELFFBQU0sUUFBUSxzQkFBRSxFQUFFLE1BQUosQ0FBZDtBQUNBLFFBQU0sTUFBTSxNQUFNLElBQU4sQ0FBVyxLQUFYLENBQVo7QUFDQSxRQUFNLFFBQVEsTUFBTSxJQUFOLENBQVcsT0FBWCxDQUFkO0FBQ0EsUUFBTSxVQUFVLE1BQU0sSUFBTixDQUFXLGFBQVgsQ0FBaEI7QUFDQSxRQUFNLFNBQVMsTUFBTSxJQUFOLENBQVcsUUFBWCxDQUFmO0FBQ0EsUUFBSSxjQUFjO0FBQ2QsdUJBQW1CLEdBQW5CLENBREo7O0FBR0EsTUFBRSxjQUFGOztBQUVBLFFBQUksS0FBSixFQUFXO0FBQ1QsaUNBQXlCLG1CQUFtQixLQUFuQixDQUF6QjtBQUNELEtBRkQsTUFFTztBQUNMLHFCQUFlLFNBQWY7QUFDRDs7QUFFRCxRQUFJLE9BQUosRUFBYTtBQUNYO0FBQ2dCLHlCQUFtQixRQUFRLFNBQVIsQ0FBa0IsQ0FBbEIsRUFBcUIsR0FBckIsQ0FBbkIsQ0FEaEI7QUFFRDs7QUFFRCxRQUFJLE1BQUosRUFBWTtBQUNWLGtDQUEwQixtQkFBbUIsTUFBbkIsQ0FBMUI7QUFDRDs7QUFFRCxXQUFPLElBQVAsQ0FBWSxXQUFaLEVBQXlCLFVBQXpCO0FBQ0ksMERBREo7QUFFRCxHQTVCRDtBQTZCRCxDQWxHRCxDOztBQW9HZSxXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigkKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRk9VTkRBVElPTl9WRVJTSU9OID0gJzYuMy4xJztcblxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4vLyBUaGlzIGlzIGF0dGFjaGVkIHRvIHRoZSB3aW5kb3csIG9yIHVzZWQgYXMgYSBtb2R1bGUgZm9yIEFNRC9Ccm93c2VyaWZ5XG52YXIgRm91bmRhdGlvbiA9IHtcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cbiAgICovXG4gIF9wbHVnaW5zOiB7fSxcblxuICAvKipcbiAgICogU3RvcmVzIGdlbmVyYXRlZCB1bmlxdWUgaWRzIGZvciBwbHVnaW4gaW5zdGFuY2VzXG4gICAqL1xuICBfdXVpZHM6IFtdLFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3IgUlRMIHN1cHBvcnRcbiAgICovXG4gIHJ0bDogZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gJCgnaHRtbCcpLmF0dHIoJ2RpcicpID09PSAncnRsJztcbiAgfSxcbiAgLyoqXG4gICAqIERlZmluZXMgYSBGb3VuZGF0aW9uIHBsdWdpbiwgYWRkaW5nIGl0IHRvIHRoZSBgRm91bmRhdGlvbmAgbmFtZXNwYWNlIGFuZCB0aGUgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUgd2hlbiByZWZsb3dpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBUaGUgY29uc3RydWN0b3Igb2YgdGhlIHBsdWdpbi5cbiAgICovXG4gIHBsdWdpbjogZnVuY3Rpb24ocGx1Z2luLCBuYW1lKSB7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBhZGRpbmcgdG8gZ2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4gICAgLy8gRXhhbXBsZXM6IEZvdW5kYXRpb24uUmV2ZWFsLCBGb3VuZGF0aW9uLk9mZkNhbnZhc1xuICAgIHZhciBjbGFzc05hbWUgPSAobmFtZSB8fCBmdW5jdGlvbk5hbWUocGx1Z2luKSk7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBzdG9yaW5nIHRoZSBwbHVnaW4sIGFsc28gdXNlZCB0byBjcmVhdGUgdGhlIGlkZW50aWZ5aW5nIGRhdGEgYXR0cmlidXRlIGZvciB0aGUgcGx1Z2luXG4gICAgLy8gRXhhbXBsZXM6IGRhdGEtcmV2ZWFsLCBkYXRhLW9mZi1jYW52YXNcbiAgICB2YXIgYXR0ck5hbWUgID0gaHlwaGVuYXRlKGNsYXNzTmFtZSk7XG5cbiAgICAvLyBBZGQgdG8gdGhlIEZvdW5kYXRpb24gb2JqZWN0IGFuZCB0aGUgcGx1Z2lucyBsaXN0IChmb3IgcmVmbG93aW5nKVxuICAgIHRoaXMuX3BsdWdpbnNbYXR0ck5hbWVdID0gdGhpc1tjbGFzc05hbWVdID0gcGx1Z2luO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFBvcHVsYXRlcyB0aGUgX3V1aWRzIGFycmF5IHdpdGggcG9pbnRlcnMgdG8gZWFjaCBpbmRpdmlkdWFsIHBsdWdpbiBpbnN0YW5jZS5cbiAgICogQWRkcyB0aGUgYHpmUGx1Z2luYCBkYXRhLWF0dHJpYnV0ZSB0byBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZWQgcGx1Z2lucyB0byBhbGxvdyB1c2Ugb2YgJChzZWxlY3RvcikuZm91bmRhdGlvbihtZXRob2QpIGNhbGxzLlxuICAgKiBBbHNvIGZpcmVzIHRoZSBpbml0aWFsaXphdGlvbiBldmVudCBmb3IgZWFjaCBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZXRpdGl2ZSBjb2RlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIHBsdWdpbiwgcGFzc2VkIGFzIGEgY2FtZWxDYXNlZCBzdHJpbmcuXG4gICAqIEBmaXJlcyBQbHVnaW4jaW5pdFxuICAgKi9cbiAgcmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSl7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBuYW1lID8gaHlwaGVuYXRlKG5hbWUpIDogZnVuY3Rpb25OYW1lKHBsdWdpbi5jb25zdHJ1Y3RvcikudG9Mb3dlckNhc2UoKTtcbiAgICBwbHVnaW4udXVpZCA9IHRoaXMuR2V0WW9EaWdpdHMoNiwgcGx1Z2luTmFtZSk7XG5cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApKXsgcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWAsIHBsdWdpbi51dWlkKTsgfVxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKSl7IHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicsIHBsdWdpbik7IH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGluaXRpYWxpemVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jaW5pdFxuICAgICAgICAgICAqL1xuICAgIHBsdWdpbi4kZWxlbWVudC50cmlnZ2VyKGBpbml0LnpmLiR7cGx1Z2luTmFtZX1gKTtcblxuICAgIHRoaXMuX3V1aWRzLnB1c2gocGx1Z2luLnV1aWQpO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFJlbW92ZXMgdGhlIHBsdWdpbnMgdXVpZCBmcm9tIHRoZSBfdXVpZHMgYXJyYXkuXG4gICAqIFJlbW92ZXMgdGhlIHpmUGx1Z2luIGRhdGEgYXR0cmlidXRlLCBhcyB3ZWxsIGFzIHRoZSBkYXRhLXBsdWdpbi1uYW1lIGF0dHJpYnV0ZS5cbiAgICogQWxzbyBmaXJlcyB0aGUgZGVzdHJveWVkIGV2ZW50IGZvciB0aGUgcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAZmlyZXMgUGx1Z2luI2Rlc3Ryb3llZFxuICAgKi9cbiAgdW5yZWdpc3RlclBsdWdpbjogZnVuY3Rpb24ocGx1Z2luKXtcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGh5cGhlbmF0ZShmdW5jdGlvbk5hbWUocGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykuY29uc3RydWN0b3IpKTtcblxuICAgIHRoaXMuX3V1aWRzLnNwbGljZSh0aGlzLl91dWlkcy5pbmRleE9mKHBsdWdpbi51dWlkKSwgMSk7XG4gICAgcGx1Z2luLiRlbGVtZW50LnJlbW92ZUF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApLnJlbW92ZURhdGEoJ3pmUGx1Z2luJylcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jZGVzdHJveWVkXG4gICAgICAgICAgICovXG4gICAgICAgICAgLnRyaWdnZXIoYGRlc3Ryb3llZC56Zi4ke3BsdWdpbk5hbWV9YCk7XG4gICAgZm9yKHZhciBwcm9wIGluIHBsdWdpbil7XG4gICAgICBwbHVnaW5bcHJvcF0gPSBudWxsOy8vY2xlYW4gdXAgc2NyaXB0IHRvIHByZXAgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogQ2F1c2VzIG9uZSBvciBtb3JlIGFjdGl2ZSBwbHVnaW5zIHRvIHJlLWluaXRpYWxpemUsIHJlc2V0dGluZyBldmVudCBsaXN0ZW5lcnMsIHJlY2FsY3VsYXRpbmcgcG9zaXRpb25zLCBldGMuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwbHVnaW5zIC0gb3B0aW9uYWwgc3RyaW5nIG9mIGFuIGluZGl2aWR1YWwgcGx1Z2luIGtleSwgYXR0YWluZWQgYnkgY2FsbGluZyBgJChlbGVtZW50KS5kYXRhKCdwbHVnaW5OYW1lJylgLCBvciBzdHJpbmcgb2YgYSBwbHVnaW4gY2xhc3MgaS5lLiBgJ2Ryb3Bkb3duJ2BcbiAgICogQGRlZmF1bHQgSWYgbm8gYXJndW1lbnQgaXMgcGFzc2VkLCByZWZsb3cgYWxsIGN1cnJlbnRseSBhY3RpdmUgcGx1Z2lucy5cbiAgICovXG4gICByZUluaXQ6IGZ1bmN0aW9uKHBsdWdpbnMpe1xuICAgICB2YXIgaXNKUSA9IHBsdWdpbnMgaW5zdGFuY2VvZiAkO1xuICAgICB0cnl7XG4gICAgICAgaWYoaXNKUSl7XG4gICAgICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgJCh0aGlzKS5kYXRhKCd6ZlBsdWdpbicpLl9pbml0KCk7XG4gICAgICAgICB9KTtcbiAgICAgICB9ZWxzZXtcbiAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHBsdWdpbnMsXG4gICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgICBmbnMgPSB7XG4gICAgICAgICAgICdvYmplY3QnOiBmdW5jdGlvbihwbGdzKXtcbiAgICAgICAgICAgICBwbGdzLmZvckVhY2goZnVuY3Rpb24ocCl7XG4gICAgICAgICAgICAgICBwID0gaHlwaGVuYXRlKHApO1xuICAgICAgICAgICAgICAgJCgnW2RhdGEtJysgcCArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9LFxuICAgICAgICAgICAnc3RyaW5nJzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICBwbHVnaW5zID0gaHlwaGVuYXRlKHBsdWdpbnMpO1xuICAgICAgICAgICAgICQoJ1tkYXRhLScrIHBsdWdpbnMgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3VuZGVmaW5lZCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgdGhpc1snb2JqZWN0J10oT2JqZWN0LmtleXMoX3RoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfTtcbiAgICAgICAgIGZuc1t0eXBlXShwbHVnaW5zKTtcbiAgICAgICB9XG4gICAgIH1jYXRjaChlcnIpe1xuICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgfWZpbmFsbHl7XG4gICAgICAgcmV0dXJuIHBsdWdpbnM7XG4gICAgIH1cbiAgIH0sXG5cbiAgLyoqXG4gICAqIHJldHVybnMgYSByYW5kb20gYmFzZS0zNiB1aWQgd2l0aCBuYW1lc3BhY2luZ1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCAtIG51bWJlciBvZiByYW5kb20gYmFzZS0zNiBkaWdpdHMgZGVzaXJlZC4gSW5jcmVhc2UgZm9yIG1vcmUgcmFuZG9tIHN0cmluZ3MuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgLSBuYW1lIG9mIHBsdWdpbiB0byBiZSBpbmNvcnBvcmF0ZWQgaW4gdWlkLCBvcHRpb25hbC5cbiAgICogQGRlZmF1bHQge1N0cmluZ30gJycgLSBpZiBubyBwbHVnaW4gbmFtZSBpcyBwcm92aWRlZCwgbm90aGluZyBpcyBhcHBlbmRlZCB0byB0aGUgdWlkLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSAtIHVuaXF1ZSBpZFxuICAgKi9cbiAgR2V0WW9EaWdpdHM6IGZ1bmN0aW9uKGxlbmd0aCwgbmFtZXNwYWNlKXtcbiAgICBsZW5ndGggPSBsZW5ndGggfHwgNjtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgoTWF0aC5wb3coMzYsIGxlbmd0aCArIDEpIC0gTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDM2LCBsZW5ndGgpKSkudG9TdHJpbmcoMzYpLnNsaWNlKDEpICsgKG5hbWVzcGFjZSA/IGAtJHtuYW1lc3BhY2V9YCA6ICcnKTtcbiAgfSxcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgcGx1Z2lucyBvbiBhbnkgZWxlbWVudHMgd2l0aGluIGBlbGVtYCAoYW5kIGBlbGVtYCBpdHNlbGYpIHRoYXQgYXJlbid0IGFscmVhZHkgaW5pdGlhbGl6ZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtIC0galF1ZXJ5IG9iamVjdCBjb250YWluaW5nIHRoZSBlbGVtZW50IHRvIGNoZWNrIGluc2lkZS4gQWxzbyBjaGVja3MgdGhlIGVsZW1lbnQgaXRzZWxmLCB1bmxlc3MgaXQncyB0aGUgYGRvY3VtZW50YCBvYmplY3QuXG4gICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBwbHVnaW5zIC0gQSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZS4gTGVhdmUgdGhpcyBvdXQgdG8gaW5pdGlhbGl6ZSBldmVyeXRoaW5nLlxuICAgKi9cbiAgcmVmbG93OiBmdW5jdGlvbihlbGVtLCBwbHVnaW5zKSB7XG5cbiAgICAvLyBJZiBwbHVnaW5zIGlzIHVuZGVmaW5lZCwganVzdCBncmFiIGV2ZXJ5dGhpbmdcbiAgICBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwbHVnaW5zID0gT2JqZWN0LmtleXModGhpcy5fcGx1Z2lucyk7XG4gICAgfVxuICAgIC8vIElmIHBsdWdpbnMgaXMgYSBzdHJpbmcsIGNvbnZlcnQgaXQgdG8gYW4gYXJyYXkgd2l0aCBvbmUgaXRlbVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAnc3RyaW5nJykge1xuICAgICAgcGx1Z2lucyA9IFtwbHVnaW5zXTtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcGx1Z2luXG4gICAgJC5lYWNoKHBsdWdpbnMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgIC8vIEdldCB0aGUgY3VycmVudCBwbHVnaW5cbiAgICAgIHZhciBwbHVnaW4gPSBfdGhpcy5fcGx1Z2luc1tuYW1lXTtcblxuICAgICAgLy8gTG9jYWxpemUgdGhlIHNlYXJjaCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIGVsZW0sIGFzIHdlbGwgYXMgZWxlbSBpdHNlbGYsIHVubGVzcyBlbGVtID09PSBkb2N1bWVudFxuICAgICAgdmFyICRlbGVtID0gJChlbGVtKS5maW5kKCdbZGF0YS0nK25hbWUrJ10nKS5hZGRCYWNrKCdbZGF0YS0nK25hbWUrJ10nKTtcblxuICAgICAgLy8gRm9yIGVhY2ggcGx1Z2luIGZvdW5kLCBpbml0aWFsaXplIGl0XG4gICAgICAkZWxlbS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgLy8gRG9uJ3QgZG91YmxlLWRpcCBvbiBwbHVnaW5zXG4gICAgICAgIGlmICgkZWwuZGF0YSgnemZQbHVnaW4nKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIlRyaWVkIHRvIGluaXRpYWxpemUgXCIrbmFtZStcIiBvbiBhbiBlbGVtZW50IHRoYXQgYWxyZWFkeSBoYXMgYSBGb3VuZGF0aW9uIHBsdWdpbi5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpKXtcbiAgICAgICAgICB2YXIgdGhpbmcgPSAkZWwuYXR0cignZGF0YS1vcHRpb25zJykuc3BsaXQoJzsnKS5mb3JFYWNoKGZ1bmN0aW9uKGUsIGkpe1xuICAgICAgICAgICAgdmFyIG9wdCA9IGUuc3BsaXQoJzonKS5tYXAoZnVuY3Rpb24oZWwpeyByZXR1cm4gZWwudHJpbSgpOyB9KTtcbiAgICAgICAgICAgIGlmKG9wdFswXSkgb3B0c1tvcHRbMF1dID0gcGFyc2VWYWx1ZShvcHRbMV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAkZWwuZGF0YSgnemZQbHVnaW4nLCBuZXcgcGx1Z2luKCQodGhpcyksIG9wdHMpKTtcbiAgICAgICAgfWNhdGNoKGVyKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyKTtcbiAgICAgICAgfWZpbmFsbHl7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0Rm5OYW1lOiBmdW5jdGlvbk5hbWUsXG4gIHRyYW5zaXRpb25lbmQ6IGZ1bmN0aW9uKCRlbGVtKXtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSB7XG4gICAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICAgJ01velRyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gICAgfTtcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICBlbmQ7XG5cbiAgICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKXtcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICBlbmQgPSB0cmFuc2l0aW9uc1t0XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZW5kKXtcbiAgICAgIHJldHVybiBlbmQ7XG4gICAgfWVsc2V7XG4gICAgICBlbmQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICRlbGVtLnRyaWdnZXJIYW5kbGVyKCd0cmFuc2l0aW9uZW5kJywgWyRlbGVtXSk7XG4gICAgICB9LCAxKTtcbiAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XG4gICAgfVxuICB9XG59O1xuXG5Gb3VuZGF0aW9uLnV0aWwgPSB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBkZWJvdW5jZSBlZmZlY3QgdG8gYSBmdW5jdGlvbiBjYWxsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhdCBlbmQgb2YgdGltZW91dC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IC0gVGltZSBpbiBtcyB0byBkZWxheSB0aGUgY2FsbCBvZiBgZnVuY2AuXG4gICAqIEByZXR1cm5zIGZ1bmN0aW9uXG4gICAqL1xuICB0aHJvdHRsZTogZnVuY3Rpb24gKGZ1bmMsIGRlbGF5KSB7XG4gICAgdmFyIHRpbWVyID0gbnVsbDtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgIGlmICh0aW1lciA9PT0gbnVsbCkge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcblxuLy8gVE9ETzogY29uc2lkZXIgbm90IG1ha2luZyB0aGlzIGEgalF1ZXJ5IGZ1bmN0aW9uXG4vLyBUT0RPOiBuZWVkIHdheSB0byByZWZsb3cgdnMuIHJlLWluaXRpYWxpemVcbi8qKlxuICogVGhlIEZvdW5kYXRpb24galF1ZXJ5IG1ldGhvZC5cbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBtZXRob2QgLSBBbiBhY3Rpb24gdG8gcGVyZm9ybSBvbiB0aGUgY3VycmVudCBqUXVlcnkgb2JqZWN0LlxuICovXG52YXIgZm91bmRhdGlvbiA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBtZXRob2QsXG4gICAgICAkbWV0YSA9ICQoJ21ldGEuZm91bmRhdGlvbi1tcScpLFxuICAgICAgJG5vSlMgPSAkKCcubm8tanMnKTtcblxuICBpZighJG1ldGEubGVuZ3RoKXtcbiAgICAkKCc8bWV0YSBjbGFzcz1cImZvdW5kYXRpb24tbXFcIj4nKS5hcHBlbmRUbyhkb2N1bWVudC5oZWFkKTtcbiAgfVxuICBpZigkbm9KUy5sZW5ndGgpe1xuICAgICRub0pTLnJlbW92ZUNsYXNzKCduby1qcycpO1xuICB9XG5cbiAgaWYodHlwZSA9PT0gJ3VuZGVmaW5lZCcpey8vbmVlZHMgdG8gaW5pdGlhbGl6ZSB0aGUgRm91bmRhdGlvbiBvYmplY3QsIG9yIGFuIGluZGl2aWR1YWwgcGx1Z2luLlxuICAgIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5faW5pdCgpO1xuICAgIEZvdW5kYXRpb24ucmVmbG93KHRoaXMpO1xuICB9ZWxzZSBpZih0eXBlID09PSAnc3RyaW5nJyl7Ly9hbiBpbmRpdmlkdWFsIG1ldGhvZCB0byBpbnZva2Ugb24gYSBwbHVnaW4gb3IgZ3JvdXAgb2YgcGx1Z2luc1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsvL2NvbGxlY3QgYWxsIHRoZSBhcmd1bWVudHMsIGlmIG5lY2Vzc2FyeVxuICAgIHZhciBwbHVnQ2xhc3MgPSB0aGlzLmRhdGEoJ3pmUGx1Z2luJyk7Ly9kZXRlcm1pbmUgdGhlIGNsYXNzIG9mIHBsdWdpblxuXG4gICAgaWYocGx1Z0NsYXNzICE9PSB1bmRlZmluZWQgJiYgcGx1Z0NsYXNzW21ldGhvZF0gIT09IHVuZGVmaW5lZCl7Ly9tYWtlIHN1cmUgYm90aCB0aGUgY2xhc3MgYW5kIG1ldGhvZCBleGlzdFxuICAgICAgaWYodGhpcy5sZW5ndGggPT09IDEpey8vaWYgdGhlcmUncyBvbmx5IG9uZSwgY2FsbCBpdCBkaXJlY3RseS5cbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseShwbHVnQ2xhc3MsIGFyZ3MpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLCBlbCl7Ly9vdGhlcndpc2UgbG9vcCB0aHJvdWdoIHRoZSBqUXVlcnkgY29sbGVjdGlvbiBhbmQgaW52b2tlIHRoZSBtZXRob2Qgb24gZWFjaFxuICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KCQoZWwpLmRhdGEoJ3pmUGx1Z2luJyksIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9ZWxzZXsvL2Vycm9yIGZvciBubyBjbGFzcyBvciBubyBtZXRob2RcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIldlJ3JlIHNvcnJ5LCAnXCIgKyBtZXRob2QgKyBcIicgaXMgbm90IGFuIGF2YWlsYWJsZSBtZXRob2QgZm9yIFwiICsgKHBsdWdDbGFzcyA/IGZ1bmN0aW9uTmFtZShwbHVnQ2xhc3MpIDogJ3RoaXMgZWxlbWVudCcpICsgJy4nKTtcbiAgICB9XG4gIH1lbHNley8vZXJyb3IgZm9yIGludmFsaWQgYXJndW1lbnQgdHlwZVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFdlJ3JlIHNvcnJ5LCAke3R5cGV9IGlzIG5vdCBhIHZhbGlkIHBhcmFtZXRlci4gWW91IG11c3QgdXNlIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWV0aG9kIHlvdSB3aXNoIHRvIGludm9rZS5gKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbndpbmRvdy5Gb3VuZGF0aW9uID0gRm91bmRhdGlvbjtcbiQuZm4uZm91bmRhdGlvbiA9IGZvdW5kYXRpb247XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdyB8fCAhd2luZG93LkRhdGUubm93KVxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICB2YXIgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZwKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xuICB9XG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmV4dFRpbWUgPSBNYXRoLm1heChsYXN0VGltZSArIDE2LCBub3cpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcbiAgICB9O1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcbiAgfVxuICAvKipcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXG4gICAqL1xuICBpZighd2luZG93LnBlcmZvcm1hbmNlIHx8ICF3aW5kb3cucGVyZm9ybWFuY2Uubm93KXtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBzdGFydDogRGF0ZS5ub3coKSxcbiAgICAgIG5vdzogZnVuY3Rpb24oKXsgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0OyB9XG4gICAgfTtcbiAgfVxufSkoKTtcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXG4gICAgICAgIGZOT1AgICAgPSBmdW5jdGlvbigpIHt9LFxuICAgICAgICBmQm91bmQgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgIC8vIG5hdGl2ZSBmdW5jdGlvbnMgZG9uJ3QgaGF2ZSBhIHByb3RvdHlwZVxuICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICB9XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XG5mdW5jdGlvbiBmdW5jdGlvbk5hbWUoZm4pIHtcbiAgaWYgKEZ1bmN0aW9uLnByb3RvdHlwZS5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xuICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKGZuKS50b1N0cmluZygpKTtcbiAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0udHJpbSgpIDogXCJcIjtcbiAgfVxuICBlbHNlIGlmIChmbi5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmbi5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuZnVuY3Rpb24gcGFyc2VWYWx1ZShzdHIpe1xuICBpZiAoJ3RydWUnID09PSBzdHIpIHJldHVybiB0cnVlO1xuICBlbHNlIGlmICgnZmFsc2UnID09PSBzdHIpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZiAoIWlzTmFOKHN0ciAqIDEpKSByZXR1cm4gcGFyc2VGbG9hdChzdHIpO1xuICByZXR1cm4gc3RyO1xufVxuLy8gQ29udmVydCBQYXNjYWxDYXNlIHRvIGtlYmFiLWNhc2Vcbi8vIFRoYW5rIHlvdTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvODk1NTU4MFxuZnVuY3Rpb24gaHlwaGVuYXRlKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG59XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBPZmZDYW52YXMgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm9mZmNhbnZhc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICovXG5cbmNsYXNzIE9mZkNhbnZhcyB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIG9mZi1jYW52YXMgd3JhcHBlci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gaW5pdGlhbGl6ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBPZmZDYW52YXMuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLiRsYXN0VHJpZ2dlciA9ICQoKTtcbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ09mZkNhbnZhcycpXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignT2ZmQ2FudmFzJywge1xuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcblxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYnkgYWRkaW5nIHRoZSBleGl0IG92ZXJsYXkgKGlmIG5lZWRlZCkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKGBpcy10cmFuc2l0aW9uLSR7dGhpcy5vcHRpb25zLnRyYW5zaXRpb259YCk7XG5cbiAgICAvLyBGaW5kIHRyaWdnZXJzIHRoYXQgYWZmZWN0IHRoaXMgZWxlbWVudCBhbmQgYWRkIGFyaWEtZXhwYW5kZWQgdG8gdGhlbVxuICAgIHRoaXMuJHRyaWdnZXJzID0gJChkb2N1bWVudClcbiAgICAgIC5maW5kKCdbZGF0YS1vcGVuPVwiJytpZCsnXCJdLCBbZGF0YS1jbG9zZT1cIicraWQrJ1wiXSwgW2RhdGEtdG9nZ2xlPVwiJytpZCsnXCJdJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJylcbiAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgaWQpO1xuXG4gICAgLy8gQWRkIGFuIG92ZXJsYXkgb3ZlciB0aGUgY29udGVudCBpZiBuZWNlc3NhcnlcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdmFyIG92ZXJsYXlQb3NpdGlvbiA9ICQodGhpcy4kZWxlbWVudCkuY3NzKFwicG9zaXRpb25cIikgPT09ICdmaXhlZCcgPyAnaXMtb3ZlcmxheS1maXhlZCcgOiAnaXMtb3ZlcmxheS1hYnNvbHV0ZSc7XG4gICAgICBvdmVybGF5LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnanMtb2ZmLWNhbnZhcy1vdmVybGF5ICcgKyBvdmVybGF5UG9zaXRpb24pO1xuICAgICAgdGhpcy4kb3ZlcmxheSA9ICQob3ZlcmxheSk7XG4gICAgICBpZihvdmVybGF5UG9zaXRpb24gPT09ICdpcy1vdmVybGF5LWZpeGVkJykge1xuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuJG92ZXJsYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5zaWJsaW5ncygnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmFwcGVuZCh0aGlzLiRvdmVybGF5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9IHRoaXMub3B0aW9ucy5pc1JldmVhbGVkIHx8IG5ldyBSZWdFeHAodGhpcy5vcHRpb25zLnJldmVhbENsYXNzLCAnZycpLnRlc3QodGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pc1JldmVhbGVkID09PSB0cnVlKSB7XG4gICAgICB0aGlzLm9wdGlvbnMucmV2ZWFsT24gPSB0aGlzLm9wdGlvbnMucmV2ZWFsT24gfHwgdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyhyZXZlYWwtZm9yLW1lZGl1bXxyZXZlYWwtZm9yLWxhcmdlKS9nKVswXS5zcGxpdCgnLScpWzJdO1xuICAgICAgdGhpcy5fc2V0TVFDaGVja2VyKCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID09PSB0cnVlKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUgPSBwYXJzZUZsb2F0KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCQoJ1tkYXRhLW9mZi1jYW52YXNdJylbMF0pLnRyYW5zaXRpb25EdXJhdGlvbikgKiAxMDAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYW5kIHRoZSBleGl0IG92ZXJsYXkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpLm9uKHtcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgICdrZXlkb3duLnpmLm9mZmNhbnZhcyc6IHRoaXMuX2hhbmRsZUtleWJvYXJkLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrID09PSB0cnVlKSB7XG4gICAgICB2YXIgJHRhcmdldCA9IHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA/IHRoaXMuJG92ZXJsYXkgOiAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJyk7XG4gICAgICAkdGFyZ2V0Lm9uKHsnY2xpY2suemYub2ZmY2FudmFzJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgZXZlbnQgbGlzdGVuZXIgZm9yIGVsZW1lbnRzIHRoYXQgd2lsbCByZXZlYWwgYXQgY2VydGFpbiBicmVha3BvaW50cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRNUUNoZWNrZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KS5vbmUoJ2xvYWQuemYub2ZmY2FudmFzJywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHJldmVhbGluZy9oaWRpbmcgdGhlIG9mZi1jYW52YXMgYXQgYnJlYWtwb2ludHMsIG5vdCB0aGUgc2FtZSBhcyBvcGVuLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzUmV2ZWFsZWQgLSB0cnVlIGlmIGVsZW1lbnQgc2hvdWxkIGJlIHJldmVhbGVkLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHJldmVhbChpc1JldmVhbGVkKSB7XG4gICAgdmFyICRjbG9zZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWNsb3NlXScpO1xuICAgIGlmIChpc1JldmVhbGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSB0cnVlO1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ29wZW4uemYudHJpZ2dlciB0b2dnbGUuemYudHJpZ2dlcicpO1xuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7ICRjbG9zZXIuaGlkZSgpOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IGZhbHNlO1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpXG4gICAgICB9KTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkge1xuICAgICAgICAkY2xvc2VyLnNob3coKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgc2Nyb2xsaW5nIG9mIHRoZSBib2R5IHdoZW4gb2ZmY2FudmFzIGlzIG9wZW4gb24gbW9iaWxlIFNhZmFyaSBhbmQgb3RoZXIgdHJvdWJsZXNvbWUgYnJvd3NlcnMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc3RvcFNjcm9sbGluZyhldmVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRha2VuIGFuZCBhZGFwdGVkIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjg4OTQ0Ny9wcmV2ZW50LWZ1bGwtcGFnZS1zY3JvbGxpbmctaW9zXG4gIC8vIE9ubHkgcmVhbGx5IHdvcmtzIGZvciB5LCBub3Qgc3VyZSBob3cgdG8gZXh0ZW5kIHRvIHggb3IgaWYgd2UgbmVlZCB0by5cbiAgX3JlY29yZFNjcm9sbGFibGUoZXZlbnQpIHtcbiAgICBsZXQgZWxlbSA9IHRoaXM7IC8vIGNhbGxlZCBmcm9tIGV2ZW50IGhhbmRsZXIgY29udGV4dCB3aXRoIHRoaXMgYXMgZWxlbVxuXG4gICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHNjcm9sbGFibGUgKGNvbnRlbnQgb3ZlcmZsb3dzKSwgdGhlbi4uLlxuICAgIGlmIChlbGVtLnNjcm9sbEhlaWdodCAhPT0gZWxlbS5jbGllbnRIZWlnaHQpIHtcbiAgICAgIC8vIElmIHdlJ3JlIGF0IHRoZSB0b3AsIHNjcm9sbCBkb3duIG9uZSBwaXhlbCB0byBhbGxvdyBzY3JvbGxpbmcgdXBcbiAgICAgIGlmIChlbGVtLnNjcm9sbFRvcCA9PT0gMCkge1xuICAgICAgICBlbGVtLnNjcm9sbFRvcCA9IDE7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgYm90dG9tLCBzY3JvbGwgdXAgb25lIHBpeGVsIHRvIGFsbG93IHNjcm9sbGluZyBkb3duXG4gICAgICBpZiAoZWxlbS5zY3JvbGxUb3AgPT09IGVsZW0uc2Nyb2xsSGVpZ2h0IC0gZWxlbS5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSBlbGVtLnNjcm9sbEhlaWdodCAtIGVsZW0uY2xpZW50SGVpZ2h0IC0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxlbS5hbGxvd1VwID0gZWxlbS5zY3JvbGxUb3AgPiAwO1xuICAgIGVsZW0uYWxsb3dEb3duID0gZWxlbS5zY3JvbGxUb3AgPCAoZWxlbS5zY3JvbGxIZWlnaHQgLSBlbGVtLmNsaWVudEhlaWdodCk7XG4gICAgZWxlbS5sYXN0WSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQucGFnZVk7XG4gIH1cblxuICBfc3RvcFNjcm9sbFByb3BhZ2F0aW9uKGV2ZW50KSB7XG4gICAgbGV0IGVsZW0gPSB0aGlzOyAvLyBjYWxsZWQgZnJvbSBldmVudCBoYW5kbGVyIGNvbnRleHQgd2l0aCB0aGlzIGFzIGVsZW1cbiAgICBsZXQgdXAgPSBldmVudC5wYWdlWSA8IGVsZW0ubGFzdFk7XG4gICAgbGV0IGRvd24gPSAhdXA7XG4gICAgZWxlbS5sYXN0WSA9IGV2ZW50LnBhZ2VZO1xuXG4gICAgaWYoKHVwICYmIGVsZW0uYWxsb3dVcCkgfHwgKGRvd24gJiYgZWxlbS5hbGxvd0Rvd24pKSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjb3BlbmVkXG4gICAqL1xuICBvcGVuKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICh0cmlnZ2VyKSB7XG4gICAgICB0aGlzLiRsYXN0VHJpZ2dlciA9IHRyaWdnZXI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvID09PSAndG9wJykge1xuICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZvcmNlVG8gPT09ICdib3R0b20nKSB7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oMCxkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAqIEBldmVudCBPZmZDYW52YXMjb3BlbmVkXG4gICAgICovXG4gICAgX3RoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpXG4gICAgICAgIC50cmlnZ2VyKCdvcGVuZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICAvLyBJZiBgY29udGVudFNjcm9sbGAgaXMgc2V0IHRvIGZhbHNlLCBhZGQgY2xhc3MgYW5kIGRpc2FibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vbigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbGluZyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCd0b3VjaHN0YXJ0JywgdGhpcy5fcmVjb3JkU2Nyb2xsYWJsZSk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuYWRkQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSAmJiB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuYWRkQ2xhc3MoJ2lzLWNsb3NhYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCh0aGlzLiRlbGVtZW50KSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLiRlbGVtZW50LmZpbmQoJ2EsIGJ1dHRvbicpLmVxKDApLmZvY3VzKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cyA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5zaWJsaW5ncygnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLnRyYXBGb2N1cyh0aGlzLiRlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNiIHRvIGZpcmUgYWZ0ZXIgY2xvc3VyZS5cbiAgICogQGZpcmVzIE9mZkNhbnZhcyNjbG9zZWRcbiAgICovXG4gIGNsb3NlKGNiKSB7XG4gICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKVxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXG4gICAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgICAgICovXG4gICAgICAgIC50cmlnZ2VyKCdjbG9zZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICAvLyBJZiBgY29udGVudFNjcm9sbGAgaXMgc2V0IHRvIGZhbHNlLCByZW1vdmUgY2xhc3MgYW5kIHJlLWVuYWJsZSBzY3JvbGxpbmcgb24gdG91Y2ggZGV2aWNlcy5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRTY3JvbGwgPT09IGZhbHNlKSB7XG4gICAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLW9mZi1jYW52YXMtb3BlbicpLm9mZigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbGluZyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZigndG91Y2hzdGFydCcsIHRoaXMuX3JlY29yZFNjcm9sbGFibGUpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxQcm9wYWdhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrID09PSB0cnVlICYmIHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5yZW1vdmVDbGFzcygnaXMtY2xvc2FibGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLiR0cmlnZ2Vycy5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cyA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5zaWJsaW5ncygnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlbGVhc2VGb2N1cyh0aGlzLiRlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW4gb3IgY2xvc2VkLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cbiAgICovXG4gIHRvZ2dsZShldmVudCwgdHJpZ2dlcikge1xuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcbiAgICAgIHRoaXMuY2xvc2UoZXZlbnQsIHRyaWdnZXIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMub3BlbihldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMga2V5Ym9hcmQgaW5wdXQgd2hlbiBkZXRlY3RlZC4gV2hlbiB0aGUgZXNjYXBlIGtleSBpcyBwcmVzc2VkLCB0aGUgb2ZmLWNhbnZhcyBtZW51IGNsb3NlcywgYW5kIGZvY3VzIGlzIHJlc3RvcmVkIHRvIHRoZSBlbGVtZW50IHRoYXQgb3BlbmVkIHRoZSBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVLZXlib2FyZChlKSB7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ09mZkNhbnZhcycsIHtcbiAgICAgIGNsb3NlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgdGhpcy4kbGFzdFRyaWdnZXIuZm9jdXMoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgICAgaGFuZGxlZDogKCkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIG9mZmNhbnZhcyBwbHVnaW4uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmNsb3NlKCk7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKTtcbiAgICB0aGlzLiRvdmVybGF5Lm9mZignLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbk9mZkNhbnZhcy5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFsbG93IHRoZSB1c2VyIHRvIGNsaWNrIG91dHNpZGUgb2YgdGhlIG1lbnUgdG8gY2xvc2UgaXQuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcblxuICAvKipcbiAgICogQWRkcyBhbiBvdmVybGF5IG9uIHRvcCBvZiBgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XWAuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGNvbnRlbnRPdmVybGF5OiB0cnVlLFxuXG4gIC8qKlxuICAgKiBFbmFibGUvZGlzYWJsZSBzY3JvbGxpbmcgb2YgdGhlIG1haW4gY29udGVudCB3aGVuIGFuIG9mZiBjYW52YXMgcGFuZWwgaXMgb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY29udGVudFNjcm9sbDogdHJ1ZSxcblxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgaW4gbXMgdGhlIG9wZW4gYW5kIGNsb3NlIHRyYW5zaXRpb24gcmVxdWlyZXMuIElmIG5vbmUgc2VsZWN0ZWQsIHB1bGxzIGZyb20gYm9keSBzdHlsZS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZGVmYXVsdCAwXG4gICAqL1xuICB0cmFuc2l0aW9uVGltZTogMCxcblxuICAvKipcbiAgICogVHlwZSBvZiB0cmFuc2l0aW9uIGZvciB0aGUgb2ZmY2FudmFzIG1lbnUuIE9wdGlvbnMgYXJlICdwdXNoJywgJ2RldGFjaGVkJyBvciAnc2xpZGUnLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0IHB1c2hcbiAgICovXG4gIHRyYW5zaXRpb246ICdwdXNoJyxcblxuICAvKipcbiAgICogRm9yY2UgdGhlIHBhZ2UgdG8gc2Nyb2xsIHRvIHRvcCBvciBib3R0b20gb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICogQGRlZmF1bHQgbnVsbFxuICAgKi9cbiAgZm9yY2VUbzogbnVsbCxcblxuICAvKipcbiAgICogQWxsb3cgdGhlIG9mZmNhbnZhcyB0byByZW1haW4gb3BlbiBmb3IgY2VydGFpbiBicmVha3BvaW50cy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGlzUmV2ZWFsZWQ6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBCcmVha3BvaW50IGF0IHdoaWNoIHRvIHJldmVhbC4gSlMgd2lsbCB1c2UgYSBSZWdFeHAgdG8gdGFyZ2V0IHN0YW5kYXJkIGNsYXNzZXMsIGlmIGNoYW5naW5nIGNsYXNzbmFtZXMsIHBhc3MgeW91ciBjbGFzcyB3aXRoIHRoZSBgcmV2ZWFsQ2xhc3NgIG9wdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICogQGRlZmF1bHQgbnVsbFxuICAgKi9cbiAgcmV2ZWFsT246IG51bGwsXG5cbiAgLyoqXG4gICAqIEZvcmNlIGZvY3VzIHRvIHRoZSBvZmZjYW52YXMgb24gb3Blbi4gSWYgdHJ1ZSwgd2lsbCBmb2N1cyB0aGUgb3BlbmluZyB0cmlnZ2VyIG9uIGNsb3NlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBhdXRvRm9jdXM6IHRydWUsXG5cbiAgLyoqXG4gICAqIENsYXNzIHVzZWQgdG8gZm9yY2UgYW4gb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuLiBGb3VuZGF0aW9uIGRlZmF1bHRzIGZvciB0aGlzIGFyZSBgcmV2ZWFsLWZvci1sYXJnZWAgJiBgcmV2ZWFsLWZvci1tZWRpdW1gLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqIEBkZWZhdWx0IHJldmVhbC1mb3ItXG4gICAqIEB0b2RvIGltcHJvdmUgdGhlIHJlZ2V4IHRlc3RpbmcgZm9yIHRoaXMuXG4gICAqL1xuICByZXZlYWxDbGFzczogJ3JldmVhbC1mb3ItJyxcblxuICAvKipcbiAgICogVHJpZ2dlcnMgb3B0aW9uYWwgZm9jdXMgdHJhcHBpbmcgd2hlbiBvcGVuaW5nIGFuIG9mZmNhbnZhcy4gU2V0cyB0YWJpbmRleCBvZiBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdIHRvIC0xIGZvciBhY2Nlc3NpYmlsaXR5IHB1cnBvc2VzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgdHJhcEZvY3VzOiBmYWxzZVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oT2ZmQ2FudmFzLCAnT2ZmQ2FudmFzJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuRm91bmRhdGlvbi5Cb3ggPSB7XG4gIEltTm90VG91Y2hpbmdZb3U6IEltTm90VG91Y2hpbmdZb3UsXG4gIEdldERpbWVuc2lvbnM6IEdldERpbWVuc2lvbnMsXG4gIEdldE9mZnNldHM6IEdldE9mZnNldHNcbn1cblxuLyoqXG4gKiBDb21wYXJlcyB0aGUgZGltZW5zaW9ucyBvZiBhbiBlbGVtZW50IHRvIGEgY29udGFpbmVyIGFuZCBkZXRlcm1pbmVzIGNvbGxpc2lvbiBldmVudHMgd2l0aCBjb250YWluZXIuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB0ZXN0IGZvciBjb2xsaXNpb25zLlxuICogQHBhcmFtIHtqUXVlcnl9IHBhcmVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIGJvdW5kaW5nIGNvbnRhaW5lci5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gbHJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgbGVmdCBhbmQgcmlnaHQgdmFsdWVzIG9ubHkuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRiT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIHRvcCBhbmQgYm90dG9tIHZhbHVlcyBvbmx5LlxuICogQGRlZmF1bHQgaWYgbm8gcGFyZW50IG9iamVjdCBwYXNzZWQsIGRldGVjdHMgY29sbGlzaW9ucyB3aXRoIGB3aW5kb3dgLlxuICogQHJldHVybnMge0Jvb2xlYW59IC0gdHJ1ZSBpZiBjb2xsaXNpb24gZnJlZSwgZmFsc2UgaWYgYSBjb2xsaXNpb24gaW4gYW55IGRpcmVjdGlvbi5cbiAqL1xuZnVuY3Rpb24gSW1Ob3RUb3VjaGluZ1lvdShlbGVtZW50LCBwYXJlbnQsIGxyT25seSwgdGJPbmx5KSB7XG4gIHZhciBlbGVEaW1zID0gR2V0RGltZW5zaW9ucyhlbGVtZW50KSxcbiAgICAgIHRvcCwgYm90dG9tLCBsZWZ0LCByaWdodDtcblxuICBpZiAocGFyZW50KSB7XG4gICAgdmFyIHBhckRpbXMgPSBHZXREaW1lbnNpb25zKHBhcmVudCk7XG5cbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gcGFyRGltcy5oZWlnaHQgKyBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gcGFyRGltcy53aWR0aCArIHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICB9XG4gIGVsc2Uge1xuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0ICsgZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xuICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IGVsZURpbXMud2luZG93RGltcy53aWR0aCk7XG4gIH1cblxuICB2YXIgYWxsRGlycyA9IFtib3R0b20sIHRvcCwgbGVmdCwgcmlnaHRdO1xuXG4gIGlmIChsck9ubHkpIHtcbiAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgPT09IHRydWU7XG4gIH1cblxuICBpZiAodGJPbmx5KSB7XG4gICAgcmV0dXJuIHRvcCA9PT0gYm90dG9tID09PSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGFsbERpcnMuaW5kZXhPZihmYWxzZSkgPT09IC0xO1xufTtcblxuLyoqXG4gKiBVc2VzIG5hdGl2ZSBtZXRob2RzIHRvIHJldHVybiBhbiBvYmplY3Qgb2YgZGltZW5zaW9uIHZhbHVlcy5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnkgfHwgSFRNTH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3Qgb3IgRE9NIGVsZW1lbnQgZm9yIHdoaWNoIHRvIGdldCB0aGUgZGltZW5zaW9ucy4gQ2FuIGJlIGFueSBlbGVtZW50IG90aGVyIHRoYXQgZG9jdW1lbnQgb3Igd2luZG93LlxuICogQHJldHVybnMge09iamVjdH0gLSBuZXN0ZWQgb2JqZWN0IG9mIGludGVnZXIgcGl4ZWwgdmFsdWVzXG4gKiBUT0RPIC0gaWYgZWxlbWVudCBpcyB3aW5kb3csIHJldHVybiBvbmx5IHRob3NlIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gR2V0RGltZW5zaW9ucyhlbGVtLCB0ZXN0KXtcbiAgZWxlbSA9IGVsZW0ubGVuZ3RoID8gZWxlbVswXSA6IGVsZW07XG5cbiAgaWYgKGVsZW0gPT09IHdpbmRvdyB8fCBlbGVtID09PSBkb2N1bWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkknbSBzb3JyeSwgRGF2ZS4gSSdtIGFmcmFpZCBJIGNhbid0IGRvIHRoYXQuXCIpO1xuICB9XG5cbiAgdmFyIHJlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgcGFyUmVjdCA9IGVsZW0ucGFyZW50Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblJlY3QgPSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgd2luWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcbiAgICAgIHdpblggPSB3aW5kb3cucGFnZVhPZmZzZXQ7XG5cbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0LFxuICAgIG9mZnNldDoge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHdpblksXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyB3aW5YXG4gICAgfSxcbiAgICBwYXJlbnREaW1zOiB7XG4gICAgICB3aWR0aDogcGFyUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcGFyUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiBwYXJSZWN0LnRvcCArIHdpblksXG4gICAgICAgIGxlZnQ6IHBhclJlY3QubGVmdCArIHdpblhcbiAgICAgIH1cbiAgICB9LFxuICAgIHdpbmRvd0RpbXM6IHtcbiAgICAgIHdpZHRoOiB3aW5SZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiB3aW5SZWN0LmhlaWdodCxcbiAgICAgIG9mZnNldDoge1xuICAgICAgICB0b3A6IHdpblksXG4gICAgICAgIGxlZnQ6IHdpblhcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBvZiB0b3AgYW5kIGxlZnQgaW50ZWdlciBwaXhlbCB2YWx1ZXMgZm9yIGR5bmFtaWNhbGx5IHJlbmRlcmVkIGVsZW1lbnRzLFxuICogc3VjaCBhczogVG9vbHRpcCwgUmV2ZWFsLCBhbmQgRHJvcGRvd25cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCBiZWluZyBwb3NpdGlvbmVkLlxuICogQHBhcmFtIHtqUXVlcnl9IGFuY2hvciAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50J3MgYW5jaG9yIHBvaW50LlxuICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gYSBzdHJpbmcgcmVsYXRpbmcgdG8gdGhlIGRlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQsIHJlbGF0aXZlIHRvIGl0J3MgYW5jaG9yXG4gKiBAcGFyYW0ge051bWJlcn0gdk9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCB2ZXJ0aWNhbCBzZXBhcmF0aW9uIGJldHdlZW4gYW5jaG9yIGFuZCBlbGVtZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IGhPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgaG9yaXpvbnRhbCBzZXBhcmF0aW9uIGJldHdlZW4gYW5jaG9yIGFuZCBlbGVtZW50LlxuICogQHBhcmFtIHtCb29sZWFufSBpc092ZXJmbG93IC0gaWYgYSBjb2xsaXNpb24gZXZlbnQgaXMgZGV0ZWN0ZWQsIHNldHMgdG8gdHJ1ZSB0byBkZWZhdWx0IHRoZSBlbGVtZW50IHRvIGZ1bGwgd2lkdGggLSBhbnkgZGVzaXJlZCBvZmZzZXQuXG4gKiBUT0RPIGFsdGVyL3Jld3JpdGUgdG8gd29yayB3aXRoIGBlbWAgdmFsdWVzIGFzIHdlbGwvaW5zdGVhZCBvZiBwaXhlbHNcbiAqL1xuZnVuY3Rpb24gR2V0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsIHBvc2l0aW9uLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KSB7XG4gIHZhciAkZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICAkYW5jaG9yRGltcyA9IGFuY2hvciA/IEdldERpbWVuc2lvbnMoYW5jaG9yKSA6IG51bGw7XG5cbiAgc3dpdGNoIChwb3NpdGlvbikge1xuICAgIGNhc2UgJ3RvcCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gKCRlbGVEaW1zLmhlaWdodCArIHZPZmZzZXQpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIHRvcCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gKCRlbGVEaW1zLmhlaWdodCArIHZPZmZzZXQpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IGlzT3ZlcmZsb3cgPyBoT2Zmc2V0IDogKCgkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICgkYW5jaG9yRGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpKSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGxlZnQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciByaWdodCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCArIDEsXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXInOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQgKyAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpLFxuICAgICAgICB0b3A6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyAoJGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JldmVhbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICRlbGVEaW1zLndpZHRoKSAvIDIsXG4gICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgdk9mZnNldFxuICAgICAgfVxuICAgIGNhc2UgJ3JldmVhbCBmdWxsJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdsZWZ0IGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0IGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCAtICRlbGVEaW1zLndpZHRoLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICB9XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcbiAqIFBsZWFzZSB0aGFuayBNYXJpdXMgb24gR2l0SHViIC9vd2xiZXJ0eiAqXG4gKiBvciB0aGUgd2ViIGh0dHA6Ly93d3cubWFyaXVzb2xiZXJ0ei5kZS8gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3Qga2V5Q29kZXMgPSB7XG4gIDk6ICdUQUInLFxuICAxMzogJ0VOVEVSJyxcbiAgMjc6ICdFU0NBUEUnLFxuICAzMjogJ1NQQUNFJyxcbiAgMzc6ICdBUlJPV19MRUZUJyxcbiAgMzg6ICdBUlJPV19VUCcsXG4gIDM5OiAnQVJST1dfUklHSFQnLFxuICA0MDogJ0FSUk9XX0RPV04nXG59XG5cbnZhciBjb21tYW5kcyA9IHt9XG5cbnZhciBLZXlib2FyZCA9IHtcbiAga2V5czogZ2V0S2V5Q29kZXMoa2V5Q29kZXMpLFxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcbiAgICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxuICAgKi9cbiAgcGFyc2VLZXkoZXZlbnQpIHtcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcblxuICAgIC8vIFJlbW92ZSB1bi1wcmludGFibGUgY2hhcmFjdGVycywgZS5nLiBmb3IgYGZyb21DaGFyQ29kZWAgY2FsbHMgZm9yIENUUkwgb25seSBldmVudHNcbiAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxXKy8sICcnKTtcblxuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmFsdEtleSkga2V5ID0gYEFMVF8ke2tleX1gO1xuXG4gICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHVuZGVyc2NvcmUsIGluIGNhc2Ugb25seSBtb2RpZmllcnMgd2VyZSB1c2VkIChlLmcuIG9ubHkgYENUUkxfQUxUYClcbiAgICBrZXkgPSBrZXkucmVwbGFjZSgvXyQvLCAnJyk7XG5cbiAgICByZXR1cm4ga2V5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSBnaXZlbiAoa2V5Ym9hcmQpIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQncyBuYW1lLCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHBhcmFtIHtPYmplY3RzfSBmdW5jdGlvbnMgLSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBleGVjdXRlZFxuICAgKi9cbiAgaGFuZGxlS2V5KGV2ZW50LCBjb21wb25lbnQsIGZ1bmN0aW9ucykge1xuICAgIHZhciBjb21tYW5kTGlzdCA9IGNvbW1hbmRzW2NvbXBvbmVudF0sXG4gICAgICBrZXlDb2RlID0gdGhpcy5wYXJzZUtleShldmVudCksXG4gICAgICBjbWRzLFxuICAgICAgY29tbWFuZCxcbiAgICAgIGZuO1xuXG4gICAgaWYgKCFjb21tYW5kTGlzdCkgcmV0dXJuIGNvbnNvbGUud2FybignQ29tcG9uZW50IG5vdCBkZWZpbmVkIScpO1xuXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kTGlzdC5sdHIgPT09ICd1bmRlZmluZWQnKSB7IC8vIHRoaXMgY29tcG9uZW50IGRvZXMgbm90IGRpZmZlcmVudGlhdGUgYmV0d2VlbiBsdHIgYW5kIHJ0bFxuICAgICAgICBjbWRzID0gY29tbWFuZExpc3Q7IC8vIHVzZSBwbGFpbiBsaXN0XG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcblxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xuICAgIH1cbiAgICBjb21tYW5kID0gY21kc1trZXlDb2RlXTtcblxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiAgaWYgZXhpc3RzXG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSBmbi5hcHBseSgpO1xuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMuaGFuZGxlZChyZXR1cm5WYWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xuICAgIGlmKCEkZWxlbWVudCkge3JldHVybiBmYWxzZTsgfVxuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBuYW1lIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxuICAgKi9cblxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XG4gICAgY29tbWFuZHNbY29tcG9uZW50TmFtZV0gPSBjbWRzO1xuICB9LCAgXG5cbiAgLyoqXG4gICAqIFRyYXBzIHRoZSBmb2N1cyBpbiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtICB7alF1ZXJ5fSAkZWxlbWVudCAgalF1ZXJ5IG9iamVjdCB0byB0cmFwIHRoZSBmb3VjcyBpbnRvLlxuICAgKi9cbiAgdHJhcEZvY3VzKCRlbGVtZW50KSB7XG4gICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUoJGVsZW1lbnQpLFxuICAgICAgICAkZmlyc3RGb2N1c2FibGUgPSAkZm9jdXNhYmxlLmVxKDApLFxuICAgICAgICAkbGFzdEZvY3VzYWJsZSA9ICRmb2N1c2FibGUuZXEoLTEpO1xuXG4gICAgJGVsZW1lbnQub24oJ2tleWRvd24uemYudHJhcGZvY3VzJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC50YXJnZXQgPT09ICRsYXN0Rm9jdXNhYmxlWzBdICYmIEZvdW5kYXRpb24uS2V5Ym9hcmQucGFyc2VLZXkoZXZlbnQpID09PSAnVEFCJykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkZmlyc3RGb2N1c2FibGUuZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGV2ZW50LnRhcmdldCA9PT0gJGZpcnN0Rm9jdXNhYmxlWzBdICYmIEZvdW5kYXRpb24uS2V5Ym9hcmQucGFyc2VLZXkoZXZlbnQpID09PSAnU0hJRlRfVEFCJykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkbGFzdEZvY3VzYWJsZS5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogUmVsZWFzZXMgdGhlIHRyYXBwZWQgZm9jdXMgZnJvbSB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtICB7alF1ZXJ5fSAkZWxlbWVudCAgalF1ZXJ5IG9iamVjdCB0byByZWxlYXNlIHRoZSBmb2N1cyBmb3IuXG4gICAqL1xuICByZWxlYXNlRm9jdXMoJGVsZW1lbnQpIHtcbiAgICAkZWxlbWVudC5vZmYoJ2tleWRvd24uemYudHJhcGZvY3VzJyk7XG4gIH1cbn1cblxuLypcbiAqIENvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZy5cbiAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICovXG5mdW5jdGlvbiBnZXRLZXlDb2RlcyhrY3MpIHtcbiAgdmFyIGsgPSB7fTtcbiAgZm9yICh2YXIga2MgaW4ga2NzKSBrW2tjc1trY11dID0ga2NzW2tjXTtcbiAgcmV0dXJuIGs7XG59XG5cbkZvdW5kYXRpb24uS2V5Ym9hcmQgPSBLZXlib2FyZDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vLyBEZWZhdWx0IHNldCBvZiBtZWRpYSBxdWVyaWVzXG5jb25zdCBkZWZhdWx0UXVlcmllcyA9IHtcbiAgJ2RlZmF1bHQnIDogJ29ubHkgc2NyZWVuJyxcbiAgbGFuZHNjYXBlIDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxuICBwb3J0cmFpdCA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICByZXRpbmEgOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xufTtcblxudmFyIE1lZGlhUXVlcnkgPSB7XG4gIHF1ZXJpZXM6IFtdLFxuXG4gIGN1cnJlbnQ6ICcnLFxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbWVkaWEgcXVlcnkgaGVscGVyLCBieSBleHRyYWN0aW5nIHRoZSBicmVha3BvaW50IGxpc3QgZnJvbSB0aGUgQ1NTIGFuZCBhY3RpdmF0aW5nIHRoZSBicmVha3BvaW50IHdhdGNoZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBleHRyYWN0ZWRTdHlsZXMgPSAkKCcuZm91bmRhdGlvbi1tcScpLmNzcygnZm9udC1mYW1pbHknKTtcbiAgICB2YXIgbmFtZWRRdWVyaWVzO1xuXG4gICAgbmFtZWRRdWVyaWVzID0gcGFyc2VTdHlsZVRvT2JqZWN0KGV4dHJhY3RlZFN0eWxlcyk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gbmFtZWRRdWVyaWVzKSB7XG4gICAgICBpZihuYW1lZFF1ZXJpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBzZWxmLnF1ZXJpZXMucHVzaCh7XG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICAgIHZhbHVlOiBgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICR7bmFtZWRRdWVyaWVzW2tleV19KWBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcblxuICAgIHRoaXMuX3dhdGNoZXIoKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzY3JlZW4gaXMgYXQgbGVhc3QgYXMgd2lkZSBhcyBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCdzIHNtYWxsZXIuXG4gICAqL1xuICBhdExlYXN0KHNpemUpIHtcbiAgICB2YXIgcXVlcnkgPSB0aGlzLmdldChzaXplKTtcblxuICAgIGlmIChxdWVyeSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5KS5tYXRjaGVzO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzY3JlZW4gbWF0Y2hlcyB0byBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2ssIGVpdGhlciAnc21hbGwgb25seScgb3IgJ3NtYWxsJy4gT21pdHRpbmcgJ29ubHknIGZhbGxzIGJhY2sgdG8gdXNpbmcgYXRMZWFzdCgpIG1ldGhvZC5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgYnJlYWtwb2ludCBtYXRjaGVzLCBgZmFsc2VgIGlmIGl0IGRvZXMgbm90LlxuICAgKi9cbiAgaXMoc2l6ZSkge1xuICAgIHNpemUgPSBzaXplLnRyaW0oKS5zcGxpdCgnICcpO1xuICAgIGlmKHNpemUubGVuZ3RoID4gMSAmJiBzaXplWzFdID09PSAnb25seScpIHtcbiAgICAgIGlmKHNpemVbMF0gPT09IHRoaXMuX2dldEN1cnJlbnRTaXplKCkpIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5hdExlYXN0KHNpemVbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgZ2V0KHNpemUpIHtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xuICAgICAgaWYodGhpcy5xdWVyaWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcbiAgICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxuICAgKi9cbiAgX2dldEN1cnJlbnRTaXplKCkge1xuICAgIHZhciBtYXRjaGVkO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcblxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKSwgY3VycmVudFNpemUgPSB0aGlzLmN1cnJlbnQ7XG5cbiAgICAgIGlmIChuZXdTaXplICE9PSBjdXJyZW50U2l6ZSkge1xuICAgICAgICAvLyBDaGFuZ2UgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnlcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3U2l6ZTtcblxuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBbbmV3U2l6ZSwgY3VycmVudFNpemVdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxuLy8gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2VcbndpbmRvdy5tYXRjaE1lZGlhIHx8ICh3aW5kb3cubWF0Y2hNZWRpYSA9IGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRm9yIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBtYXRjaE1lZGl1bSBhcGkgc3VjaCBhcyBJRSA5IGFuZCB3ZWJraXRcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcblxuICAvLyBGb3IgdGhvc2UgdGhhdCBkb24ndCBzdXBwb3J0IG1hdGNoTWVkaXVtXG4gIGlmICghc3R5bGVNZWRpYSkge1xuICAgIHZhciBzdHlsZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcbiAgICBzY3JpcHQgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXSxcbiAgICBpbmZvICAgICAgICA9IG51bGw7XG5cbiAgICBzdHlsZS50eXBlICA9ICd0ZXh0L2Nzcyc7XG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xuXG4gICAgc2NyaXB0ICYmIHNjcmlwdC5wYXJlbnROb2RlICYmIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSgpKTtcblxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcblxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xuXG4gIGlmICghc3RyKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcblxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSwge30pO1xuXG4gIHJldHVybiBzdHlsZU9iamVjdDtcbn1cblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG4gICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHRzO1xuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XG4gICAgcHJvZyA9IHRzIC0gc3RhcnQ7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG5cbiAgICBpZihwcm9nIDwgZHVyYXRpb24peyBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlLCBlbGVtKTsgfVxuICAgIGVsc2V7XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XG4gICAgICBlbGVtLnRyaWdnZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pLnRyaWdnZXJIYW5kbGVyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKTtcbiAgICB9XG4gIH1cbiAgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSk7XG59XG5cbi8qKlxuICogQW5pbWF0ZXMgYW4gZWxlbWVudCBpbiBvciBvdXQgdXNpbmcgYSBDU1MgdHJhbnNpdGlvbiBjbGFzcy5cbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbiAtIERlZmluZXMgaWYgdGhlIGFuaW1hdGlvbiBpcyBpbiBvciBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvciBIVE1MIG9iamVjdCB0byBhbmltYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IGFuaW1hdGlvbiAtIENTUyBjbGFzcyB0byB1c2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIHRvIHJ1biB3aGVuIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC5cbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuXG4gIGVsZW1lbnRcbiAgICAuYWRkQ2xhc3MoYW5pbWF0aW9uKVxuICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudFxuICAgICAgLmNzcygndHJhbnNpdGlvbicsICcnKVxuICAgICAgLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZChlbGVtZW50KSwgZmluaXNoKTtcblxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICBpZiAoIWlzSW4pIGVsZW1lbnQuaGlkZSgpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcbiAgfVxuXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhgJHtpbml0Q2xhc3N9ICR7YWN0aXZlQ2xhc3N9ICR7YW5pbWF0aW9ufWApO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTW92ZSA9IE1vdmU7XG5Gb3VuZGF0aW9uLk1vdGlvbiA9IE1vdGlvbjtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBOZXN0ID0ge1xuICBGZWF0aGVyKG1lbnUsIHR5cGUgPSAnemYnKSB7XG4gICAgbWVudS5hdHRyKCdyb2xlJywgJ21lbnViYXInKTtcblxuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5hdHRyKHsncm9sZSc6ICdtZW51aXRlbSd9KSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgaXRlbXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuXG4gICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuYWRkQ2xhc3MoaGFzU3ViQ2xhc3MpXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIE5vdGU6ICBEcmlsbGRvd25zIGJlaGF2ZSBkaWZmZXJlbnRseSBpbiBob3cgdGhleSBoaWRlLCBhbmQgc28gbmVlZFxuICAgICAgICAgIC8vIGFkZGl0aW9uYWwgYXR0cmlidXRlcy4gIFdlIHNob3VsZCBsb29rIGlmIHRoaXMgcG9zc2libHkgb3Zlci1nZW5lcmFsaXplZFxuICAgICAgICAgIC8vIHV0aWxpdHkgKE5lc3QpIGlzIGFwcHJvcHJpYXRlIHdoZW4gd2UgcmV3b3JrIG1lbnVzIGluIDYuNFxuICAgICAgICAgIGlmKHR5cGUgPT09ICdkcmlsbGRvd24nKSB7XG4gICAgICAgICAgICAkaXRlbS5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IGZhbHNlfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICRzdWJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xuICAgICAgICAgIH0pO1xuICAgICAgICBpZih0eXBlID09PSAnZHJpbGxkb3duJykge1xuICAgICAgICAgICRzdWIuYXR0cih7J2FyaWEtaGlkZGVuJzogdHJ1ZX0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtLmFkZENsYXNzKGBpcy1zdWJtZW51LWl0ZW0gJHtzdWJJdGVtQ2xhc3N9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm47XG4gIH0sXG5cbiAgQnVybihtZW51LCB0eXBlKSB7XG4gICAgdmFyIC8vaXRlbXMgPSBtZW51LmZpbmQoJ2xpJyksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnVcbiAgICAgIC5maW5kKCc+bGksIC5tZW51LCAubWVudSA+IGxpJylcbiAgICAgIC5yZW1vdmVDbGFzcyhgJHtzdWJNZW51Q2xhc3N9ICR7c3ViSXRlbUNsYXNzfSAke2hhc1N1YkNsYXNzfSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudSBpcy1hY3RpdmVgKVxuICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpLmNzcygnZGlzcGxheScsICcnKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCAgICAgIG1lbnUuZmluZCgnLicgKyBzdWJNZW51Q2xhc3MgKyAnLCAuJyArIHN1Ykl0ZW1DbGFzcyArICcsIC5oYXMtc3VibWVudSwgLmlzLXN1Ym1lbnUtaXRlbSwgLnN1Ym1lbnUsIFtkYXRhLXN1Ym1lbnVdJylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUNsYXNzKHN1Yk1lbnVDbGFzcyArICcgJyArIHN1Ykl0ZW1DbGFzcyArICcgaGFzLXN1Ym1lbnUgaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUnKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykpO1xuICAgIC8vIGl0ZW1zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAvLyAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgLy8gICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuICAgIC8vICAgaWYoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCl7XG4gICAgLy8gICAgICRpdGVtLnJlbW92ZUNsYXNzKCdpcy1zdWJtZW51LWl0ZW0gJyArIHN1Ykl0ZW1DbGFzcyk7XG4gICAgLy8gICB9XG4gICAgLy8gICBpZigkc3ViLmxlbmd0aCl7XG4gICAgLy8gICAgICRpdGVtLnJlbW92ZUNsYXNzKCdoYXMtc3VibWVudScpO1xuICAgIC8vICAgICAkc3ViLnJlbW92ZUNsYXNzKCdzdWJtZW51ICcgKyBzdWJNZW51Q2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpO1xuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTmVzdCA9IE5lc3Q7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuZnVuY3Rpb24gVGltZXIoZWxlbSwgb3B0aW9ucywgY2IpIHtcbiAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgIGR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbiwvL29wdGlvbnMgaXMgYW4gb2JqZWN0IGZvciBlYXNpbHkgYWRkaW5nIGZlYXR1cmVzIGxhdGVyLlxuICAgICAgbmFtZVNwYWNlID0gT2JqZWN0LmtleXMoZWxlbS5kYXRhKCkpWzBdIHx8ICd0aW1lcicsXG4gICAgICByZW1haW4gPSAtMSxcbiAgICAgIHN0YXJ0LFxuICAgICAgdGltZXI7XG5cbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuXG4gIHRoaXMucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHJlbWFpbiA9IC0xO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGhpcy5zdGFydCgpO1xuICB9XG5cbiAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcbiAgICAvLyBpZighZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiA8PSAwID8gZHVyYXRpb24gOiByZW1haW47XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCBmYWxzZSk7XG4gICAgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgaWYob3B0aW9ucy5pbmZpbml0ZSl7XG4gICAgICAgIF90aGlzLnJlc3RhcnQoKTsvL3JlcnVuIHRoZSB0aW1lci5cbiAgICAgIH1cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICAgIH0sIHJlbWFpbik7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnN0YXJ0LnpmLiR7bmFtZVNwYWNlfWApO1xuICB9XG5cbiAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xuICAgIC8vaWYoZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgdHJ1ZSk7XG4gICAgdmFyIGVuZCA9IERhdGUubm93KCk7XG4gICAgcmVtYWluID0gcmVtYWluIC0gKGVuZCAtIHN0YXJ0KTtcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVycGF1c2VkLnpmLiR7bmFtZVNwYWNlfWApO1xuICB9XG59XG5cbi8qKlxuICogUnVucyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gaW1hZ2VzIGFyZSBmdWxseSBsb2FkZWQuXG4gKiBAcGFyYW0ge09iamVjdH0gaW1hZ2VzIC0gSW1hZ2UocykgdG8gY2hlY2sgaWYgbG9hZGVkLlxuICogQHBhcmFtIHtGdW5jfSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiBpbWFnZSBpcyBmdWxseSBsb2FkZWQuXG4gKi9cbmZ1bmN0aW9uIG9uSW1hZ2VzTG9hZGVkKGltYWdlcywgY2FsbGJhY2spe1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICB1bmxvYWRlZCA9IGltYWdlcy5sZW5ndGg7XG5cbiAgaWYgKHVubG9hZGVkID09PSAwKSB7XG4gICAgY2FsbGJhY2soKTtcbiAgfVxuXG4gIGltYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIC8vIENoZWNrIGlmIGltYWdlIGlzIGxvYWRlZFxuICAgIGlmICh0aGlzLmNvbXBsZXRlIHx8ICh0aGlzLnJlYWR5U3RhdGUgPT09IDQpIHx8ICh0aGlzLnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpKSB7XG4gICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xuICAgIH1cbiAgICAvLyBGb3JjZSBsb2FkIHRoZSBpbWFnZVxuICAgIGVsc2Uge1xuICAgICAgLy8gZml4IGZvciBJRS4gU2VlIGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vc25pcHBldHMvanF1ZXJ5L2ZpeGluZy1sb2FkLWluLWllLWZvci1jYWNoZWQtaW1hZ2VzL1xuICAgICAgdmFyIHNyYyA9ICQodGhpcykuYXR0cignc3JjJyk7XG4gICAgICAkKHRoaXMpLmF0dHIoJ3NyYycsIHNyYyArIChzcmMuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKSk7XG4gICAgICAkKHRoaXMpLm9uZSgnbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBzaW5nbGVJbWFnZUxvYWRlZCgpIHtcbiAgICB1bmxvYWRlZC0tO1xuICAgIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn1cblxuRm91bmRhdGlvbi5UaW1lciA9IFRpbWVyO1xuRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCA9IG9uSW1hZ2VzTG9hZGVkO1xuXG59KGpRdWVyeSk7XG4iLCIvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vLyoqV29yayBpbnNwaXJlZCBieSBtdWx0aXBsZSBqcXVlcnkgc3dpcGUgcGx1Z2lucyoqXG4vLyoqRG9uZSBieSBZb2hhaSBBcmFyYXQgKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4oZnVuY3Rpb24oJCkge1xuXG4gICQuc3BvdFN3aXBlID0ge1xuICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgZW5hYmxlZDogJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZSxcbiAgICBtb3ZlVGhyZXNob2xkOiA3NSxcbiAgICB0aW1lVGhyZXNob2xkOiAyMDBcbiAgfTtcblxuICB2YXIgICBzdGFydFBvc1gsXG4gICAgICAgIHN0YXJ0UG9zWSxcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbGFwc2VkVGltZSxcbiAgICAgICAgaXNNb3ZpbmcgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBvblRvdWNoRW5kKCkge1xuICAgIC8vICBhbGVydCh0aGlzKTtcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlKTtcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCk7XG4gICAgaXNNb3ZpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKGUpIHtcbiAgICBpZiAoJC5zcG90U3dpcGUucHJldmVudERlZmF1bHQpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gICAgaWYoaXNNb3ZpbmcpIHtcbiAgICAgIHZhciB4ID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgdmFyIHkgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICB2YXIgZHggPSBzdGFydFBvc1ggLSB4O1xuICAgICAgdmFyIGR5ID0gc3RhcnRQb3NZIC0geTtcbiAgICAgIHZhciBkaXI7XG4gICAgICBlbGFwc2VkVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lO1xuICAgICAgaWYoTWF0aC5hYnMoZHgpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgICBkaXIgPSBkeCA+IDAgPyAnbGVmdCcgOiAncmlnaHQnO1xuICAgICAgfVxuICAgICAgLy8gZWxzZSBpZihNYXRoLmFicyhkeSkgPj0gJC5zcG90U3dpcGUubW92ZVRocmVzaG9sZCAmJiBlbGFwc2VkVGltZSA8PSAkLnNwb3RTd2lwZS50aW1lVGhyZXNob2xkKSB7XG4gICAgICAvLyAgIGRpciA9IGR5ID4gMCA/ICdkb3duJyA6ICd1cCc7XG4gICAgICAvLyB9XG4gICAgICBpZihkaXIpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBvblRvdWNoRW5kLmNhbGwodGhpcyk7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignc3dpcGUnLCBkaXIpLnRyaWdnZXIoYHN3aXBlJHtkaXJ9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25Ub3VjaFN0YXJ0KGUpIHtcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICBzdGFydFBvc1ggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICBzdGFydFBvc1kgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICBpc01vdmluZyA9IHRydWU7XG4gICAgICBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlKTtcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgJiYgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQpO1xuICB9XG5cbiAgJC5ldmVudC5zcGVjaWFsLnN3aXBlID0geyBzZXR1cDogaW5pdCB9O1xuXG4gICQuZWFjaChbJ2xlZnQnLCAndXAnLCAnZG93bicsICdyaWdodCddLCBmdW5jdGlvbiAoKSB7XG4gICAgJC5ldmVudC5zcGVjaWFsW2Bzd2lwZSR7dGhpc31gXSA9IHsgc2V0dXA6IGZ1bmN0aW9uKCl7XG4gICAgICAkKHRoaXMpLm9uKCdzd2lwZScsICQubm9vcCk7XG4gICAgfSB9O1xuICB9KTtcbn0pKGpRdWVyeSk7XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTWV0aG9kIGZvciBhZGRpbmcgcHN1ZWRvIGRyYWcgZXZlbnRzIHRvIGVsZW1lbnRzICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4hZnVuY3Rpb24oJCl7XG4gICQuZm4uYWRkVG91Y2ggPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLGVsKXtcbiAgICAgICQoZWwpLmJpbmQoJ3RvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsJyxmdW5jdGlvbigpe1xuICAgICAgICAvL3dlIHBhc3MgdGhlIG9yaWdpbmFsIGV2ZW50IG9iamVjdCBiZWNhdXNlIHRoZSBqUXVlcnkgZXZlbnRcbiAgICAgICAgLy9vYmplY3QgaXMgbm9ybWFsaXplZCB0byB3M2Mgc3BlY3MgYW5kIGRvZXMgbm90IHByb3ZpZGUgdGhlIFRvdWNoTGlzdFxuICAgICAgICBoYW5kbGVUb3VjaChldmVudCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHZhciBoYW5kbGVUb3VjaCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgIHZhciB0b3VjaGVzID0gZXZlbnQuY2hhbmdlZFRvdWNoZXMsXG4gICAgICAgICAgZmlyc3QgPSB0b3VjaGVzWzBdLFxuICAgICAgICAgIGV2ZW50VHlwZXMgPSB7XG4gICAgICAgICAgICB0b3VjaHN0YXJ0OiAnbW91c2Vkb3duJyxcbiAgICAgICAgICAgIHRvdWNobW92ZTogJ21vdXNlbW92ZScsXG4gICAgICAgICAgICB0b3VjaGVuZDogJ21vdXNldXAnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0eXBlID0gZXZlbnRUeXBlc1tldmVudC50eXBlXSxcbiAgICAgICAgICBzaW11bGF0ZWRFdmVudFxuICAgICAgICA7XG5cbiAgICAgIGlmKCdNb3VzZUV2ZW50JyBpbiB3aW5kb3cgJiYgdHlwZW9mIHdpbmRvdy5Nb3VzZUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50ID0gbmV3IHdpbmRvdy5Nb3VzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAnYnViYmxlcyc6IHRydWUsXG4gICAgICAgICAgJ2NhbmNlbGFibGUnOiB0cnVlLFxuICAgICAgICAgICdzY3JlZW5YJzogZmlyc3Quc2NyZWVuWCxcbiAgICAgICAgICAnc2NyZWVuWSc6IGZpcnN0LnNjcmVlblksXG4gICAgICAgICAgJ2NsaWVudFgnOiBmaXJzdC5jbGllbnRYLFxuICAgICAgICAgICdjbGllbnRZJzogZmlyc3QuY2xpZW50WVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnQnKTtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQuaW5pdE1vdXNlRXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCBmaXJzdC5zY3JlZW5YLCBmaXJzdC5zY3JlZW5ZLCBmaXJzdC5jbGllbnRYLCBmaXJzdC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMC8qbGVmdCovLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGZpcnN0LnRhcmdldC5kaXNwYXRjaEV2ZW50KHNpbXVsYXRlZEV2ZW50KTtcbiAgICB9O1xuICB9O1xufShqUXVlcnkpO1xuXG5cbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKkZyb20gdGhlIGpRdWVyeSBNb2JpbGUgTGlicmFyeSoqXG4vLyoqbmVlZCB0byByZWNyZWF0ZSBmdW5jdGlvbmFsaXR5Kipcbi8vKiphbmQgdHJ5IHRvIGltcHJvdmUgaWYgcG9zc2libGUqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbi8qIFJlbW92aW5nIHRoZSBqUXVlcnkgZnVuY3Rpb24gKioqKlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbihmdW5jdGlvbiggJCwgd2luZG93LCB1bmRlZmluZWQgKSB7XG5cblx0dmFyICRkb2N1bWVudCA9ICQoIGRvY3VtZW50ICksXG5cdFx0Ly8gc3VwcG9ydFRvdWNoID0gJC5tb2JpbGUuc3VwcG9ydC50b3VjaCxcblx0XHR0b3VjaFN0YXJ0RXZlbnQgPSAndG91Y2hzdGFydCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hzdGFydFwiIDogXCJtb3VzZWRvd25cIixcblx0XHR0b3VjaFN0b3BFdmVudCA9ICd0b3VjaGVuZCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hlbmRcIiA6IFwibW91c2V1cFwiLFxuXHRcdHRvdWNoTW92ZUV2ZW50ID0gJ3RvdWNobW92ZScvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2htb3ZlXCIgOiBcIm1vdXNlbW92ZVwiO1xuXG5cdC8vIHNldHVwIG5ldyBldmVudCBzaG9ydGN1dHNcblx0JC5lYWNoKCAoIFwidG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgXCIgK1xuXHRcdFwic3dpcGUgc3dpcGVsZWZ0IHN3aXBlcmlnaHRcIiApLnNwbGl0KCBcIiBcIiApLCBmdW5jdGlvbiggaSwgbmFtZSApIHtcblxuXHRcdCQuZm5bIG5hbWUgXSA9IGZ1bmN0aW9uKCBmbiApIHtcblx0XHRcdHJldHVybiBmbiA/IHRoaXMuYmluZCggbmFtZSwgZm4gKSA6IHRoaXMudHJpZ2dlciggbmFtZSApO1xuXHRcdH07XG5cblx0XHQvLyBqUXVlcnkgPCAxLjhcblx0XHRpZiAoICQuYXR0ckZuICkge1xuXHRcdFx0JC5hdHRyRm5bIG5hbWUgXSA9IHRydWU7XG5cdFx0fVxuXHR9KTtcblxuXHRmdW5jdGlvbiB0cmlnZ2VyQ3VzdG9tRXZlbnQoIG9iaiwgZXZlbnRUeXBlLCBldmVudCwgYnViYmxlICkge1xuXHRcdHZhciBvcmlnaW5hbFR5cGUgPSBldmVudC50eXBlO1xuXHRcdGV2ZW50LnR5cGUgPSBldmVudFR5cGU7XG5cdFx0aWYgKCBidWJibGUgKSB7XG5cdFx0XHQkLmV2ZW50LnRyaWdnZXIoIGV2ZW50LCB1bmRlZmluZWQsIG9iaiApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkLmV2ZW50LmRpc3BhdGNoLmNhbGwoIG9iaiwgZXZlbnQgKTtcblx0XHR9XG5cdFx0ZXZlbnQudHlwZSA9IG9yaWdpbmFsVHlwZTtcblx0fVxuXG5cdC8vIGFsc28gaGFuZGxlcyB0YXBob2xkXG5cblx0Ly8gQWxzbyBoYW5kbGVzIHN3aXBlbGVmdCwgc3dpcGVyaWdodFxuXHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7XG5cblx0XHQvLyBNb3JlIHRoYW4gdGhpcyBob3Jpem9udGFsIGRpc3BsYWNlbWVudCwgYW5kIHdlIHdpbGwgc3VwcHJlc3Mgc2Nyb2xsaW5nLlxuXHRcdHNjcm9sbFN1cHJlc3Npb25UaHJlc2hvbGQ6IDMwLFxuXG5cdFx0Ly8gTW9yZSB0aW1lIHRoYW4gdGhpcywgYW5kIGl0IGlzbid0IGEgc3dpcGUuXG5cdFx0ZHVyYXRpb25UaHJlc2hvbGQ6IDEwMDAsXG5cblx0XHQvLyBTd2lwZSBob3Jpem9udGFsIGRpc3BsYWNlbWVudCBtdXN0IGJlIG1vcmUgdGhhbiB0aGlzLlxuXHRcdGhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHQvLyBTd2lwZSB2ZXJ0aWNhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBsZXNzIHRoYW4gdGhpcy5cblx0XHR2ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcblxuXHRcdGdldExvY2F0aW9uOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXHRcdFx0dmFyIHdpblBhZ2VYID0gd2luZG93LnBhZ2VYT2Zmc2V0LFxuXHRcdFx0XHR3aW5QYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcblx0XHRcdFx0eCA9IGV2ZW50LmNsaWVudFgsXG5cdFx0XHRcdHkgPSBldmVudC5jbGllbnRZO1xuXG5cdFx0XHRpZiAoIGV2ZW50LnBhZ2VZID09PSAwICYmIE1hdGguZmxvb3IoIHkgKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VZICkgfHxcblx0XHRcdFx0ZXZlbnQucGFnZVggPT09IDAgJiYgTWF0aC5mbG9vciggeCApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVggKSApIHtcblxuXHRcdFx0XHQvLyBpT1M0IGNsaWVudFgvY2xpZW50WSBoYXZlIHRoZSB2YWx1ZSB0aGF0IHNob3VsZCBoYXZlIGJlZW5cblx0XHRcdFx0Ly8gaW4gcGFnZVgvcGFnZVkuIFdoaWxlIHBhZ2VYL3BhZ2UvIGhhdmUgdGhlIHZhbHVlIDBcblx0XHRcdFx0eCA9IHggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IHkgLSB3aW5QYWdlWTtcblx0XHRcdH0gZWxzZSBpZiAoIHkgPCAoIGV2ZW50LnBhZ2VZIC0gd2luUGFnZVkpIHx8IHggPCAoIGV2ZW50LnBhZ2VYIC0gd2luUGFnZVggKSApIHtcblxuXHRcdFx0XHQvLyBTb21lIEFuZHJvaWQgYnJvd3NlcnMgaGF2ZSB0b3RhbGx5IGJvZ3VzIHZhbHVlcyBmb3IgY2xpZW50WC9ZXG5cdFx0XHRcdC8vIHdoZW4gc2Nyb2xsaW5nL3pvb21pbmcgYSBwYWdlLiBEZXRlY3RhYmxlIHNpbmNlIGNsaWVudFgvY2xpZW50WVxuXHRcdFx0XHQvLyBzaG91bGQgbmV2ZXIgYmUgc21hbGxlciB0aGFuIHBhZ2VYL3BhZ2VZIG1pbnVzIHBhZ2Ugc2Nyb2xsXG5cdFx0XHRcdHggPSBldmVudC5wYWdlWCAtIHdpblBhZ2VYO1xuXHRcdFx0XHR5ID0gZXZlbnQucGFnZVkgLSB3aW5QYWdlWTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eDogeCxcblx0XHRcdFx0eTogeVxuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0c3RhcnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF0sXG5cdFx0XHRcdFx0XHRvcmlnaW46ICQoIGV2ZW50LnRhcmdldCApXG5cdFx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0c3RvcDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGRhdGEgPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgP1xuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdGhhbmRsZVN3aXBlOiBmdW5jdGlvbiggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKSB7XG5cdFx0XHRpZiAoIHN0b3AudGltZSAtIHN0YXJ0LnRpbWUgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZHVyYXRpb25UaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZCAmJlxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAxIF0gLSBzdG9wLmNvb3Jkc1sgMSBdICkgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUudmVydGljYWxEaXN0YW5jZVRocmVzaG9sZCApIHtcblx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IHN0YXJ0LmNvb3Jkc1swXSA+IHN0b3AuY29vcmRzWyAwIF0gPyBcInN3aXBlbGVmdFwiIDogXCJzd2lwZXJpZ2h0XCI7XG5cblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBcInN3aXBlXCIsICQuRXZlbnQoIFwic3dpcGVcIiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSksIHRydWUgKTtcblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBkaXJlY3Rpb24sJC5FdmVudCggZGlyZWN0aW9uLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9ICksIHRydWUgKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHR9LFxuXG5cdFx0Ly8gVGhpcyBzZXJ2ZXMgYXMgYSBmbGFnIHRvIGVuc3VyZSB0aGF0IGF0IG1vc3Qgb25lIHN3aXBlIGV2ZW50IGV2ZW50IGlzXG5cdFx0Ly8gaW4gd29yayBhdCBhbnkgZ2l2ZW4gdGltZVxuXHRcdGV2ZW50SW5Qcm9ncmVzczogZmFsc2UsXG5cblx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXZlbnRzLFxuXHRcdFx0XHR0aGlzT2JqZWN0ID0gdGhpcyxcblx0XHRcdFx0JHRoaXMgPSAkKCB0aGlzT2JqZWN0ICksXG5cdFx0XHRcdGNvbnRleHQgPSB7fTtcblxuXHRcdFx0Ly8gUmV0cmlldmUgdGhlIGV2ZW50cyBkYXRhIGZvciB0aGlzIGVsZW1lbnQgYW5kIGFkZCB0aGUgc3dpcGUgY29udGV4dFxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0aWYgKCAhZXZlbnRzICkge1xuXHRcdFx0XHRldmVudHMgPSB7IGxlbmd0aDogMCB9O1xuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiLCBldmVudHMgKTtcblx0XHRcdH1cblx0XHRcdGV2ZW50cy5sZW5ndGgrKztcblx0XHRcdGV2ZW50cy5zd2lwZSA9IGNvbnRleHQ7XG5cblx0XHRcdGNvbnRleHQuc3RhcnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cblx0XHRcdFx0Ly8gQmFpbCBpZiB3ZSdyZSBhbHJlYWR5IHdvcmtpbmcgb24gYSBzd2lwZSBldmVudFxuXHRcdFx0XHRpZiAoICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSB0cnVlO1xuXG5cdFx0XHRcdHZhciBzdG9wLFxuXHRcdFx0XHRcdHN0YXJ0ID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnN0YXJ0KCBldmVudCApLFxuXHRcdFx0XHRcdG9yaWdUYXJnZXQgPSBldmVudC50YXJnZXQsXG5cdFx0XHRcdFx0ZW1pdHRlZCA9IGZhbHNlO1xuXG5cdFx0XHRcdGNvbnRleHQubW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdFx0XHRpZiAoICFzdGFydCB8fCBldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSApIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzdG9wID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnN0b3AoIGV2ZW50ICk7XG5cdFx0XHRcdFx0aWYgKCAhZW1pdHRlZCApIHtcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaGFuZGxlU3dpcGUoIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICk7XG5cdFx0XHRcdFx0XHRpZiAoIGVtaXR0ZWQgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XG5cdFx0XHRcdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gcHJldmVudCBzY3JvbGxpbmdcblx0XHRcdFx0XHRpZiAoIE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkICkge1xuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29udGV4dC5zdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XG5cdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XG5cdFx0XHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBudWxsO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRkb2N1bWVudC5vbiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApXG5cdFx0XHRcdFx0Lm9uZSggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xuXHRcdFx0fTtcblx0XHRcdCR0aGlzLm9uKCB0b3VjaFN0YXJ0RXZlbnQsIGNvbnRleHQuc3RhcnQgKTtcblx0XHR9LFxuXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cywgY29udGV4dDtcblxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0aWYgKCBldmVudHMgKSB7XG5cdFx0XHRcdGNvbnRleHQgPSBldmVudHMuc3dpcGU7XG5cdFx0XHRcdGRlbGV0ZSBldmVudHMuc3dpcGU7XG5cdFx0XHRcdGV2ZW50cy5sZW5ndGgtLTtcblx0XHRcdFx0aWYgKCBldmVudHMubGVuZ3RoID09PSAwICkge1xuXHRcdFx0XHRcdCQucmVtb3ZlRGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGNvbnRleHQgKSB7XG5cdFx0XHRcdGlmICggY29udGV4dC5zdGFydCApIHtcblx0XHRcdFx0XHQkKCB0aGlzICkub2ZmKCB0b3VjaFN0YXJ0RXZlbnQsIGNvbnRleHQuc3RhcnQgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGNvbnRleHQubW92ZSApIHtcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0b3AgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHQkLmVhY2goe1xuXHRcdHN3aXBlbGVmdDogXCJzd2lwZS5sZWZ0XCIsXG5cdFx0c3dpcGVyaWdodDogXCJzd2lwZS5yaWdodFwiXG5cdH0sIGZ1bmN0aW9uKCBldmVudCwgc291cmNlRXZlbnQgKSB7XG5cblx0XHQkLmV2ZW50LnNwZWNpYWxbIGV2ZW50IF0gPSB7XG5cdFx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQoIHRoaXMgKS5iaW5kKCBzb3VyY2VFdmVudCwgJC5ub29wICk7XG5cdFx0XHR9LFxuXHRcdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkudW5iaW5kKCBzb3VyY2VFdmVudCApO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pO1xufSkoIGpRdWVyeSwgdGhpcyApO1xuKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYCBpbiB3aW5kb3cpIHtcbiAgICAgIHJldHVybiB3aW5kb3dbYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmBdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59KCkpO1xuXG5jb25zdCB0cmlnZ2VycyA9IChlbCwgdHlwZSkgPT4ge1xuICBlbC5kYXRhKHR5cGUpLnNwbGl0KCcgJykuZm9yRWFjaChpZCA9PiB7XG4gICAgJChgIyR7aWR9YClbIHR5cGUgPT09ICdjbG9zZScgPyAndHJpZ2dlcicgOiAndHJpZ2dlckhhbmRsZXInXShgJHt0eXBlfS56Zi50cmlnZ2VyYCwgW2VsXSk7XG4gIH0pO1xufTtcbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtb3Blbl0gd2lsbCByZXZlYWwgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1vcGVuXScsIGZ1bmN0aW9uKCkge1xuICB0cmlnZ2VycygkKHRoaXMpLCAnb3BlbicpO1xufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2VdIHdpbGwgY2xvc2UgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4vLyBJZiB1c2VkIHdpdGhvdXQgYSB2YWx1ZSBvbiBbZGF0YS1jbG9zZV0sIHRoZSBldmVudCB3aWxsIGJ1YmJsZSwgYWxsb3dpbmcgaXQgdG8gY2xvc2UgYSBwYXJlbnQgY29tcG9uZW50LlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2VdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgnY2xvc2UnKTtcbiAgaWYgKGlkKSB7XG4gICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ2Nsb3NlJyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZS56Zi50cmlnZ2VyJyk7XG4gIH1cbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLXRvZ2dsZV0gd2lsbCB0b2dnbGUgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGVdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgndG9nZ2xlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICd0b2dnbGUnKTtcbiAgfSBlbHNlIHtcbiAgICAkKHRoaXMpLnRyaWdnZXIoJ3RvZ2dsZS56Zi50cmlnZ2VyJyk7XG4gIH1cbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NhYmxlXSB3aWxsIHJlc3BvbmQgdG8gY2xvc2UuemYudHJpZ2dlciBldmVudHMuXG4kKGRvY3VtZW50KS5vbignY2xvc2UuemYudHJpZ2dlcicsICdbZGF0YS1jbG9zYWJsZV0nLCBmdW5jdGlvbihlKXtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgbGV0IGFuaW1hdGlvbiA9ICQodGhpcykuZGF0YSgnY2xvc2FibGUnKTtcblxuICBpZihhbmltYXRpb24gIT09ICcnKXtcbiAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KCQodGhpcyksIGFuaW1hdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICAgIH0pO1xuICB9ZWxzZXtcbiAgICAkKHRoaXMpLmZhZGVPdXQoKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgfVxufSk7XG5cbiQoZG9jdW1lbnQpLm9uKCdmb2N1cy56Zi50cmlnZ2VyIGJsdXIuemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGUtZm9jdXNdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgndG9nZ2xlLWZvY3VzJyk7XG4gICQoYCMke2lkfWApLnRyaWdnZXJIYW5kbGVyKCd0b2dnbGUuemYudHJpZ2dlcicsIFskKHRoaXMpXSk7XG59KTtcblxuLyoqXG4qIEZpcmVzIG9uY2UgYWZ0ZXIgYWxsIG90aGVyIHNjcmlwdHMgaGF2ZSBsb2FkZWRcbiogQGZ1bmN0aW9uXG4qIEBwcml2YXRlXG4qL1xuJCh3aW5kb3cpLm9uKCdsb2FkJywgKCkgPT4ge1xuICBjaGVja0xpc3RlbmVycygpO1xufSk7XG5cbmZ1bmN0aW9uIGNoZWNrTGlzdGVuZXJzKCkge1xuICBldmVudHNMaXN0ZW5lcigpO1xuICByZXNpemVMaXN0ZW5lcigpO1xuICBzY3JvbGxMaXN0ZW5lcigpO1xuICBtdXRhdGVMaXN0ZW5lcigpO1xuICBjbG9zZW1lTGlzdGVuZXIoKTtcbn1cblxuLy8qKioqKioqKiBvbmx5IGZpcmVzIHRoaXMgZnVuY3Rpb24gb25jZSBvbiBsb2FkLCBpZiB0aGVyZSdzIHNvbWV0aGluZyB0byB3YXRjaCAqKioqKioqKlxuZnVuY3Rpb24gY2xvc2VtZUxpc3RlbmVyKHBsdWdpbk5hbWUpIHtcbiAgdmFyIHlldGlCb3hlcyA9ICQoJ1tkYXRhLXlldGktYm94XScpLFxuICAgICAgcGx1Z05hbWVzID0gWydkcm9wZG93bicsICd0b29sdGlwJywgJ3JldmVhbCddO1xuXG4gIGlmKHBsdWdpbk5hbWUpe1xuICAgIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMucHVzaChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZSBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHBsdWdpbk5hbWVbMF0gPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5jb25jYXQocGx1Z2luTmFtZSk7XG4gICAgfWVsc2V7XG4gICAgICBjb25zb2xlLmVycm9yKCdQbHVnaW4gbmFtZXMgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICB9XG4gIGlmKHlldGlCb3hlcy5sZW5ndGgpe1xuICAgIGxldCBsaXN0ZW5lcnMgPSBwbHVnTmFtZXMubWFwKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gYGNsb3NlbWUuemYuJHtuYW1lfWA7XG4gICAgfSkuam9pbignICcpO1xuXG4gICAgJCh3aW5kb3cpLm9mZihsaXN0ZW5lcnMpLm9uKGxpc3RlbmVycywgZnVuY3Rpb24oZSwgcGx1Z2luSWQpe1xuICAgICAgbGV0IHBsdWdpbiA9IGUubmFtZXNwYWNlLnNwbGl0KCcuJylbMF07XG4gICAgICBsZXQgcGx1Z2lucyA9ICQoYFtkYXRhLSR7cGx1Z2lufV1gKS5ub3QoYFtkYXRhLXlldGktYm94PVwiJHtwbHVnaW5JZH1cIl1gKTtcblxuICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBfdGhpcyA9ICQodGhpcyk7XG5cbiAgICAgICAgX3RoaXMudHJpZ2dlckhhbmRsZXIoJ2Nsb3NlLnpmLnRyaWdnZXInLCBbX3RoaXNdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc2l6ZUxpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtcmVzaXplXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuemYudHJpZ2dlcicpXG4gICAgLm9uKCdyZXNpemUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgcmVzaXplIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwicmVzaXplXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgcmVzaXplIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsTGlzdGVuZXIoZGVib3VuY2Upe1xuICBsZXQgdGltZXIsXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi50cmlnZ2VyJylcbiAgICAub24oJ3Njcm9sbC56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSl7XG4gICAgICBpZih0aW1lcil7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cblxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBzY3JvbGwgZXZlbnRcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJzY3JvbGxcIik7XG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCBzY3JvbGwgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtdXRhdGVMaXN0ZW5lcihkZWJvdW5jZSkge1xuICAgIGxldCAkbm9kZXMgPSAkKCdbZGF0YS1tdXRhdGVdJyk7XG4gICAgaWYgKCRub2Rlcy5sZW5ndGggJiYgTXV0YXRpb25PYnNlcnZlcil7XG5cdFx0XHQvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgbXV0YXRlIGV2ZW50XG4gICAgICAvL25vIElFIDkgb3IgMTBcblx0XHRcdCRub2Rlcy5lYWNoKGZ1bmN0aW9uICgpIHtcblx0XHRcdCAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignbXV0YXRlbWUuemYudHJpZ2dlcicpO1xuXHRcdFx0fSk7XG4gICAgfVxuIH1cblxuZnVuY3Rpb24gZXZlbnRzTGlzdGVuZXIoKSB7XG4gIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XG4gIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlc2l6ZV0sIFtkYXRhLXNjcm9sbF0sIFtkYXRhLW11dGF0ZV0nKTtcblxuICAvL2VsZW1lbnQgY2FsbGJhY2tcbiAgdmFyIGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24gPSBmdW5jdGlvbiAobXV0YXRpb25SZWNvcmRzTGlzdCkge1xuICAgICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcblxuXHQgIC8vdHJpZ2dlciB0aGUgZXZlbnQgaGFuZGxlciBmb3IgdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHR5cGVcbiAgICAgIHN3aXRjaCAobXV0YXRpb25SZWNvcmRzTGlzdFswXS50eXBlKSB7XG5cbiAgICAgICAgY2FzZSBcImF0dHJpYnV0ZXNcIjpcbiAgICAgICAgICBpZiAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikgPT09IFwic2Nyb2xsXCIgJiYgbXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcImRhdGEtZXZlbnRzXCIpIHtcblx0XHQgIFx0JHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcblx0XHQgIH1cblx0XHQgIGlmICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSA9PT0gXCJyZXNpemVcIiAmJiBtdXRhdGlvblJlY29yZHNMaXN0WzBdLmF0dHJpYnV0ZU5hbWUgPT09IFwiZGF0YS1ldmVudHNcIikge1xuXHRcdCAgXHQkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXRdKTtcblx0XHQgICB9XG5cdFx0ICBpZiAobXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcInN0eWxlXCIpIHtcblx0XHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS5hdHRyKFwiZGF0YS1ldmVudHNcIixcIm11dGF0ZVwiKTtcblx0XHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS50cmlnZ2VySGFuZGxlcignbXV0YXRlbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpXSk7XG5cdFx0ICB9XG5cdFx0ICBicmVhaztcblxuICAgICAgICBjYXNlIFwiY2hpbGRMaXN0XCI6XG5cdFx0ICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLmF0dHIoXCJkYXRhLWV2ZW50c1wiLFwibXV0YXRlXCIpO1xuXHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS50cmlnZ2VySGFuZGxlcignbXV0YXRlbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpXSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIC8vbm90aGluZ1xuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAobm9kZXMubGVuZ3RoKSB7XG4gICAgICAvL2ZvciBlYWNoIGVsZW1lbnQgdGhhdCBuZWVkcyB0byBsaXN0ZW4gZm9yIHJlc2l6aW5nLCBzY3JvbGxpbmcsIG9yIG11dGF0aW9uIGFkZCBhIHNpbmdsZSBvYnNlcnZlclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbm9kZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIHZhciBlbGVtZW50T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uKTtcbiAgICAgICAgZWxlbWVudE9ic2VydmVyLm9ic2VydmUobm9kZXNbaV0sIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSwgYXR0cmlidXRlRmlsdGVyOiBbXCJkYXRhLWV2ZW50c1wiLCBcInN0eWxlXCJdIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gW1BIXVxuLy8gRm91bmRhdGlvbi5DaGVja1dhdGNoZXJzID0gY2hlY2tXYXRjaGVycztcbkZvdW5kYXRpb24uSUhlYXJZb3UgPSBjaGVja0xpc3RlbmVycztcbi8vIEZvdW5kYXRpb24uSVNlZVlvdSA9IHNjcm9sbExpc3RlbmVyO1xuLy8gRm91bmRhdGlvbi5JRmVlbFlvdSA9IGNsb3NlbWVMaXN0ZW5lcjtcblxufShqUXVlcnkpO1xuXG4vLyBmdW5jdGlvbiBkb21NdXRhdGlvbk9ic2VydmVyKGRlYm91bmNlKSB7XG4vLyAgIC8vICEhISBUaGlzIGlzIGNvbWluZyBzb29uIGFuZCBuZWVkcyBtb3JlIHdvcms7IG5vdCBhY3RpdmUgICEhISAvL1xuLy8gICB2YXIgdGltZXIsXG4vLyAgIG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbXV0YXRlXScpO1xuLy8gICAvL1xuLy8gICBpZiAobm9kZXMubGVuZ3RoKSB7XG4vLyAgICAgLy8gdmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuLy8gICAgIC8vICAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XG4vLyAgICAgLy8gICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuLy8gICAgIC8vICAgICBpZiAocHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlcicgaW4gd2luZG93KSB7XG4vLyAgICAgLy8gICAgICAgcmV0dXJuIHdpbmRvd1twcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJ107XG4vLyAgICAgLy8gICAgIH1cbi8vICAgICAvLyAgIH1cbi8vICAgICAvLyAgIHJldHVybiBmYWxzZTtcbi8vICAgICAvLyB9KCkpO1xuLy9cbi8vXG4vLyAgICAgLy9mb3IgdGhlIGJvZHksIHdlIG5lZWQgdG8gbGlzdGVuIGZvciBhbGwgY2hhbmdlcyBlZmZlY3RpbmcgdGhlIHN0eWxlIGFuZCBjbGFzcyBhdHRyaWJ1dGVzXG4vLyAgICAgdmFyIGJvZHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGJvZHlNdXRhdGlvbik7XG4vLyAgICAgYm9keU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOnRydWUsIGF0dHJpYnV0ZUZpbHRlcjpbXCJzdHlsZVwiLCBcImNsYXNzXCJdfSk7XG4vL1xuLy9cbi8vICAgICAvL2JvZHkgY2FsbGJhY2tcbi8vICAgICBmdW5jdGlvbiBib2R5TXV0YXRpb24obXV0YXRlKSB7XG4vLyAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgbXV0YXRpb24gZXZlbnRcbi8vICAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG4vL1xuLy8gICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICBib2R5T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuLy8gICAgICAgICAkKCdbZGF0YS1tdXRhdGVdJykuYXR0cignZGF0YS1ldmVudHMnLFwibXV0YXRlXCIpO1xuLy8gICAgICAgfSwgZGVib3VuY2UgfHwgMTUwKTtcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IEluVmlld3BvcnQgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0luVmlld3BvcnQnO1xuaW1wb3J0IENvbXBvbmVudE1hcCBmcm9tICcuL0NvbXBvbmVudE1hcCc7XG5pbXBvcnQgU2VydmljZXMgZnJvbSAnLi9jb21wb25lbnRzL3NlcnZpY2VzJztcblxuLyoqXG4gKiBUaGUgdG9wLWxldmVsIGNvbnRyb2xsZXIgZm9yIHRoZSB3aG9sZSBwYWdlLiBUaGlzIGNvbXBvbmVudCBpcyByZXNwb25zaWJsZVxuICogZm9yIGxvYWRpbmcgb3RoZXIgY29udHJvbGxlcnMgYW5kIHZpZXdzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcHAge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhbGwgZ2xvYmFsIEpTIGNvbXBvbmVudHMgYW5kIGNhbGwgYGxvYWRjb21wb25lbnRzYFxuICAgKiB0byBpbml0aWFsaXplIGFsbCB1bmlxdWUgSlMgY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqXG4gICAgICogU2VydmljZXMgaXMgdGhlIG9iamVjdCB3aGljaCBob2xkcyByZWZlcmVuY2VzIHRvIGFsbCBzZXJ2aWNlc1xuICAgICAqIGNyZWF0ZWQgZm9yIHBhZ2VzLiBTZXJ2aWNlcyBzaG91bGQgYmUgaW5zdGFudGlhdGVkIHRoZXJlIGFuZFxuICAgICAqIHRoZW4gd2lsbCBiZSBpbmplY3RlZCBpbnRvIGVhY2ggY29tcG9uZW50IGZvciBvcHRpb25hbCB1c2UgdmlhIHRoZVxuICAgICAqIGBsb2FkY29tcG9uZW50c2AgZnVuY3Rpb25cbiAgICAgKlxuICAgICAqIEB0eXBlIHtTZXJ2aWNlc31cbiAgICAgKiBAcHJvcGVydHkge1NlcnZpY2VzfVxuICAgICAqL1xuICAgIHRoaXMuU2VydmljZXMgPSBuZXcgU2VydmljZXMoKTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBJblZpZXdwb3J0IHZpZXcgY29tcG9uZW50IHdoaWNoIG5lZWRzIHRvIHJ1biBnbG9iYWxseSBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAgICogQHR5cGUge0luVmlld3BvcnR9XG4gICAgICogQHByb3BlcnR5IHtJblZpZXdwb3J0fVxuICAgICAqL1xuICAgIHRoaXMuaW5WaWV3cG9ydCA9IG5ldyBJblZpZXdwb3J0KHRoaXMuU2VydmljZXMpO1xuXG4gICAgLy8gTG9hZCBlYWNoIGNvbXBvbmVudFxuICAgIHRoaXMubG9hZFBhZ2Vjb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbiBsb29wcyBvdmVyIGFsbCBlbGVtZW50cyBpbiB0aGUgRE9NIHdpdGggdGhlXG4gICAqIGBkYXRhLWxvYWRjb21wb25lbnRgIGF0dHJpYnV0ZSBhbmQgbG9hZHMgdGhlIHNwZWNpZmllZCB2aWV3XG4gICAqIG9yIGNvbnRyb2xsZXIuXG4gICAqXG4gICAqIFRvIGF0dGFjaCBhIEpTIGNvbXBvbmVudCB0byBhbiBIVE1MIGVsZW1lbnQsIGluIHlvdXIgbWFya3VwIHlvdSdkXG4gICAqIGRvIHNvbWV0aGluZyBsaWtlOiA8c2VjdGlvbiBjbGFzcz1cImV4YW1wbGUtY29tcG9uZW50XCIgZGF0YS1sb2FkY29tcG9uZW50PSdFeGFtcGxlY29tcG9uZW50Jz5cbiAgICogd2hlcmUgJ0V4YW1wbGVjb21wb25lbnQnIGlzIHlvdXIgSlMgY2xhc3MgbmFtZS4gWW91J2QgbmVlZCB0byBhZGQgdGhhdCBjb21wb25lbnQgdG8gdGhlIC4vY29tcG9uZW50TWFwLmpzXG4gICAqIGFuZCBtYWtlIHN1cmUgdGhlIGNvbXBvbmVudCBleGlzdHMgYW5kIGlzIGEgcHJvcGVyIEVTNiBjbGFzcywgYW5kIHRoZW4geW91J2xsIGVuZCB1cCB3aXRoXG4gICAqIGFuIEVTNiBjbGFzcyB0aGF0IGlzIHBhc3NlZCBhIHJlZmVyZW5jZSB0byBzZWN0aW9uLmV4YW1wbGUtY29tcG9uZW50IG9uIGluaXQuXG4gICAqL1xuICBsb2FkUGFnZWNvbXBvbmVudHMoKSB7XG4gICAgY29uc3QgYXR0cmlidXRlID0gJ2RhdGEtbG9hZGNvbXBvbmVudCc7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbJyArIGF0dHJpYnV0ZSArICddJyksIChlbGVtZW50KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnbG9hZGluZyBjb21wb25lbnQgJywgZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSk7XG4gICAgICBuZXcgQ29tcG9uZW50TWFwW2VsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSldKGVsZW1lbnQsIHRoaXMuU2VydmljZXMpO1xuICAgIH0pO1xuICB9XG5cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gSW1wb3J0IGFsbCByZXF1aXJlZCBtb2R1bGVzXG4vLyBpbXBvcnQgSGVhZGVyIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9IZWFkZXInO1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0ZpbGUnO1xuaW1wb3J0IE5hdiBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvTmF2JztcbmltcG9ydCBWaWRlbyBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvVmlkZW8nO1xuLy8gaW1wb3J0IEZvcm0gZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0Zvcm0nO1xuLy8gaW1wb3J0IEZpbHRlciBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvRmlsdGVyJztcbi8vIGltcG9ydCBWaWRlbyBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvVmlkZW8nO1xuLy8gaW1wb3J0IFNsaWRlciBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvU2xpZGVyJztcbi8vIGltcG9ydCBBbmNob3IgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0FuY2hvcic7XG4vLyBpbXBvcnQgU29jaWFsU2hhcmUgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1NvY2lhbFNoYXJlJztcbi8vIGltcG9ydCBJblZpZXdwb3J0IGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9JblZpZXdwb3J0Jztcbi8vIGltcG9ydCBCYW5uZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0Jhbm5lcic7XG5cbi8vIEV4cG9ydCByZWZlcmVuY2UgdG8gYWxsIG1vZHVsZXMgaW4gYW4gb2JqZWN0XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLy8gSGVhZGVyLFxuICAgIEZpbGUsXG4gICAgTmF2LFxuICAgIFZpZGVvLFxuICAgIC8vIEZvcm0sXG4gICAgLy8gRmlsdGVyLFxuICAgIC8vIFZpZGVvXG4gICAgLy8gQW5jaG9yLFxuICAgIC8vIFNsaWRlcixcbiAgICAvLyBTb2NpYWxTaGFyZSxcbiAgICAvLyBJblZpZXdwb3J0LFxuICAgIC8vIEJhbm5lcixcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkQVJJQSBTVFJJTkdTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEFSSUEgPSB7XG4gIEVYUEFOREVEOiAgICAgICAgICAgICAgICAgICAgICAnYXJpYS1leHBhbmRlZCcsXG4gIEhJRERFTjogICAgICAgICAgICAgICAgICAgICAgICAnYXJpYS1oaWRkZW4nLFxuICBTRUxFQ1RFRDogICAgICAgICAgICAgICAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJENMQVNTIE5BTUVTIC0gZm9yIGNsYXNzIG5hbWVzXG4vLyAgICAgIG5vdCBDU1Mgc2VsZWN0b3JzXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IENMQVNTX05BTUVTID0ge1xuICBBQk9WRV9CT1RUT006ICAgICAgICAgICAgICAgICAgICdhYm92ZS1ib3R0b20nLFxuICBBQk9WRV9IQUxGV0FZOiAgICAgICAgICAgICAgICAgICdhYm92ZS1oYWxmd2F5JyxcbiAgQUJPVkVfVklFV1BPUlQ6ICAgICAgICAgICAgICAgICAnYWJvdmUtdmlld3BvcnQnLFxuICBBQ1RJVkU6ICAgICAgICAgICAgICAgICAgICAgICAgICdhY3RpdmUnLFxuICBCQU5ORVJfQUNUSVZFOiAgICAgICAgICAgICAgICAgICdiYW5uZXItYWN0aXZlJyxcbiAgQlVUVE9OX1NVQk1JVFRJTkc6ICAgICAgICAgICAgICAnYnV0dG9uLS1zdWJtaXR0aW5nJyxcbiAgQlVUVE9OX1NVQk1JVFRFRDogICAgICAgICAgICAgICAnYnV0dG9uLS1zdWJtaXR0ZWQnLFxuICBFUlJPUjogICAgICAgICAgICAgICAgICAgICAgICAgICdlcnJvcicsXG4gIENMSUNLOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NsaWNrJyxcbiAgQ0xPU0VEOiAgICAgICAgICAgICAgICAgICAgICAgICAnY2xvc2VkJyxcbiAgRklSU1RfQkFUQ0g6ICAgICAgICAgICAgICAgICAgICAnZmlyc3QtYmF0Y2gnLFxuICBGSVhFRDogICAgICAgICAgICAgICAgICAgICAgICAgICduYXYtZml4ZWQnLFxuICBISURJTkc6ICAgICAgICAgICAgICAgICAgICAgICAgICdoaWRpbmcnLFxuICBISURERU46ICAgICAgICAgICAgICAgICAgICAgICAgICdoaWRkZW4nLFxuICBIT1ZFUjogICAgICAgICAgICAgICAgICAgICAgICAgICdob3ZlcicsXG4gIElOVkFMSUQ6ICAgICAgICAgICAgICAgICAgICAgICAgJ2ludmFsaWQnLFxuICBJTl9WSUVXUE9SVDogICAgICAgICAgICAgICAgICAgICdpbi12aWV3cG9ydCcsXG4gIExPQURJTkc6ICAgICAgICAgICAgICAgICAgICAgICAgJ2xvYWRpbmcnLFxuICBNSU5JOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdtaW5pJyxcbiAgT1BFTjogICAgICAgICAgICAgICAgICAgICAgICAgICAnb3BlbicsXG4gIE9QRU5FRDogICAgICAgICAgICAgICAgICAgICAgICAgJ29wZW5lZCcsXG4gIFNDUk9MTEVEOiAgICAgICAgICAgICAgICAgICAgICAgJ3Njcm9sbGVkJyxcbiAgU0VMRUNURUQ6ICAgICAgICAgICAgICAgICAgICAgICAnc2VsZWN0ZWQnLFxuICBTVUJNSVRURUQ6ICAgICAgICAgICAgICAgICAgICAgICdzdWJtaXR0ZWQnLFxuICBWSVNVQUxMWV9ISURERU46ICAgICAgICAgICAgICAgICd2aXN1YWxseS1oaWRkZW4nLFxuICBWQUxJRDogICAgICAgICAgICAgICAgICAgICAgICAgICd2YWxpZCcsXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJE1JU0MgU1RSSU5HU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEVORFBPSU5UUyA9IHtcbiAgU0VBUkNIOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy93cC1qc29uL3JlbGV2YW5zc2kvdjEvc2VhcmNoPycsXG4gIFdQQVBJOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvd3AtanNvbi93cC92Mi8nLFxuICBXUEFQSVRPVEFMOiAgICAgICAgICAgICAgICAgICAgICAgICAnWC1XUC1Ub3RhbCdcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkRVJST1IgTWVzc2FnZXNcbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgRVJST1JTID0ge1xuICBGRUFUVVJFRF9JTUFHRTogICAgICAgICAgICAgICAgICdBIGZlYXR1cmVkIGltYWdlIGlzIHJlcXVpcmVkJyxcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkRVZFTlRTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEVWRU5UUyA9IHtcbiAgQU5JTUFUSU9ORU5EOiAgICAgICAgICAgICAgICAgICAnYW5pbWF0aW9uZW5kJyxcbiAgQkVGT1JFVU5MT0FEOiAgICAgICAgICAgICAgICAgICAnYmVmb3JldW5sb2FkJyxcbiAgQkxVUjogICAgICAgICAgICAgICAgICAgICAgICAgICAnYmx1cicsXG4gIENIQU5HRTogICAgICAgICAgICAgICAgICAgICAgICAgJ2NoYW5nZScsXG4gIENMRUFSX0ZJTFRFUlM6ICAgICAgICAgICAgICAgICAgJ2NsZWFyZmlsdGVycycsXG4gIENMSUNLOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NsaWNrJyxcbiAgQ1VTVE9NX0VWRU5UOiAgICAgICAgICAgICAgICAgICAnY3VzdG9tZXZlbnQnLFxuICBESVNQTEFZX1NVQkhFQURJTkc6ICAgICAgICAgICAgICdkaXNwbGF5c3ViaGVhZGluZycsXG4gIERST1BET1dOX0NIQU5HRUQ6ICAgICAgICAgICAgICAgJ2Ryb3Bkb3duY2hhbmdlZCcsXG4gIEZPUk1fRVJST1I6ICAgICAgICAgICAgICAgICAgICAgJ2Zvcm1lcnJvcicsXG4gIEZPUk1fU1VDQ0VTUzogICAgICAgICAgICAgICAgICAgJ2Zvcm1zdWNjZXNzJyxcbiAgRk9DVVM6ICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9jdXMnLFxuICBIRUFERVJfSElESU5HOiAgICAgICAgICAgICAgICAgICdoZWFkZXItaGlkaW5nJyxcbiAgSU5QVVQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAnaW5wdXQnLFxuICBLRVlfRE9XTjogICAgICAgICAgICAgICAgICAgICAgICdrZXlkb3duJyxcbiAgTU9VU0VPVVQ6ICAgICAgICAgICAgICAgICAgICAgICAnbW91c2VvdXQnLFxuICBNT1VTRU9WRVI6ICAgICAgICAgICAgICAgICAgICAgICdtb3VzZW92ZXInLFxuICBQQUdFU0hPVzogICAgICAgICAgICAgICAgICAgICAgICdwYWdlc2hvdycsXG4gIFJFUVVFU1RfTUFERTogICAgICAgICAgICAgICAgICAgJ3JlcXVlc3RtYWRlJyxcbiAgUkVTSVpFOiAgICAgICAgICAgICAgICAgICAgICAgICAncmVzaXplJyxcbiAgUkVTVUxUU19SRVRVUk5FRDogICAgICAgICAgICAgICAncmVzdWx0c3JldHVybmQnLFxuICBTQ1JPTEw6ICAgICAgICAgICAgICAgICAgICAgICAgICdzY3JvbGwnLFxuICBTSU1VTEFURURfQ0xJQ0s6ICAgICAgICAgICAgICAgICdzaW11bGF0ZWQtY2xpY2snLFxuICBTSE9XX0hJREU6ICAgICAgICAgICAgICAgICAgICAgICdzaG93aGlkZScsXG4gIFNVQk1JVDogICAgICAgICAgICAgICAgICAgICAgICAgJ3N1Ym1pdCcsXG4gIFRPVUNIX0VORDogICAgICAgICAgICAgICAgICAgICAgJ3RvdWNoZW5kJyxcbiAgVE9VQ0hfU1RBUlQ6ICAgICAgICAgICAgICAgICAgICAndG91Y2hzdGFydCcsXG4gIFRSQU5TSVRJT05FTkQ6ICAgICAgICAgICAgICAgICAgJ3RyYW5zaXRpb25lbmQnLFxuICBVUERBVEVfUE9TVF9DT1VOVDogICAgICAgICAgICAgICd1cGRhdGVwb3N0Y291bnQnLFxuICBVUERBVEVfSU5fVklFV1BPUlRfTU9EVUxFUzogICAgICd1cGRhdGVpbnZpZXdwb3J0bW9kdWxlcycsXG4gIFVQREFURV9TRUFSQ0hfV0lUSF9ORVdfSVRFTVM6ICAgJ3VwZGF0ZXNlYXJjaHdpdGhuZXdpdGVtcycsXG4gIFVQREFURV9TRVRUSU5HUzogICAgICAgICAgICAgICAgJ3VwZGF0ZXNldHRpbmdzJyxcbiAgV0hFRUw6ICAgICAgICAgICAgICAgICAgICAgICAgICAnd2hlZWwnXG59O1xuIiwiZXhwb3J0IHsgQVJJQSB9IGZyb20gJy4vYXJpYSc7XG5leHBvcnQgeyBDTEFTU19OQU1FUyB9IGZyb20gJy4vY2xhc3MtbmFtZXMnO1xuZXhwb3J0IHsgRU5EUE9JTlRTIH0gZnJvbSAnLi9lbmRwb2ludHMnO1xuZXhwb3J0IHsgRVJST1JTIH0gZnJvbSAnLi9lcnJvcnMnO1xuZXhwb3J0IHsgRVZFTlRTIH0gZnJvbSAnLi9ldmVudHMnO1xuZXhwb3J0IHsgTUlTQyB9IGZyb20gJy4vbWlzYyc7XG5leHBvcnQgeyBLRVlfQ09ERVN9IGZyb20gJy4va2V5LWNvZGVzJztcbmV4cG9ydCB7IFNFTEVDVE9SUyB9IGZyb20gJy4vc2VsZWN0b3JzJztcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRLRVkgQ09ERVNcbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgS0VZX0NPREVTID0ge1xuICBFU0NBUEU6IDI3LFxuICBFTlRFUjogMTMsXG4gIFNQQUNFQkFSOiAzMlxufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRNSVNDIFNUUklOR1Ncbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBNSVNDID0ge1xuICBCQU5ORVJfQ09PS0lFOiAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyX3ZpZXdlZCcsXG4gIEJBTk5FUl9DT09LSUVfVklFV0VEOiAgICAgICAgICAgICAgICd2aWV3ZWQnLFxuICBCVVRUT05fU1VCTUlUVEVEOiAgICAgICAgICAgICAgICAgICAnVGhhbmsgWW91JyxcbiAgQlVUVE9OX1BST0NFU1NJTkc6ICAgICAgICAgICAgICAgICAgJ1dvcmtpbmcnLFxuICBCRUZPUkVFTkQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAnYmVmb3JlZW5kJyxcbiAgQ0hBTkdFOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NoYW5nZSAnLFxuICBEQVRBX1ZJU0lCTEU6ICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS12aXNpYmxlJyxcbiAgRElTQUJMRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Rpc2FibGVkJyxcbiAgZlVSTDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIucGhwP3U9JyxcbiAgTEFSR0U6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMTAyNCxcbiAgTUVESVVNOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNjQwLFxuICBtVVJMMTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWFpbHRvOicsXG4gIG1VUkwyOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc/c3ViamVjdD0nLFxuICBtVVJMMzogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJmJvZHk9JyxcbiAgdFVSTDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vdHdpdHRlci5jb20vc2hhcmU/dXJsPScsXG4gIHRVUkxUZXh0OiAgICAgICAgICAgICAgICAgICAgICAgICAgICcmdGV4dD0nLFxuICB0VVJMVmlhOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJnZpYT1UaGVEZW1vY3JhdHMnLFxufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJFNFTEVDVE9SUyAtIENTUyBzZWxlY3RvcnMgT05MWVxuLy8gLSAgdGFnIG5hbWVzLCAjaWRzLCAuY2xhc3NuYW1lcywgW2F0dHJpYnV0ZXNdLCBldGNcbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBTRUxFQ1RPUlMgPSB7XG4gIEFMTDogICAgICAgICAgICAgICAgICAgICAgICAgICAgJyNhbGwnLFxuICBBTkNIT1I6ICAgICAgICAgICAgICAgICAgICAgICAgICdhJyxcbiAgQU5DSE9SX1dJVEhfSFJFRjogICAgICAgICAgICAgICAnYVtocmVmXScsXG4gIEFQSV9SRVNVTFRTOiAgICAgICAgICAgICAgICAgICAgJ1tkYXRhLWxvYWRjb21wb25lbnQ9XCJBUElSZXN1bHRzXCJdJyxcbiAgQkFDS0dST1VORDogICAgICAgICAgICAgICAgICAgICAnLmJhY2tncm91bmQnLFxuICBCQU5ORVJfVFJJR0dFUjogICAgICAgICAgICAgICAgICcuYmFubmVyLWNsb3NlJyxcbiAgQlVUVE9OOiAgICAgICAgICAgICAgICAgICAgICAgICAnYnV0dG9uJyxcbiAgQ0hFQ0tFRDogICAgICAgICAgICAgICAgICAgICAgICAnOmNoZWNrZWQnLFxuICBDSEVDS0VEX0xBQkVMOiAgICAgICAgICAgICAgICAgICc6Y2hlY2tlZCArIGxhYmVsJyxcbiAgQ0hFQ0tCT1g6ICAgICAgICAgICAgICAgICAgICAgICAnY2hlY2tib3gnLFxuICBDSEVWUk9OX1NUUklQRTogICAgICAgICAgICAgICAgICcuY2hldnJvbi1zdHJpcGUnLFxuICBDTE9TRTogICAgICAgICAgICAgICAgICAgICAgICAgICcuY2xvc2UnLFxuICBDTE9TRV9TRUFSQ0g6ICAgICAgICAgICAgICAgICAgICcuY2xvc2Utc2VhcmNoJyxcbiAgREFUQV9CT1RUT006ICAgICAgICAgICAgICAgICAgICAnZGF0YS1ib3R0b21wb3NpdGlvbicsXG4gIERBVEFfSEFMRldBWTogICAgICAgICAgICAgICAgICAgJ2RhdGEtaGFsZndheScsXG4gIERBVEFfSEFTX0FOSU1BVEVEOiAgICAgICAgICAgICAgJ2RhdGEtaGFzLWFuaW1hdGVkJyxcbiAgREFUQV9MQVpZX0xPQUQ6ICAgICAgICAgICAgICAgICAnZGF0YS1sYXp5bG9hZCcsXG4gIERBVEFfUE9TSVRJT046ICAgICAgICAgICAgICAgICAgJ2RhdGEtcG9zaXRpb24nLFxuICBEQVRBX1ZJU0lCTEU6ICAgICAgICAgICAgICAgICAgICdbZGF0YS12aXNpYmxlXScsXG4gIERJVjogICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RpdicsXG4gIERST1BET1dOOiAgICAgICAgICAgICAgICAgICAgICAgJy5kcm9wZG93bicsXG4gIERST1BET1dOX0NPTlRFTlQ6ICAgICAgICAgICAgICAgJy5kcm9wZG93bl9fY29udGVudCcsXG4gIERST1BET1dOX1RPR0dMRTogICAgICAgICAgICAgICAgJy5kcm9wZG93bl9fdG9nZ2xlJyxcbiAgRFJPUERPV05fVE9HR0xFX0NMSUNLOiAgICAgICAgICAnLmRyb3Bkb3duLmNsaWNrJyxcbiAgRFJPUERPV05fVE9HR0xFX0hPVkVSOiAgICAgICAgICAnLmRyb3Bkb3duLmhvdmVyJyxcbiAgRU1BSUw6ICAgICAgICAgICAgICAgICAgICAgICAgICAnLnNoYXJlLS1lbWFpbCcsXG4gIEZBQ0VCT09LOiAgICAgICAgICAgICAgICAgICAgICAgJy5zaGFyZS0tZmInLFxuICBGRUFUVVJFRFZJREVPOiAgICAgICAgICAgICAgICAgICcuZmVhdHVyZWQtdmlkZW8gdmlkZW8nLFxuICBGSUxFX0lOUFVUOiAgICAgICAgICAgICAgICAgICAgICdpbnB1dFt0eXBlPWZpbGVdJyxcbiAgRklMVEVSOiAgICAgICAgICAgICAgICAgICAgICAgICAnLmZpbHRlcicsXG4gIEZJTFRFUl9DSE9JQ0U6ICAgICAgICAgICAgICAgICAgJy5maWx0ZXItY2hvaWNlJyxcbiAgRklMVEVSX09QVElPTjogICAgICAgICAgICAgICAgICAnLmZpbHRlci1vcHRpb24nLFxuICBGSUxURVJfVFJJR0dFUjogICAgICAgICAgICAgICAgICcuZmlsdGVyLXRyaWdnZXInLFxuICBGT1JNOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb3JtJyxcbiAgRk9STV9GSUVMRFM6ICAgICAgICAgICAgICAgICAgICAnaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWEnLFxuICBIVE1MOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdodG1sJyxcbiAgSU5WQUxJRDogICAgICAgICAgICAgICAgICAgICAgICAnOmludmFsaWQnLFxuICBMQU5ESU5HX1BBR0VfVElUTEU6ICAgICAgICAgICAgICcubGFuZGluZy1wYWdlLWhlYWRlcl9fdGl0bGUnLFxuICBMSU5LRURJTjogICAgICAgICAgICAgICAgICAgICAgICcuc2hhcmUtLWxpJyxcbiAgTE9BRElORzogICAgICAgICAgICAgICAgICAgICAgICAnLmxvYWRpbmcnLFxuICBMT0FEX01PUkU6ICAgICAgICAgICAgICAgICAgICAgICcubG9hZC1tb3JlJyxcbiAgTkFWOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLnByaW1hcnktbmF2JyxcbiAgTkFWX1RSSUdHRVI6ICAgICAgICAgICAgICAgICAgICAnLm5hdi10cmlnZ2VyJyxcbiAgTkVTVEVEOiAgICAgICAgICAgICAgICAgICAgICAgICAnLm5lc3RlZCcsXG4gIE9HREVTQzogICAgICAgICAgICAgICAgICAgICAgICAgJ21ldGFbcHJvcGVydHk9XCJvZzpkZXNjcmlwdGlvblwiXScsXG4gIE9HVElUTEU6ICAgICAgICAgICAgICAgICAgICAgICAgJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScsXG4gIE9HVVJMOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ21ldGFbcHJvcGVydHk9XCJvZzp1cmxcIl0nLFxuICBPUEVOX1NFQVJDSDogICAgICAgICAgICAgICAgICAgICcub3Blbi1zZWFyY2gnLFxuICBPUFRHUk9VUDogICAgICAgICAgICAgICAgICAgICAgICdvcHRncm91cCcsXG4gIFBBUkFHUkFQSDogICAgICAgICAgICAgICAgICAgICAgJ3AnLFxuICBQTEFZRVI6ICAgICAgICAgICAgICAgICAgICAgICAgICcucGxheWVyJyxcbiAgUExBWV9UUklHR0VSOiAgICAgICAgICAgICAgICAgICAnLnZpZGVvX19wbGF5LXRyaWdnZXInLFxuICBQT1NUX0NPVU5UOiAgICAgICAgICAgICAgICAgICAgICcucG9zdC1jb3VudCAuY291bnQnLFxuICBQT1NUX0xJU1RJTkc6ICAgICAgICAgICAgICAgICAgICcucG9zdC1saXN0aW5nJyxcbiAgUkVTVUxUU19DT05UQUlORVI6ICAgICAgICAgICAgICAnLnJlc3VsdHMtY29udGFpbmVyJyxcbiAgU0VDT05EQVJZX0JMT0dfTElTVElORzogICAgICAgICAnLnNlY29uZGFyeS1ibG9nLWxpc3RpbmcnLFxuICBTRUFSQ0hfSU5QVVQ6ICAgICAgICAgICAgICAgICAgICcuc2VhcmNoLWZpZWxkX19pbnB1dCcsXG4gIFNFTEVDVEVEOiAgICAgICAgICAgICAgICAgICAgICAgJy5zZWxlY3RlZCcsXG4gIFNJVEVfTkFWOiAgICAgICAgICAgICAgICAgICAgICAgJy5uYXZpZ2F0aW9uJyxcbiAgU1RBVElTVElDX1ZBTFVFOiAgICAgICAgICAgICAgICAnLnN0YXRpc3RpY19fdmFsdWUnLFxuICBTVUJNSVQ6ICAgICAgICAgICAgICAgICAgICAgICAgICdbdHlwZT1cInN1Ym1pdFwiXScsXG4gIFNWR19CR19DT05UQUlORVI6ICAgICAgICAgICAgICAgJy5zdmctYmFja2dyb3VuZCcsXG4gIFRBQjogICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1tyb2xlPVwidGFiXCJdJyxcbiAgVEFCUEFORUw6ICAgICAgICAgICAgICAgICAgICAgICAnW3JvbGU9XCJ0YWJwYW5lbFwiXScsXG4gIFRXSVRURVI6ICAgICAgICAgICAgICAgICAgICAgICAgJy5zaGFyZS0tdHcnLFxufTtcbiIsIi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICogYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICogTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gKiBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmdW5jIEEgZnVuY3Rpb24gdG8gY2FsbCBhZnRlciBOIG1pbGxpc2Vjb25kc1xuICogQHBhcmFtICB7bnVtYmVyfSB3YWl0IFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXRcbiAqIEBwYXJhbSAge2Jvb2xlYW59IGltbWVkaWF0ZSBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3QgYmUgdHJpZ2dlcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgbGV0IHRpbWVvdXQ7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzO1xuICAgICAgY29uc3QgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGNvbnN0IGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9O1xuICAgICAgY29uc3QgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICB9O1xufVxuXG4iLCIvKipcbiAqIFJldHVybnMgdGhlIGNvb2tpZSBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG9mIHRoZSBjb29raWUgdG8gZmluZFxuICogQHJldHVybiB7T2JqZWN0fSBjb29raWUgYmFzZWQgb24gbmFtZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldGNvb2tpZShuYW1lKSB7XG4gIGNvbnN0IGNvb2tpZXMgPSB7fVxuICBjb25zdCBjb29raWVTZXQgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsgJyk7XG4gIGNvb2tpZVNldC5mb3JFYWNoKGNvb2tpZSA9PiBjb29raWVzW2Nvb2tpZS5zcGxpdCgnPScpWzBdXSA9IGNvb2tpZS5zcGxpdCgnPScpWzFdKTtcblxuICByZXR1cm4gY29va2llc1tuYW1lXTtcbn07IiwiLy8gZXhwb3J0IHsgY2xvc2VzdCB9IGZyb20gJy4vY2xvc2VzdC5qcyc7XG4vLyBleHBvcnQgeyBjcmVhdGVsb2FkZXIgfSBmcm9tICcuL2xvYWRlcic7XG4vLyBleHBvcnQgeyBjb252ZXJ0ZGF0ZSB9IGZyb20gJy4vY29udmVydGRhdGUuanMnO1xuZXhwb3J0IHsgZGVib3VuY2UgfSBmcm9tICcuL2RlYm91bmNlJztcbmV4cG9ydCB7IGdldGNvb2tpZSB9IGZyb20gJy4vZ2V0Y29va2llJztcbi8vIGV4cG9ydCB7IGhhc2hvdmVyIH0gZnJvbSAnLi9oYXNob3Zlcic7XG4vLyBleHBvcnQgeyBoZXh0b3JnYiB9IGZyb20gJy4vaGV4dG9yZ2InO1xuLy8gZXhwb3J0IHsgaW50ZXJwb2xhdGVudW1iZXJzIH0gZnJvbSAnLi9pbnRlcnBvbGF0ZW51bWJlcnMnO1xuLy8gZXhwb3J0IHsgaXNvYmplY3RlbXB0eSB9IGZyb20gJy4vaXNvYmplY3RlbXB0eSc7XG5leHBvcnQgeyBpc3Njcm9sbGVkaW50b3ZpZXcgfSBmcm9tICcuL2lzc2Nyb2xsZWRpbnRvdmlldyc7XG4vLyBleHBvcnQgeyBNZXNzYWdlQnVzIH0gZnJvbSAnLi9tZXNzYWdlYnVzJztcbmV4cG9ydCB7IG9wZW5wb3B1cCB9IGZyb20gJy4vb3BlbnBvcHVwJztcbi8vIGV4cG9ydCB7IHJlbW92ZWxvYWRlciB9IGZyb20gJy4vbG9hZGVyJztcbmV4cG9ydCB7IHJhbmRvbXNlY3VyZXN0cmluZyB9IGZyb20gJy4vcmFuZG9tc2VjdXJlc3RyaW5nJztcbmV4cG9ydCB7IHNjcm9sbHRvIH0gZnJvbSAnLi9zY3JvbGx0byc7XG4iLCIvKipcbiAqIEEgZnVuY3Rpb24gd2hpY2ggbWVhc3VyZXMgdGhlIGVsZW1lbnRzIHBvc2l0aW9uIG9uIHRoZSBwYWdlIGluXG4gKiByZWxhdGlvbiB0byB0aGUgd2hhdCB0aGUgdXNlciBjYW4gY3VycmVudGx5IHNlZSBvbiB0aGVpciBzY3JlZW5cbiAqIGFuZCByZXR1cm5zIGEgYm9vbGVhbiB2YWx1ZSB3aXRoIGB0cnVlYCBiZWluZyB0aGF0IHRoZSBlbGVtZW50XG4gKiBpcyB2aXNpYmxlIGFuZCBgZmFsc2VgIGJlaW5nIHRoYXQgaXQgaXMgbm90IHZpc2libGUuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSAgZWxlbSBBIERPTSBlbGVtZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBpc1Zpc2libGUgQSBib29sZWFuIHZhbHVlIHdpdGggYHRydWVgIHJlcHJlc2VudGluZyB0aGF0IHRoZSBlbGVtZW50IGlzIHZpc2libGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzc2Nyb2xsZWRpbnRvdmlldyhlbGVtKSB7XG4gIGNvbnN0IGVsZW1lbnRCb3VuZHMgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4gZWxlbWVudEJvdW5kcy50b3AgPCB3aW5kb3cuaW5uZXJIZWlnaHQgJiYgZWxlbWVudEJvdW5kcy5ib3R0b20gPj0gMDtcbn1cblxuIiwiLyoqXG4gKiBBIGZ1bmN0aW9uIHdoaWNoIG9wZW5zIGEgcG9wdXAgd2luZG93XG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSB1cmwgdGhlIHVybCB0byBvcGVuIGluIHRoZSBwb3B1cFxuICogQHBhcmFtICB7U3RyaW5nfSB3aW5kb3dOYW1lIGEgdW5pcXVlIG5hbWUgZm9yIHRoZSBwb3B1cFxuICogQHBhcmFtICB7SW50ZWdlcn0gdyB0aGUgZGVzaXJlZCB3aWR0aCBvZiB0aGUgcG9wdXBcbiAqIEBwYXJhbSAge0ludGVnZXJ9IGggdGhlIGRlc2lyZWQgaGVpZ2h0IG9mIHRoZSBwb3B1cFxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3QgdGhlIHBvcHVwIGZ1bmN0aW9uIGlzIGJvdW5kIHRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGVucG9wdXAodXJsLCB3aW5kb3dOYW1lLCB3LCBoKSB7XG4gIHJldHVybiB3aW5kb3cub3Blbih1cmwsIHdpbmRvd05hbWUsXG4gICAgJ21lbnViYXI9bm8sc3RhdHVzPW5vLHRvb2xiYXI9bm8sbG9jYXRpb249eWVzLHJlc2l6YWJsZT15ZXMsc2Nyb2xsYmFycz15ZXMsc3RhdHVzPW5vLHdpZHRoPScgKyB3ICsgJyxoZWlnaHQ9JyArIGggKyAnJ1xuICApO1xufVxuIiwiLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBsZW5ndGggYW5kXG4gKiByZXR1cm5zIGEgcmFuZG9tIHN0cmluZ1xuICpcbiAqIEBwYXJhbSAge051bWJlcn0gbGVuZ3RoIG9mIHRoZSByYW5kb20gc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJhbmRvbSBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbXNlY3VyZXN0cmluZyhsZW5ndGgpIHtcbiAgbGV0IHRleHQgPSAnJztcbiAgY29uc3QgcG9zc2libGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODknO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG4gIH1cbiAgcmV0dXJuIHRleHQ7XG59IiwiLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgc2Nyb2xscyB0byBhIHRhcmdldCBvbiBwYWdlXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBldmVudFxuICogQHBhcmFtICB7SFRNTE5vZGV9IGVsZW1lbnRcbiAqIEBwYXJhbSAge0ludGVnZXJ9IG9mZnNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2Nyb2xsdG8oZXZlbnQsIGVsZW1lbnQsIG9mZnNldCA9IDApIHtcbiAgY29uc3QgaGFzaCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdocmVmJykuY2hhckF0KDApID09PSAnIycgPyBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpIDogdW5kZWZpbmVkO1xuXG4gIGlmIChoYXNoICYmIHdpbmRvdy5zY3JvbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0ICR0YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGhhc2gpO1xuICAgIGNvbnN0IHRhcmdldFkgPSAkdGFyZ2V0Lm9mZnNldFRvcCAtIG9mZnNldDtcblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB3aW5kb3cuc2Nyb2xsVG8oe1xuICAgICAgdG9wOiB0YXJnZXRZLFxuICAgICAgYmVoYXZpb3I6ICdzbW9vdGgnXG4gICAgfSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgRVZFTlRTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuLyoqXG4gKiBJRFxuICpcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAaWdub3JlXG4gKi9cbmxldCBpZCA9IDA7XG5cbi8qKlxuICogR2V0IElEXG4gKlxuICogQmVjYXVzZSBmaWxlIGlzIGxvYWRlZCBvbmx5IG9uY2UsIHRoaXMgZnVuY3Rpb25cbiAqIGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGV2ZXJ5IHRpbWVcbiAqIGl0IGlzIGNhbGxlZC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFVuaXF1ZSBJRCB2YWx1ZVxuICogQGlnbm9yZVxuICovXG5mdW5jdGlvbiBnZXRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbi8qKlxuICogQ2xpY2sgU2VydmljZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDbGlja1NlcnZpY2Uge1xuICAvKipcbiAgICogQ2xpY2sgU2VydmljZSBjb25zdHJ1Y3RvciBpbiB3aGljaCB0aGUgYGNhbGxiYWNrc2AgYXJyYXkgaXMgY3JlYXRlZFxuICAgKiBhcyBhIHByb3BlcnR5IG9mIHRoZSBjbGFzcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBBbiBhcnJheSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBjYWxsYmFjayBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCBvbiBDbGlja1xuICAgICAgICpcbiAgICAgICAqIEBwcm9wZXJ0eSB7QXJyYXl9IGNhbGxiYWNrc1xuICAgICAgICovXG4gICAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuXG4gICAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAqIEBkZXNjIEluaXRpYWxpemUgdGhlIHNpbmdsZXRvbiBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB3aW5kb3dcbiAgKiBAbGlzdGVucyB7RXZlbnR9IGxpc3RlbnMgdG8gdGhlIHdpbmRvdyBDbGljayBldmVudFxuICAqL1xuICBpbml0KCkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLkNMSUNLLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgKiBAZGVzYyBUaGUgY2xpY2sgZXZlbnQgaGFuZGxlci4gSXRlcmF0ZXMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgaW52b2tlcyBlYWNoIGNhbGxiYWNrIGluIHRoZSBBcnJheVxuICAqIEBwYXJhbSAge0V2ZW50fSBldmVudCB0aGUgZXZlbnQgb2JqZWN0XG4gICovXG4gIG9uQ2xpY2soZXZlbnQpIHtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrLmlzRWxlbWVudE1hdGNoKSB7XG4gICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IGNhbGxiYWNrLnRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGxiYWNrKGV2ZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGxiYWNrKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBBIGhvb2sgZm9yIHB1c2hpbmcgYSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBpbnRvIHRoZSBgY2FsbGJhY2tzYCBhcnJheS4gQSB1bmlxdWVcbiAgICogSUQgdmFsdWUgZm9yIHRoZSBjYWxsYmFjayBpcyBnZW5lcmF0ZWRcbiAgICogYW5kIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgZm9yIHJlbW92aW5nXG4gICAqIHRoZSBjYWxsYmFjayBpZiBuZWVkIGJlLlxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IEEgcmVmZXJlbmNlIHRvIHRoZSBET00gZWxlbWVudCB0aGF0IHRyaWdnZXJzIHRoZSBldmVudFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGludm9rZSBieSB0aGUgQ2xpY2tTZXJ2aWNlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNFbGVtZW50TWF0Y2ggQSBmbGFnIHVzZWQgdG8gaW52ZXJ0IHRoZSBjb25kaXRpb25hbCBjaGVjayBmb3IgZmlyaW5nIHRoZSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYHJlbW92ZUNhbGxiYWNrYCBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgcmVtb3ZlIGFuIGVudHJ5IGZyb20gdGhlIGBjYWxsYmFja3NgIGFycmF5XG4gICAqL1xuICBhZGRDYWxsYmFjayhlbGVtZW50LCBjYWxsYmFjaywgaXNFbGVtZW50TWF0Y2gpIHtcbiAgICAvLyBHZW5lcmF0ZSBhbiBpZCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgY29uc3QgaWQgPSBnZXRJZCgpO1xuICAgIC8vIG1vZHVsZSBjYW4ndCBiZSB1bmRlZmluZWQgYmVjYXVzZSBpdCdzIGFzIGluIGlkZW50aWZpZXIgZm9yIHRoZSBjYWxsYmFja3MgYXJyYXkuXG4gICAgY29uc3QgbW9kdWxlID0gZWxlbWVudC5kYXRhc2V0ICYmIGVsZW1lbnQuZGF0YXNldC5sb2FkbW9kdWxlID8gZWxlbWVudC5kYXRhc2V0LmxvYWRtb2R1bGUgOiBlbGVtZW50O1xuICAgIGxldCBmbGFnID0gZmFsc2U7XG4gICAgY29uc3QgdGFyZ2V0RWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5jYWxsYmFja3NbaV0ubW9kdWxlID09PSBtb2R1bGUpIHtcbiAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFmbGFnKSB7XG4gICAgICAvLyBQdXNoIGZ1bmN0aW9uIGludG8gYXJyYXkgd2l0aCBhIHVuaXF1ZSBpZFxuICAgICAgdGhpcy5jYWxsYmFja3MucHVzaCh7XG4gICAgICAgIG1vZHVsZSxcbiAgICAgICAgaWQsXG4gICAgICAgIHRhcmdldEVsZW1lbnQsXG4gICAgICAgIGlzRWxlbWVudE1hdGNoLFxuICAgICAgICBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSByZW1vdmUgZnVuY3Rpb25cbiAgICByZXR1cm4gdGhpcy5yZW1vdmVDYWxsYmFjay5iaW5kKHRoaXMsIGlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIHJlbW92ZXNcbiAgICogdGhlIGVudHJ5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGlkIHBhc3NlZFxuICAgKiBpbiBhcyBhbiBhcmd1bWVudFxuICAgKlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIEFuIGlkIHZhbHVlIHRvIGZpbHRlciBieVxuICAgKi9cbiAgcmVtb3ZlQ2FsbGJhY2soaWQpIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0uaWQgIT09IGlkO1xuICAgIH0pO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGRlYm91bmNlIH0gZnJvbSAnLi4vLi4vVXRpbHMnO1xuaW1wb3J0IHsgRVZFTlRTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuLyoqXG4gKiBJRFxuICpcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAaWdub3JlXG4gKi9cbmxldCBpZCA9IDA7XG5cbi8qKlxuICogR2V0IElEXG4gKlxuICogQmVjYXVzZSBmaWxlIGlzIGxvYWRlZCBvbmx5IG9uY2UsIHRoaXMgZnVuY3Rpb25cbiAqIGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGV2ZXJ5IHRpbWVcbiAqIGl0IGlzIGNhbGxlZC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFVuaXF1ZSBJRCB2YWx1ZVxuICogQGlnbm9yZVxuICovXG5mdW5jdGlvbiBnZXRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbi8qKlxuICogUmVzaXplIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVzaXplU2VydmljZSB7XG4gIC8qKlxuICAgKiBSZXNpemVTZXJ2aWNlIGNvbnN0cnVjdG9yIGluIHdoaWNoIHRoZSBgY2FsbGJhY2tzYCBhcnJheSBpcyBjcmVhdGVkXG4gICAqIGFzIGEgcHJvcGVydHkgb2YgdGhlIGNsYXNzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqXG4gICAgICogQW4gYXJyYXkgdG8gYmUgcG9wdWxhdGVkIHdpdGggY2FsbGJhY2sgZnVuY3Rpb25zIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgb24gcmVzaXplXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0FycmF5fSBjYWxsYmFja3NcbiAgICAgKi9cbiAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuXG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgSW5pdGlhbGl6ZSB0aGUgc2luZ2xldG9uIGJ5IGF0dGFjaGluZyB0aGUgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIHdpbmRvd1xuICAgKiBAbGlzdGVucyB7RXZlbnR9IGxpc3RlbnMgdG8gdGhlIHdpbmRvdyByZXNpemUgZXZlbnRcbiAgICovXG4gIGluaXQoKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLlJFU0laRSwgZGVib3VuY2UodGhpcy5vblJlc2l6ZS5iaW5kKHRoaXMpLCAxMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIFRoZSByZXNpemUgZXZlbnQgaGFuZGxlci4gSXRlcnRhdGVzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIGludm9rZXMgZWFjaCBjYWxsYmFjayBpbiB0aGUgQXJyYXlcbiAgICovXG4gIG9uUmVzaXplKCkge1xuICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICBjYWxsYmFjay5jYWxsYmFjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEEgaG9vayBmb3IgcHVzaGluZyBhIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIGludG8gdGhlIGBjYWxsYmFja3NgIGFycmF5LiBBIHVuaXF1ZVxuICAgKiBJRCB2YWx1ZSBmb3IgdGhlIGNhbGxiYWNrIGlzIGdlbmVyYXRlZFxuICAgKiBhbmQgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBmb3IgcmVtb3ZpbmdcbiAgICogdGhlIGNhbGxiYWNrIGlmIG5lZWQgYmUuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gaW52b2tlIGJ5IHRoZSBSZXNpemVTZXJ2aWNlXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBgcmVtb3ZlQ2FsbGJhY2tgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCByZW1vdmUgYW4gZW50cnkgZnJvbSB0aGUgYGNhbGxiYWNrc2AgYXJyYXlcbiAgICovXG4gIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgLy8gR2VuZXJhdGUgYW4gaWQgZm9yIHRoZSBjYWxsYmFja1xuICAgIGNvbnN0IGlkID0gZ2V0SWQoKTtcblxuICAgIC8vIFB1c2ggZnVuY3Rpb24gaW50byBhcnJheSB3aXRoIGEgdW5pcXVlIGlkXG4gICAgdGhpcy5jYWxsYmFja3MucHVzaCh7XG4gICAgICBpZCxcbiAgICAgIGNhbGxiYWNrXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIHJlbW92ZSBmdW5jdGlvblxuICAgIHJldHVybiB0aGlzLnJlbW92ZUNhbGxiYWNrLmJpbmQodGhpcywgaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlcnMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgcmVtb3Zlc1xuICAgKiB0aGUgZW50cnkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaWQgcGFzc2VkXG4gICAqIGluIGFzIGFuIGFyZ3VtZW50XG4gICAqXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgQW4gaWQgdmFsdWUgdG8gZmlsdGVyIGJ5XG4gICAqL1xuICByZW1vdmVDYWxsYmFjayhpZCkge1xuICAgIHRoaXMuY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3MuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS5pZCAhPT0gaWQ7XG4gICAgfSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZGVib3VuY2UgfSBmcm9tICcuLi8uLi9VdGlscyc7XG5pbXBvcnQgeyBFVkVOVFMgfSBmcm9tICcuLi8uLi9Db25zdGFudHMnO1xuXG4vKipcbiAqIElEXG4gKlxuICogQHR5cGUge051bWJlcn1cbiAqIEBpZ25vcmVcbiAqL1xubGV0IGlkID0gMDtcblxuLyoqXG4gKiBHZXQgSURcbiAqXG4gKiBCZWNhdXNlIGZpbGUgaXMgbG9hZGVkIG9ubHkgb25jZSwgdGhpcyBmdW5jdGlvblxuICogY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZXZlcnkgdGltZVxuICogaXQgaXMgY2FsbGVkLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVW5pcXVlIElEIHZhbHVlXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIGdldElkKCkge1xuICByZXR1cm4gaWQrKztcbn1cblxuLyoqXG4gKiBTY3JvbGwgU2VydmljZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY3JvbGxTZXJ2aWNlIHtcbiAgLyoqXG4gICAqIFNjcm9sbCBTZXJ2aWNlIGNvbnN0cnVjdG9yIGluIHdoaWNoIHRoZSBgY2FsbGJhY2tzYCBhcnJheSBpcyBjcmVhdGVkXG4gICAqIGFzIGEgcHJvcGVydHkgb2YgdGhlIGNsYXNzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqXG4gICAgICogQW4gYXJyYXkgdG8gYmUgcG9wdWxhdGVkIHdpdGggY2FsbGJhY2sgZnVuY3Rpb25zIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgb24gc2Nyb2xsXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0FycmF5fSBjYWxsYmFja3NcbiAgICAgKi9cbiAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHVzZXIgYmFzZWQgb24gc2Nyb2xsLCB2ZXJ0aWNhbGx5XG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gcG9zaXRpb25cbiAgICAgKi9cbiAgICB0aGlzLnNjcm9sbFkgPSAwO1xuXG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgSW5pdGlhbGl6ZSB0aGUgc2luZ2xldG9uIGJ5IGF0dGFjaGluZyB0aGUgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIHdpbmRvd1xuICAgKiBAbGlzdGVucyB7RXZlbnR9IGxpc3RlbnMgdG8gdGhlIHdpbmRvdyBzY3JvbGwgZXZlbnRcbiAgICovXG4gIGluaXQoKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLlNDUk9MTCwgZGVib3VuY2UodGhpcy5vblNjcm9sbC5iaW5kKHRoaXMpLCAxMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIFRoZSBzY3JvbGwgZXZlbnQgaGFuZGxlci4gSXRlcmF0ZXMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgaW52b2tlcyBlYWNoIGNhbGxiYWNrIGluIHRoZSBBcnJheVxuICAgKi9cbiAgb25TY3JvbGwoKSB7XG4gICAgdGhpcy5zY3JvbGxZID0gd2luZG93LnNjcm9sbFk7XG4gICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcbiAgICAgIGNhbGxiYWNrLmNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgQSBob29rIGZvciBwdXNoaW5nIGEgY2FsbGJhY2sgZnVuY3Rpb24gaW50byB0aGUgYGNhbGxiYWNrc2AgYXJyYXkuIEEgdW5pcXVlXG4gICAqIElEIHZhbHVlIGZvciB0aGUgY2FsbGJhY2sgaXMgZ2VuZXJhdGVkIGFuZCBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGZvciByZW1vdmluZ1xuICAgKiB0aGUgY2FsbGJhY2sgaWYgbmVlZCBiZS5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBpbnZva2UgYnkgdGhlIFNjcm9sbFNlcnZpY2VcbiAgICogQHJldHVybiB7RnVuY3Rpb259IGByZW1vdmVDYWxsYmFja2AgQSBmdW5jdGlvbiB3aGljaCB3aWxsIHJlbW92ZSBhbiBlbnRyeSBmcm9tIHRoZSBgY2FsbGJhY2tzYCBhcnJheVxuICAgKi9cbiAgYWRkQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAvLyBHZW5lcmF0ZSBhbiBpZCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgY29uc3QgaWQgPSBnZXRJZCgpO1xuXG4gICAgLy8gUHVzaCBmdW5jdGlvbiBpbnRvIGFycmF5IHdpdGggYSB1bmlxdWUgaWRcbiAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKHtcbiAgICAgIGlkLFxuICAgICAgY2FsbGJhY2tcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiB0aGUgcmVtb3ZlIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2FsbGJhY2suYmluZCh0aGlzLCBpZCk7XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVycyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCByZW1vdmVzXG4gICAqIHRoZSBlbnRyeSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpZCBwYXNzZWRcbiAgICogaW4gYXMgYW4gYXJndW1lbnRcbiAgICpcbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBBbiBpZCB2YWx1ZSB0byBmaWx0ZXIgYnlcbiAgICovXG4gIHJlbW92ZUNhbGxiYWNrKGlkKSB7XG4gICAgdGhpcy5jYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrcy5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgIHJldHVybiBpdGVtLmlkICE9PSBpZDtcbiAgICB9KTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBJbXBvcnQgc2VydmljZXNcbmltcG9ydCBDbGlja1NlcnZpY2UgZnJvbSAnLi9DbGlja1NlcnZpY2UnO1xuaW1wb3J0IFJlc2l6ZVNlcnZpY2UgZnJvbSAnLi9SZXNpemVTZXJ2aWNlJztcbmltcG9ydCBTY3JvbGxTZXJ2aWNlIGZyb20gJy4vU2Nyb2xsU2VydmljZSc7XG5cbi8qKlxuICogQSBzaW5nbGV0b24gd2hvc2UgcHJvcGVydGllcyBhcmUgaW5kaXZpZHVhbCBzZXJ2aWNlcy5cbiAqXG4gKiBBbnkgc2VydmljZSBzaW5nbGV0b24gc2VydmljZSB0aGF0IG5lZWRzIHRvIGJlIGluc3RhbnRpYXRlZFxuICogc2hvdWxkIGJlIGRvbmUgc28gaW4gdGhlIFNlcnZpY2VzIGNsYXNzLlxuICpcbiAqIFNlcnZpY2VzIHNob3VsZCBub3QgaW50ZXJhY3Qgd2l0aCB0aGUgRE9NLCB0aGF0IHNob3VsZCBiZVxuICogbGVmdCB0byB0aGUgVmlld3MuIFNlcnZpY2VzIGNhbiBzaW1wbHkgYmUgdXNlZCB0byBjb25zb2xpZGF0ZVxuICogYW4gZXhwZW5zaXZlIGV2ZW50IGxpc3RlbmVyICgnc2Nyb2xsJywgJ3Jlc2l6ZScsIGV0YykuIG9yXG4gKiB0cmFjayBzdGF0ZSAobGlrZSB3aGljaCBtb2RhbCBpcyBvcGVuIGF0IHdoaWNoIHRpbWUpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2aWNlcyB7XG4gIC8qKlxuICAgKiBTZXJ2aWNlcyBjb25zdHJ1Y3RvciB0aGF0IGluc3RhbnRpYXRlcyBlYWNoIHNlcnZpY2UgaW5kaXZpZHVhbGx5LlxuICAgKiBUbyBhZGQgYW5vdGhlciBzZXJ2aWNlcyBpbnN0aWF0ZSBpdCBoZXJlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqXG4gICAgICogQSBzZXJ2aWNlIHdoaWNoIGxpc3RlbnMgdG8gdGhlIGB3aW5kb3dgIGNsaWNrIGV2ZW50IGFuZFxuICAgICAqIGludm9rZXMgYW4gYXJyYXkgb2YgY2FsbGJhY2tzXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gQ2xpY2tTZXJ2aWNlIEEgc2luZ2xldG9uIGluc3RhbmNlIG9mIHRoZSBDbGlja1NlcnZpY2UgY2xhc3NcbiAgICAgKi9cbiAgICB0aGlzLkNsaWNrU2VydmljZSA9IG5ldyBDbGlja1NlcnZpY2UoKTtcblxuICAgIC8qKlxuICAgICAqIEEgc2VydmljZSB3aGljaCBsaXN0ZW5zIHRvIHRoZSBgd2luZG93YCByZXNpemUgZXZlbnQgYW5kXG4gICAgICogaW52b2tlcyBhbiBhcnJheSBvZiBjYWxsYmFja3NcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBSZXNpemVTZXJ2aWNlIEEgc2luZ2xldG9uIGluc3RhbmNlIG9mIHRoZSBSZXNpemVTZXJ2aWNlIGNsYXNzXG4gICAgICovXG4gICAgdGhpcy5SZXNpemVTZXJ2aWNlID0gbmV3IFJlc2l6ZVNlcnZpY2UoKTtcblxuICAgIC8qKlxuICAgICAqIEEgc2VydmljZSB3aGljaCBsaXN0ZW5zIHRvIHRoZSBgd2luZG93YCBzY3JvbGwgZXZlbnQgYW5kXG4gICAgICogaW52b2tlcyBhbiBhcnJheSBvZiBjYWxsYmFja3NcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBTY3JvbGxTZXJ2aWNlIEEgc2luZ2xldG9uIGluc3RhbmNlIG9mIHRoZSBTY3JvbGxTZXJ2aWNlIGNsYXNzXG4gICAgICovXG4gICAgdGhpcy5TY3JvbGxTZXJ2aWNlID0gbmV3IFNjcm9sbFNlcnZpY2UoKTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBFVkVOVFMgfSBmcm9tICcuLi8uLi9Db25zdGFudHMnO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCBzaG93cyB0aGUgZmlyc3QgZmlsZSB1cGxvYWRlZCB0byBmaWxlIGZpZWxkIG9uIG1hdGNoaW5nIGxhYmVsXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGUge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIEZpbGVcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFJFUVVJUkVEIC0gdGhlIG1vZHVsZSdzIGNvbnRhaW5lclxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIC8qKlxuICAgICAqIERPTSBub2RlIHRoYXQgaXMgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gZWxlbWVudCBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSB2aWV3XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHZpZXcgYnkgY2FsbGluZyB0aGUgZnVuY3Rpb25zIHRvXG4gICAqIGNyZWF0ZSBET00gcmVmZXJlbmNlcywgc2V0dXAgZXZlbnQgaGFuZGxlcnMgYW5kXG4gICAqIHRoZW4gY3JlYXRlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBIZWFkZXIgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGluaXQoKSB7XG4gICAgdGhpcy5jYWNoZURvbVJlZmVyZW5jZXMoKVxuICAgICAgLnNldHVwSGFuZGxlcnMoKVxuICAgICAgLmVuYWJsZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2FjaGUgRE9NIFJlZmVyZW5jZXNcbiAgICpcbiAgICogRmluZCBhbGwgbmVjZXNzYXJ5IERPTSBlbGVtZW50cyB1c2VkIGluIHRoZSB2aWV3IGFuZCBjYWNoZSB0aGVtXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gSGVhZGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjYWNoZURvbVJlZmVyZW5jZXMoKSB7XG4gICAgdGhpcy5maWxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5lbGVtZW50LmdldEF0dHJpYnV0ZSgnZm9yJykpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQmluZCBldmVudCBoYW5kbGVycyB3aXRoIHRoZSBwcm9wZXIgY29udGV4dCBvZiBgdGhpc2AuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gTmF2IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXR1cEhhbmRsZXJzKCkge1xuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgc2Nyb2xsVG9gIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlclxuICAgICAqIGNvbnRleHQgYm91bmQgdG8gdGhlIFNWR1Njcm9sbEFuaW1hdGlvbnMgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHRoaXMub25DaGFuZ2VIYW5kbGVyID0gdGhpcy5vbkNoYW5nZS5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGV2ZW50IGhhbmRsZXJzIHRvIGVuYWJsZSBpbnRlcmFjdGlvbiB3aXRoIHZpZXdcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBOYXYgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGVuYWJsZSgpIHtcbiAgICB0aGlzLmZpbGUuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuQ0hBTkdFLCB0aGlzLm9uQ2hhbmdlSGFuZGxlcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2luZyBmaWxlIHVwbG9hZGVkIHdpbGwgcmVwbGFjZSB0aGUgbmFtZVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25DaGFuZ2UoZXZlbnQpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhbmdlZCcpO1xuXG4gICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuZmlsZS5maWxlcy5sZW5ndGggPiAwID8gdGhpcy5maWxlLmZpbGVzWzBdLm5hbWUgOiAnQW55IEF0dGFjaG1lbnQ/JztcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGlzc2Nyb2xsZWRpbnRvdmlldyB9IGZyb20gJy4uLy4uL1V0aWxzJztcbmltcG9ydCB7IENMQVNTX05BTUVTLCBFVkVOVFMsIE1JU0MsIFNFTEVDVE9SUyB9IGZyb20gJ0NvbnN0YW50cyc7XG5cbi8qKlxuICogSW4gVmlld3BvcnRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5WaWV3cG9ydCB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgaW52aWV3cG9ydCB3aGljaCBzaW1wbHkgYXNzaWducyB0aGUgU2Nyb2xsU2VydmljZVxuICAgKiB0byBhIHByb3BlcnR5IG9uIHRoZSBjb250cnVjdG9yIGZvciByZWZlcmVuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTZXJ2aWNlcyB2YXJpb3VzIHNlcnZpY2VzLCBwYXNzZWQgaW4gYXMgcGFyYW1cbiAgICovXG4gIGNvbnN0cnVjdG9yKFNlcnZpY2VzKSB7XG4gICAgLyoqXG4gICAgICogUmVmZXJlbmNlIHRvIHRoZSBTY3JvbGxTZXJ2aWNlIHNpbmdsZXRvblxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMuU2Nyb2xsU2VydmljZSA9IFNlcnZpY2VzLlNjcm9sbFNlcnZpY2U7XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSB2aWV3XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHZpZXcgYnkgY2FsbGluZyB0aGUgZnVuY3Rpb25zIHRvXG4gICAqIGNyZWF0ZSBET00gcmVmZXJlbmNlcywgc2V0dXAgZXZlbnQgaGFuZGxlcnMgYW5kXG4gICAqIHRoZW4gY3JlYXRlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGluaXQoKSB7XG4gICAgdGhpcy5jYWNoZURvbVJlZmVyZW5jZXMoKVxuICAgICAgLnNldHVwSGFuZGxlcnMoKVxuICAgICAgLmVuYWJsZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbGwgbmVjZXNzYXJ5IERPTSBlbGVtZW50cyB1c2VkIGluIHRoZSB2aWV3IGFuZCBjYWNoZSB0aGVtXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjYWNoZURvbVJlZmVyZW5jZXMoKSB7XG4gICAgLyoqXG4gICAgICogQWxsIERPTSBlbGVtZW50cyB3aXRoIHRoZSBgZGF0YS12aXNpYmxlYCBhdHRyaWJ1dGVcbiAgICAgKiBAcHJvcGVydHkge05vZGVMaXN0fVxuICAgICAqL1xuICAgIHRoaXMubW9kdWxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1JTLkRBVEFfVklTSUJMRSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhlIHByb3BlciBjb250ZXh0IG9mIGB0aGlzYC5cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHNldHVwSGFuZGxlcnMoKSB7XG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGBvblNjcm9sbGAgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyXG4gICAgICogY29udGV4dCBib3VuZCB0byB0aGUgSW5WaWV3cG9ydCBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgdGhpcy5vblNjcm9sbEhhbmRsZXIgPSB0aGlzLm9uU2Nyb2xsLmJpbmQodGhpcyk7XG5cbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYHVwZGF0ZU1vZHVsZXNgIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlclxuICAgICAqIGNvbnRleHQgYm91bmQgdG8gdGhlIEluVmlld3BvcnQgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHRoaXMub25Nb2R1bGVVcGRhdGVIYW5kbGVyID0gdGhpcy51cGRhdGVNb2R1bGVzLmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgZXZlbnQgaGFuZGxlcnMgdG8gZW5hYmxlIGludGVyYWN0aW9uIHdpdGggdmlld1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW5hYmxlKCkge1xuICAgIC8vIENhbGwgc2Nyb2xsIGhhbmRsZXIgb24gbG9hZCB0byBnZXQgaW5pdGlhbCB2aWV3YWJsZSBlbGVtZW50c1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KHRoaXMub25TY3JvbGxIYW5kbGVyLCAzMDApO1xuXG4gICAgLy8gQWRkIHRvIFNjcm9sbFNlcml2ZSBjYWxsYmFja3NcbiAgICB0aGlzLlNjcm9sbFNlcnZpY2UuYWRkQ2FsbGJhY2sodGhpcy5vblNjcm9sbEhhbmRsZXIpO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5VUERBVEVfSU5fVklFV1BPUlRfTU9EVUxFUywgdGhpcy5vbk1vZHVsZVVwZGF0ZUhhbmRsZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCBsb29wcyBvdmVyIHRoZSBjdXJyZW50IG1vZHVsZXMgYW5kIGRldGVybWluZXNcbiAgICogd2hpY2ggYXJlIGN1cnJlbnRseSBpbiB0aGUgdmlld3BvcnQuIERlcGVuZGluZyBvbiB3aGV0aGVyIG9yXG4gICAqIG5vdCB0aGV5IGFyZSB2aXNpYmxlIGEgZGF0YSBhdHRyaWJ1dGUgYm9vbGVhbiBpcyB0b2dnbGVkXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvblNjcm9sbCgpIHtcbiAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRoaXMubW9kdWxlcywgKG1vZHVsZSkgPT4ge1xuICAgICAgaWYgKGlzc2Nyb2xsZWRpbnRvdmlldyhtb2R1bGUpKSB7XG4gICAgICAgIGlmIChtb2R1bGUuZ2V0QXR0cmlidXRlKE1JU0MuREFUQV9WSVNJQkxFKSA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoTUlTQy5EQVRBX1ZJU0lCTEUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbW9kdWxlLmhhc0F0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9IQVNfQU5JTUFURUQpICYmIG1vZHVsZS5nZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfQk9UVE9NKSA9PT0gJ2Fib3ZlLWJvdHRvbScpIHtcbiAgICAgICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX0hBU19BTklNQVRFRCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtb2R1bGUuZ2V0QXR0cmlidXRlKE1JU0MuREFUQV9WSVNJQkxFKSA9PT0gJ3RydWUnKSB7XG4gICAgICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShNSVNDLkRBVEFfVklTSUJMRSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCByZWN0ID0gbW9kdWxlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgY3VycmVudERhdGFQb3NpdGlvbiA9IG1vZHVsZS5nZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfUE9TSVRJT04pO1xuICAgICAgY29uc3QgY2FsY3VsYXRlZERhdGFQb3NpdGlvbiA9IHJlY3QuYm90dG9tIDwgMCA/IENMQVNTX05BTUVTLkFCT1ZFX1ZJRVdQT1JUIDogcmVjdC50b3AgPj0gd2luZG93LmlubmVySGVpZ2h0ID8gQ0xBU1NfTkFNRVMuQkVMT1dfVklFV1BPUlQgOiBDTEFTU19OQU1FUy5JTl9WSUVXUE9SVDtcbiAgICAgIGNvbnN0IGNhbGN1bGF0ZWRCb3R0b21Qb3NpdGlvbiA9IHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0ID8gQ0xBU1NfTkFNRVMuQkVMT1dfQk9UVE9NIDogQ0xBU1NfTkFNRVMuQUJPVkVfQk9UVE9NO1xuICAgICAgY29uc3QgaGFsZndheVBvc2l0aW9uID0gcmVjdC5ib3R0b20gPD0gKHdpbmRvdy5pbm5lckhlaWdodCAvIDEuMjUpID8gQ0xBU1NfTkFNRVMuQUJPVkVfSEFMRldBWSA6IENMQVNTX05BTUVTLkJFTE9XX0hBTEZXQVk7XG4gICAgICBpZiAoY3VycmVudERhdGFQb3NpdGlvbiAhPT0gY2FsY3VsYXRlZERhdGFQb3NpdGlvbikge1xuICAgICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX1BPU0lUSU9OLCBjYWxjdWxhdGVkRGF0YVBvc2l0aW9uKTtcbiAgICAgIH1cbiAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfQk9UVE9NLCBjYWxjdWxhdGVkQm90dG9tUG9zaXRpb24pO1xuICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9IQUxGV0FZLCBoYWxmd2F5UG9zaXRpb24pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCB1cGRhdGVzIHRoZSBsaXN0IG9mIGRhdGEtdmlzaWJsZSBtb2R1bGVzIGJ5IGNhbGxpbmcgYGNhY2hlRG9tUmVmZXJlbmNlc2AgYW5kIGNhbGxzIGBvblNjcm9sbGBcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHVwZGF0ZU1vZHVsZXMoKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ3Njcm9sbCcpO1xuICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKCkub25TY3JvbGwoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFSSUEsIFNFTEVDVE9SUywgQ0xBU1NfTkFNRVMsIEVWRU5UUywgS0VZX0NPREVTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuXG4vKipcbiAqIEEgY2xhc3Mgd2hpY2ggaGlkZXMgYW5kIHJldmVhbHMgaGlkZGVuIG1lbnUgY29udGVudCBiYXNlZCBvbiB1c2VyIGNsaWNrIG9mIGEgYnV0dG9uLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOYXYge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIE5hdiB3aGljaCBzaW1wbHkgYXNzaWducyB0aGUgU2Nyb2xsU2VydmljZVxuICAgKiB0byBhIHByb3BlcnR5IG9uIHRoZSBjb250cnVjdG9yIGZvciByZWZlcmVuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBSRVFVSVJFRCAtIHRoZSBtb2R1bGUncyBjb250YWluZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IFNlcnZpY2VzIHZhcmlvdXMgc2VydmljZXMsIHBhc3NlZCBpbiBhcyBwYXJhbVxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgU2VydmljZXMgKSB7XG4gICAgLyoqXG4gICAgICogRE9NIG5vZGUgdGhhdCBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBlbGVtZW50IERPTSBub2RlIHRoYXQgaXMgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgdmlld1xuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB2aWV3IGJ5IGNhbGxpbmcgdGhlIGZ1bmN0aW9ucyB0b1xuICAgKiBjcmVhdGUgRE9NIHJlZmVyZW5jZXMsIHNldHVwIGV2ZW50IGhhbmRsZXJzIGFuZFxuICAgKiB0aGVuIGNyZWF0ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gSGVhZGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBpbml0KCkge1xuICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKClcbiAgICAgIC5zZXR1cEhhbmRsZXJzKClcbiAgICAgIC5lbmFibGUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENhY2hlIERPTSBSZWZlcmVuY2VzXG4gICAqXG4gICAqIEZpbmQgYWxsIG5lY2Vzc2FyeSBET00gZWxlbWVudHMgdXNlZCBpbiB0aGUgdmlldyBhbmQgY2FjaGUgdGhlbVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY2FjaGVEb21SZWZlcmVuY2VzKCkge1xuICAgIHRoaXMubmF2VHJpZ2dlciA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKFNFTEVDVE9SUy5OQVZfVFJJR0dFUik7XG4gICAgdGhpcy5zaXRlTmF2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihTRUxFQ1RPUlMuU0lURV9OQVYpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQmluZCBldmVudCBoYW5kbGVycyB3aXRoIHRoZSBwcm9wZXIgY29udGV4dCBvZiBgdGhpc2AuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gTmF2IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXR1cEhhbmRsZXJzKCkge1xuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgb25DbGlja2AgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyXG4gICAgICogY29udGV4dCBib3VuZCB0byB0aGUgU1ZHU2Nyb2xsQW5pbWF0aW9ucyBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgdGhpcy5vbkNsaWNrSGFuZGxlciA9IHRoaXMub25DbGljay5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGV2ZW50IGhhbmRsZXJzIHRvIGVuYWJsZSBpbnRlcmFjdGlvbiB3aXRoIHZpZXdcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBOYXYgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGVuYWJsZSgpIHtcbiAgICAvLyBoYW5kbGUgbmF2IHRyaWdnZXIgY2xpY2tcbiAgICB0aGlzLm5hdlRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuQ0xJQ0ssIHRoaXMub25DbGlja0hhbmRsZXIpO1xuICAgIHRoaXMubmF2VHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5LRVlfRE9XTiwgdGhpcy5vbkNsaWNrSGFuZGxlcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxpbmcgYmV5b25kIHRoZSBoZWlnaHQgb2YgdGhlIG5hdiB3aWxsIHRyaWdnZXIgYSBjbGFzcyBjaGFuZ2VcbiAgICogYW5kIHZpY2UgdmVyc2EuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvbkNsaWNrKCkge1xuICAgIGNvbnN0IGlzT3BlbiA9IHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5oZWFkZXJPcGVuID0gIWlzT3BlbjtcbiAgICBpZiAoZXZlbnQudHlwZSA9PT0gRVZFTlRTLktFWV9ET1dOICYmIChcbiAgICAgIGV2ZW50LnRhcmdldC5ub2RlTmFtZS5tYXRjaCgvYXxpbnB1dHx0ZXh0YXJlYXxzZWxlY3R8YnV0dG9uL2kpIHx8XG4gICAgICAoaXNPcGVuICYmIGV2ZW50LmtleUNvZGUgIT09IEtFWV9DT0RFUy5FU0NBUEUgJiYgKGV2ZW50LmtleUNvZGUgIT09IEtFWV9DT0RFUy5TUEFDRUJBUiB8fCBldmVudC5jdXJyZW50VGFyZ2V0ID09PSB3aW5kb3cpKSB8fFxuICAgICAgKCFpc09wZW4gJiYgZXZlbnQua2V5Q29kZSAhPT0gS0VZX0NPREVTLlNQQUNFQkFSKVxuICAgICkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LnR5cGUgPT09IEVWRU5UUy5LRVlfRE9XTiAmJiBldmVudC5rZXlDb2RlID09PSBLRVlfQ09ERVMuU1BBQ0VCQVIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShDTEFTU19OQU1FUy5PUEVOKTtcbiAgICB0aGlzLm5hdlRyaWdnZXIuY2xhc3NMaXN0LnRvZ2dsZShDTEFTU19OQU1FUy5PUEVOKTtcbiAgICB0aGlzLnNpdGVOYXYuY2xhc3NMaXN0LnRvZ2dsZShDTEFTU19OQU1FUy5PUEVOKTtcbiAgICB0aGlzLm5hdlRyaWdnZXIuc2V0QXR0cmlidXRlKEFSSUEuRVhQQU5ERUQsIGlzT3Blbik7XG4gICAgdGhpcy5zaXRlTmF2LnNldEF0dHJpYnV0ZShBUklBLkhJRERFTiwgaXNPcGVuKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTkVEKTtcbiAgfVxuXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFSSUEsIFNFTEVDVE9SUywgQ0xBU1NfTkFNRVMsIEVWRU5UUywgS0VZX0NPREVTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcbmltcG9ydCB7IGdldGNvb2tpZSB9IGZyb20gJy4uLy4uL1V0aWxzJztcblxuXG4vKipcbiAqIEEgY2xhc3Mgd2hpY2ggaGlkZXMgYW5kIHJldmVhbHMgaGlkZGVuIG1lbnUgY29udGVudCBiYXNlZCBvbiB1c2VyIGNsaWNrIG9mIGEgYnV0dG9uLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWaWRlbyB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgVmlkZW8gd2hpY2ggc2ltcGx5IGFzc2lnbnMgdGhlIFNjcm9sbFNlcnZpY2VcbiAgICogdG8gYSBwcm9wZXJ0eSBvbiB0aGUgY29udHJ1Y3RvciBmb3IgcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gUkVRVUlSRUQgLSB0aGUgbW9kdWxlJ3MgY29udGFpbmVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTZXJ2aWNlcyB2YXJpb3VzIHNlcnZpY2VzLCBwYXNzZWQgaW4gYXMgcGFyYW1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIFNlcnZpY2VzICkge1xuICAgIC8qKlxuICAgICAqIERPTSBub2RlIHRoYXQgaXMgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gZWxlbWVudCBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cblxuICAgIC8vIEluaXRpYWxpemUgdGhlIHZpZXdcbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdmlldyBieSBjYWxsaW5nIHRoZSBmdW5jdGlvbnMgdG9cbiAgICogY3JlYXRlIERPTSByZWZlcmVuY2VzLCBzZXR1cCBldmVudCBoYW5kbGVycyBhbmRcbiAgICogdGhlbiBjcmVhdGUgdGhlIGV2ZW50IGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgaW5pdCgpIHtcbiAgICBjb25zb2xlLmxvZyhnZXRjb29raWUoJ3ZpZGVvJykpXG4gICAgaWYoZ2V0Y29va2llKCd2aWRlbycpICE9PSAndHJ1ZScpIHtcbiAgICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKClcbiAgICAgICAgLnNldHVwSGFuZGxlcnMoKVxuICAgICAgICAuZW5hYmxlKCk7XG5cbiAgICAgICAgXG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3ZpZGVvLW9wZW4nKTtcbiAgICAgIGRvY3VtZW50LmNvb2tpZSA9ICd2aWRlbz10cnVlOyc7XG4gICAgICB0aGlzLmNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmYWRlJyk7XG4gICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2FjaGUgRE9NIFJlZmVyZW5jZXNcbiAgICpcbiAgICogRmluZCBhbGwgbmVjZXNzYXJ5IERPTSBlbGVtZW50cyB1c2VkIGluIHRoZSB2aWV3IGFuZCBjYWNoZSB0aGVtXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gSGVhZGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjYWNoZURvbVJlZmVyZW5jZXMoKSB7XG4gICAgdGhpcy5jb250ZW50ID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy52aWRlb19fY29udGVudCcpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQmluZCBldmVudCBoYW5kbGVycyB3aXRoIHRoZSBwcm9wZXIgY29udGV4dCBvZiBgdGhpc2AuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gVmlkZW8gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHNldHVwSGFuZGxlcnMoKSB7XG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGBvbkNsaWNrYCBmdW5jdGlvbiB3aXRoIHRoZSBwcm9wZXJcbiAgICAgKiBjb250ZXh0IGJvdW5kXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHRoaXMub25DbGlja0hhbmRsZXIgPSB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBldmVudCBoYW5kbGVycyB0byBlbmFibGUgaW50ZXJhY3Rpb24gd2l0aCB2aWV3XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gVmlkZW8gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGVuYWJsZSgpIHtcbiAgICAvLyBoYW5kbGUgVmlkZW8gdHJpZ2dlciBjbGlja1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5DTElDSywgdGhpcy5vbkNsaWNrSGFuZGxlcik7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLktFWV9ET1dOLCB0aGlzLm9uQ2xpY2tIYW5kbGVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsaWNraW5nIHRoZSBjb250ZW50IHdpbGwgY2F1c2UgaXQgdG8gYmUgcmVtb3ZlZCBmcm9tIHNpZ2h0XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvbkNsaWNrKCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ZhZGUnKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ3ZpZGVvLW9wZW4nKTtcbiAgfVxufVxuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG4ndXNlIHN0cmljdCc7XG5cbi8vIEZvdW5kYXRpb24gQ29yZVxuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24uY29yZS5qcyc7XG4vLyBGb3VuZGF0aW9uIFV0aWxpdGllc1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5ib3guanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5rZXlib2FyZC5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5uZXN0LmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnMuanMnO1xuLy8gRm91bmRhdGlvbiBQbHVnaW5zLiBBZGQgb3IgcmVtb3ZlIGFzIG5lZWRlZCBmb3IgeW91ciBzaXRlXG4vLyBpbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi5kcmlsbGRvd24uanMnO1xuLy8gaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzJztcbi8vIGltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51LmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyc7XG5cbmltcG9ydCBqcXVlcnkgZnJvbSAnanF1ZXJ5Jztcbi8vIGltcG9ydCBwcmVwSW5wdXRzIGZyb20gJ21vZHVsZXMvcHJlcGlucHV0cy5qcyc7XG5pbXBvcnQgc29jaWFsU2hhcmUgZnJvbSAnbW9kdWxlcy9zb2NpYWxTaGFyZS5qcyc7XG4vLyBpbXBvcnQgY2Fyb3VzZWwgZnJvbSAnbW9kdWxlcy9jYXJvdXNlbC5qcyc7XG5cbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAnO1xuXG4oZnVuY3Rpb24oJCkge1xuICAvLyBJbml0aWFsaXplIEZvdW5kYXRpb25cbiAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xuXG4gIC8vIFByZXBhcmUgZm9ybSBpbnB1dHNcbiAgLy8gcHJlcElucHV0cygpO1xuICAvLyBJbml0aWFsaXplIHNvY2lhbCBzaGFyZSBmdW5jdGlvbmFsaXR5XG4gIC8vIFJlcGxhY2UgdGhlIGVtcHR5IHN0cmluZyBwYXJhbWV0ZXIgd2l0aCB5b3VyIEZhY2Vib29rIElEXG4gIHNvY2lhbFNoYXJlKCcnKTtcblxuICAvLyBBdHRhY2ggQXBwIHRvIHRoZSB3aW5kb3dcbiAgd2luZG93LkFwcCA9IG5ldyBBcHAoKTtcbn0pKGpxdWVyeSk7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcblxuY29uc3Qgc29jaWFsU2hhcmUgPSBmdW5jdGlvbihmYklkKSB7XG4gIGNvbnN0ICRib2R5ID0gJCgnYm9keScpO1xuXG4gIC8vIEZhY2Vib29rIHNoYXJpbmcgd2l0aCB0aGUgU0RLXG4gICQuZ2V0U2NyaXB0KCcvL2Nvbm5lY3QuZmFjZWJvb2submV0L2VuX1VTL3Nkay5qcycpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgJGJvZHkub24oJ2NsaWNrLnNoYXJlci1mYicsICcuc2hhcmVyLWZiJywgZnVuY3Rpb24oZSkge1xuICAgICAgY29uc3QgJGxpbmsgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBtZXRob2Q6ICdmZWVkJyxcbiAgICAgICAgZGlzcGxheTogJ3BvcHVwJyxcbiAgICAgIH07XG4gICAgICBjb25zdCBuZXdVcmwgPSAkbGluay5kYXRhKCdyZWRpcmVjdC10bycpID9cbiAgICAgICAgICAkbGluay5kYXRhKCdyZWRpcmVjdC10bycpIDogbnVsbDtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB3aW5kb3cuRkIuaW5pdCh7XG4gICAgICAgIGFwcElkOiBmYklkLFxuICAgICAgICB4ZmJtbDogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICd2Mi4wJyxcbiAgICAgICAgc3RhdHVzOiBmYWxzZSxcbiAgICAgICAgY29va2llOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCd0aXRsZScpKSB7XG4gICAgICAgIG9wdGlvbnMubmFtZSA9ICRsaW5rLmRhdGEoJ3RpdGxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCd1cmwnKSkge1xuICAgICAgICBvcHRpb25zLmxpbmsgPSAkbGluay5kYXRhKCd1cmwnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRsaW5rLmRhdGEoJ3BpY3R1cmUnKSkge1xuICAgICAgICBvcHRpb25zLnBpY3R1cmUgPSAkbGluay5kYXRhKCdwaWN0dXJlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpKSB7XG4gICAgICAgIG9wdGlvbnMuZGVzY3JpcHRpb24gPSAkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cuRkIudWkob3B0aW9ucywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKG5ld1VybCkge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gVHdpdHRlciBzaGFyaW5nXG4gICRib2R5Lm9uKCdjbGljay5zaGFyZXItdHcnLCAnLnNoYXJlci10dycsIGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCAkbGluayA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICBjb25zdCB1cmwgPSAkbGluay5kYXRhKCd1cmwnKTtcbiAgICBjb25zdCB0ZXh0ID0gJGxpbmsuZGF0YSgnZGVzY3JpcHRpb24nKTtcbiAgICBjb25zdCB2aWEgPSAkbGluay5kYXRhKCdzb3VyY2UnKTtcbiAgICBsZXQgdHdpdHRlclVSTCA9IGBodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh1cmwpfWA7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAodGV4dCkge1xuICAgICAgdHdpdHRlclVSTCArPSBgJnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQodGV4dCl9YDtcbiAgICB9XG4gICAgaWYgKHZpYSkge1xuICAgICAgdHdpdHRlclVSTCArPSBgJnZpYT0ke2VuY29kZVVSSUNvbXBvbmVudCh2aWEpfWA7XG4gICAgfVxuICAgIHdpbmRvdy5vcGVuKHR3aXR0ZXJVUkwsICd0d2VldCcsXG4gICAgICAgICd3aWR0aD01MDAsaGVpZ2h0PTM4NCxtZW51YmFyPW5vLHN0YXR1cz1ubyx0b29sYmFyPW5vJyk7XG4gIH0pO1xuXG4gIC8vIExpbmtlZEluIHNoYXJpbmdcbiAgJGJvZHkub24oJ2NsaWNrLnNoYXJlci1saScsICcuc2hhcmVyLWxpJywgZnVuY3Rpb24oZSkge1xuICAgIGNvbnN0ICRsaW5rID0gJChlLnRhcmdldCk7XG4gICAgY29uc3QgdXJsID0gJGxpbmsuZGF0YSgndXJsJyk7XG4gICAgY29uc3QgdGl0bGUgPSAkbGluay5kYXRhKCd0aXRsZScpO1xuICAgIGNvbnN0IHN1bW1hcnkgPSAkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpO1xuICAgIGNvbnN0IHNvdXJjZSA9ICRsaW5rLmRhdGEoJ3NvdXJjZScpO1xuICAgIGxldCBsaW5rZWRpblVSTCA9ICdodHRwczovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlP21pbmk9dHJ1ZSZ1cmw9JyArXG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBsaW5rZWRpblVSTCArPSBgJnRpdGxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpdGxlKX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaW5rZWRpblVSTCArPSAnJnRpdGxlPSc7XG4gICAgfVxuXG4gICAgaWYgKHN1bW1hcnkpIHtcbiAgICAgIGxpbmtlZGluVVJMICs9XG4gICAgICAgICAgYCZzdW1tYXJ5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHN1bW1hcnkuc3Vic3RyaW5nKDAsIDI1NikpfWA7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgbGlua2VkaW5VUkwgKz0gYCZzb3VyY2U9JHtlbmNvZGVVUklDb21wb25lbnQoc291cmNlKX1gO1xuICAgIH1cblxuICAgIHdpbmRvdy5vcGVuKGxpbmtlZGluVVJMLCAnbGlua2VkaW4nLFxuICAgICAgICAnd2lkdGg9NTIwLGhlaWdodD01NzAsbWVudWJhcj1ubyxzdGF0dXM9bm8sdG9vbGJhcj1ubycpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNvY2lhbFNoYXJlO1xuIl19
