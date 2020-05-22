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

},{"./ComponentMap":12,"./components/services":32,"./components/views/InViewport":33}],12:[function(require,module,exports){
'use strict';

// Import all required modules
// import Header from './components/views/Header';
Object.defineProperty(exports, "__esModule", { value: true });var _Nav = require('./components/views/Nav');var _Nav2 = _interopRequireDefault(_Nav);
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

},{"./components/views/Nav":34,"./components/views/Video":35}],13:[function(require,module,exports){
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

},{"../../Utils":24,"Constants":18}],34:[function(require,module,exports){
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

},{"../../Constants":18}],35:[function(require,module,exports){
'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();

var _Constants = require('../../Constants');function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}


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
      this.cacheDomReferences().
      setupHandlers().
      enable();

      document.body.classList.add('video-open');

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

},{"../../Constants":18}],36:[function(require,module,exports){
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

},{"./App":11,"foundation-sites/js/foundation.core.js":1,"foundation-sites/js/foundation.offcanvas.js":2,"foundation-sites/js/foundation.util.box.js":3,"foundation-sites/js/foundation.util.keyboard.js":4,"foundation-sites/js/foundation.util.mediaQuery.js":5,"foundation-sites/js/foundation.util.motion.js":6,"foundation-sites/js/foundation.util.nest.js":7,"foundation-sites/js/foundation.util.timerAndImageLoader.js":8,"foundation-sites/js/foundation.util.touch.js":9,"foundation-sites/js/foundation.util.triggers.js":10,"modules/socialShare.js":37}],37:[function(require,module,exports){
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

},{}]},{},[36])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmNvcmUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5ib3guanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwic3JjL2pzL0FwcC5qcyIsInNyYy9qcy9Db21wb25lbnRNYXAuanMiLCJzcmMvanMvQ29uc3RhbnRzL2FyaWEuanMiLCJzcmMvanMvQ29uc3RhbnRzL2NsYXNzLW5hbWVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9lbmRwb2ludHMuanMiLCJzcmMvanMvQ29uc3RhbnRzL2Vycm9ycy5qcyIsInNyYy9qcy9Db25zdGFudHMvZXZlbnRzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9pbmRleC5qcyIsInNyYy9qcy9Db25zdGFudHMva2V5LWNvZGVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9taXNjLmpzIiwic3JjL2pzL0NvbnN0YW50cy9zZWxlY3RvcnMuanMiLCJzcmMvanMvVXRpbHMvZGVib3VuY2UuanMiLCJzcmMvanMvVXRpbHMvZ2V0Y29va2llLmpzIiwic3JjL2pzL1V0aWxzL2luZGV4LmpzIiwic3JjL2pzL1V0aWxzL2lzc2Nyb2xsZWRpbnRvdmlldy5qcyIsInNyYy9qcy9VdGlscy9vcGVucG9wdXAuanMiLCJzcmMvanMvVXRpbHMvcmFuZG9tc2VjdXJlc3RyaW5nLmpzIiwic3JjL2pzL1V0aWxzL3Njcm9sbHRvLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvQ2xpY2tTZXJ2aWNlLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvUmVzaXplU2VydmljZS5qcyIsInNyYy9qcy9jb21wb25lbnRzL3NlcnZpY2VzL1Njcm9sbFNlcnZpY2UuanMiLCJzcmMvanMvY29tcG9uZW50cy9zZXJ2aWNlcy9pbmRleC5qcyIsInNyYy9qcy9jb21wb25lbnRzL3ZpZXdzL0luVmlld3BvcnQuanMiLCJzcmMvanMvY29tcG9uZW50cy92aWV3cy9OYXYuanMiLCJzcmMvanMvY29tcG9uZW50cy92aWV3cy9WaWRlby5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvc29jaWFsU2hhcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7c1JDQUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7QUFFYjs7QUFFQSxNQUFJLHFCQUFxQixPQUF6Qjs7QUFFQTtBQUNBO0FBQ0EsTUFBSSxhQUFhO0FBQ2YsYUFBUyxrQkFETTs7QUFHZjs7O0FBR0EsY0FBVSxFQU5LOztBQVFmOzs7QUFHQSxZQUFRLEVBWE87O0FBYWY7OztBQUdBLFNBQUssZUFBVTtBQUNiLGFBQU8sRUFBRSxNQUFGLEVBQVUsSUFBVixDQUFlLEtBQWYsTUFBMEIsS0FBakM7QUFDRCxLQWxCYztBQW1CZjs7OztB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Q0FBZjtBQUNBLFFBQUksY0FBYztBQUNkLHVCQUFtQixHQUFuQixDQURKOztBQUdBLE1BQUUsY0FBRjs7QUFFQSxRQUFJLEtBQUosRUFBVztBQUNULGlDQUF5QixtQkFBbUIsS0FBbkIsQ0FBekI7QUFDRCxLQUZELE1BRU87QUFDTCxxQkFBZSxTQUFmO0FBQ0Q7O0FBRUQsUUFBSSxPQUFKLEVBQWE7QUFDWDtBQUNnQix5QkFBbUIsUUFBUSxTQUFSLENBQWtCLENBQWxCLEVBQXFCLEdBQXJCLENBQW5CLENBRGhCO0FBRUQ7O0FBRUQsUUFBSSxNQUFKLEVBQVk7QUFDVixrQ0FBMEIsbUJBQW1CLE1BQW5CLENBQTFCO0FBQ0Q7O0FBRUQsV0FBTyxJQUFQLENBQVksV0FBWixFQUF5QixVQUF6QjtBQUNJLDBEQURKO0FBRUQsR0E1QkQ7QUE2QkQsQ0FsR0QsQzs7QUFvR2UsVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjMuMSc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBldGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYgKCd0cnVlJyA9PT0gc3RyKSByZXR1cm4gdHJ1ZTtcbiAgZWxzZSBpZiAoJ2ZhbHNlJyA9PT0gc3RyKSByZXR1cm4gZmFsc2U7XG4gIGVsc2UgaWYgKCFpc05hTihzdHIgKiAxKSkgcmV0dXJuIHBhcnNlRmxvYXQoc3RyKTtcbiAgcmV0dXJuIHN0cjtcbn1cbi8vIENvbnZlcnQgUGFzY2FsQ2FzZSB0byBrZWJhYi1jYXNlXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcbmZ1bmN0aW9uIGh5cGhlbmF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogT2ZmQ2FudmFzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vZmZjYW52YXNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBPZmZDYW52YXMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT2ZmQ2FudmFzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKCk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPZmZDYW52YXMnKVxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09mZkNhbnZhcycsIHtcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhgaXMtdHJhbnNpdGlvbi0ke3RoaXMub3B0aW9ucy50cmFuc2l0aW9ufWApO1xuXG4gICAgLy8gRmluZCB0cmlnZ2VycyB0aGF0IGFmZmVjdCB0aGlzIGVsZW1lbnQgYW5kIGFkZCBhcmlhLWV4cGFuZGVkIHRvIHRoZW1cbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoZG9jdW1lbnQpXG4gICAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcblxuICAgIC8vIEFkZCBhbiBvdmVybGF5IG92ZXIgdGhlIGNvbnRlbnQgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHZhciBvdmVybGF5UG9zaXRpb24gPSAkKHRoaXMuJGVsZW1lbnQpLmNzcyhcInBvc2l0aW9uXCIpID09PSAnZml4ZWQnID8gJ2lzLW92ZXJsYXktZml4ZWQnIDogJ2lzLW92ZXJsYXktYWJzb2x1dGUnO1xuICAgICAgb3ZlcmxheS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2pzLW9mZi1jYW52YXMtb3ZlcmxheSAnICsgb3ZlcmxheVBvc2l0aW9uKTtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSAkKG92ZXJsYXkpO1xuICAgICAgaWYob3ZlcmxheVBvc2l0aW9uID09PSAnaXMtb3ZlcmxheS1maXhlZCcpIHtcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLiRvdmVybGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hcHBlbmQodGhpcy4kb3ZlcmxheSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPSB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCB8fCBuZXcgUmVnRXhwKHRoaXMub3B0aW9ucy5yZXZlYWxDbGFzcywgJ2cnKS50ZXN0KHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnJldmVhbE9uID0gdGhpcy5vcHRpb25zLnJldmVhbE9uIHx8IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8ocmV2ZWFsLWZvci1tZWRpdW18cmV2ZWFsLWZvci1sYXJnZSkvZylbMF0uc3BsaXQoJy0nKVsyXTtcbiAgICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID0gcGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgkKCdbZGF0YS1vZmYtY2FudmFzXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKS5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAna2V5ZG93bi56Zi5vZmZjYW52YXMnOiB0aGlzLl9oYW5kbGVLZXlib2FyZC5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSkge1xuICAgICAgdmFyICR0YXJnZXQgPSB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPyB0aGlzLiRvdmVybGF5IDogJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpO1xuICAgICAgJHRhcmdldC5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGV2ZW50IGxpc3RlbmVyIGZvciBlbGVtZW50cyB0aGF0IHdpbGwgcmV2ZWFsIGF0IGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0TVFDaGVja2VyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzLnJldmVhbChmYWxzZSk7XG4gICAgICB9XG4gICAgfSkub25lKCdsb2FkLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1JldmVhbGVkIC0gdHJ1ZSBpZiBlbGVtZW50IHNob3VsZCBiZSByZXZlYWxlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICByZXZlYWwoaXNSZXZlYWxlZCkge1xuICAgIHZhciAkY2xvc2VyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKTtcbiAgICBpZiAoaXNSZXZlYWxlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdvcGVuLnpmLnRyaWdnZXIgdG9nZ2xlLnpmLnRyaWdnZXInKTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkgeyAkY2xvc2VyLmhpZGUoKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKVxuICAgICAgfSk7XG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHtcbiAgICAgICAgJGNsb3Nlci5zaG93KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHNjcm9sbGluZyBvZiB0aGUgYm9keSB3aGVuIG9mZmNhbnZhcyBpcyBvcGVuIG9uIG1vYmlsZSBTYWZhcmkgYW5kIG90aGVyIHRyb3VibGVzb21lIGJyb3dzZXJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3N0b3BTY3JvbGxpbmcoZXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUYWtlbiBhbmQgYWRhcHRlZCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTY4ODk0NDcvcHJldmVudC1mdWxsLXBhZ2Utc2Nyb2xsaW5nLWlvc1xuICAvLyBPbmx5IHJlYWxseSB3b3JrcyBmb3IgeSwgbm90IHN1cmUgaG93IHRvIGV4dGVuZCB0byB4IG9yIGlmIHdlIG5lZWQgdG8uXG4gIF9yZWNvcmRTY3JvbGxhYmxlKGV2ZW50KSB7XG4gICAgbGV0IGVsZW0gPSB0aGlzOyAvLyBjYWxsZWQgZnJvbSBldmVudCBoYW5kbGVyIGNvbnRleHQgd2l0aCB0aGlzIGFzIGVsZW1cblxuICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBzY3JvbGxhYmxlIChjb250ZW50IG92ZXJmbG93cyksIHRoZW4uLi5cbiAgICBpZiAoZWxlbS5zY3JvbGxIZWlnaHQgIT09IGVsZW0uY2xpZW50SGVpZ2h0KSB7XG4gICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgdG9wLCBzY3JvbGwgZG93biBvbmUgcGl4ZWwgdG8gYWxsb3cgc2Nyb2xsaW5nIHVwXG4gICAgICBpZiAoZWxlbS5zY3JvbGxUb3AgPT09IDApIHtcbiAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSAxO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UncmUgYXQgdGhlIGJvdHRvbSwgc2Nyb2xsIHVwIG9uZSBwaXhlbCB0byBhbGxvdyBzY3JvbGxpbmcgZG93blxuICAgICAgaWYgKGVsZW0uc2Nyb2xsVG9wID09PSBlbGVtLnNjcm9sbEhlaWdodCAtIGVsZW0uY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIGVsZW0uc2Nyb2xsVG9wID0gZWxlbS5zY3JvbGxIZWlnaHQgLSBlbGVtLmNsaWVudEhlaWdodCAtIDE7XG4gICAgICB9XG4gICAgfVxuICAgIGVsZW0uYWxsb3dVcCA9IGVsZW0uc2Nyb2xsVG9wID4gMDtcbiAgICBlbGVtLmFsbG93RG93biA9IGVsZW0uc2Nyb2xsVG9wIDwgKGVsZW0uc2Nyb2xsSGVpZ2h0IC0gZWxlbS5jbGllbnRIZWlnaHQpO1xuICAgIGVsZW0ubGFzdFkgPSBldmVudC5vcmlnaW5hbEV2ZW50LnBhZ2VZO1xuICB9XG5cbiAgX3N0b3BTY3JvbGxQcm9wYWdhdGlvbihldmVudCkge1xuICAgIGxldCBlbGVtID0gdGhpczsgLy8gY2FsbGVkIGZyb20gZXZlbnQgaGFuZGxlciBjb250ZXh0IHdpdGggdGhpcyBhcyBlbGVtXG4gICAgbGV0IHVwID0gZXZlbnQucGFnZVkgPCBlbGVtLmxhc3RZO1xuICAgIGxldCBkb3duID0gIXVwO1xuICAgIGVsZW0ubGFzdFkgPSBldmVudC5wYWdlWTtcblxuICAgIGlmKCh1cCAmJiBlbGVtLmFsbG93VXApIHx8IChkb3duICYmIGVsZW0uYWxsb3dEb3duKSkge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI29wZW5lZFxuICAgKi9cbiAgb3BlbihldmVudCwgdHJpZ2dlcikge1xuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodHJpZ2dlcikge1xuICAgICAgdGhpcy4kbGFzdFRyaWdnZXIgPSB0cmlnZ2VyO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VUbyA9PT0gJ3RvcCcpIHtcbiAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvID09PSAnYm90dG9tJykge1xuICAgICAgd2luZG93LnNjcm9sbFRvKDAsZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI29wZW5lZFxuICAgICAqL1xuICAgIF90aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1vcGVuJylcblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKVxuICAgICAgICAudHJpZ2dlcignb3BlbmVkLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgLy8gSWYgYGNvbnRlbnRTY3JvbGxgIGlzIHNldCB0byBmYWxzZSwgYWRkIGNsYXNzIGFuZCBkaXNhYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtb2ZmLWNhbnZhcy1vcGVuJykub24oJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxpbmcpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigndG91Y2hzdGFydCcsIHRoaXMuX3JlY29yZFNjcm9sbGFibGUpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbFByb3BhZ2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgPT09IHRydWUgJiYgdGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdpcy1jbG9zYWJsZScpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQodGhpcy4kZWxlbWVudCksIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy4kZWxlbWVudC5maW5kKCdhLCBidXR0b24nKS5lcSgwKS5mb2N1cygpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC50cmFwRm9jdXModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYiB0byBmaXJlIGFmdGVyIGNsb3N1cmUuXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjY2xvc2VkXG4gICAqL1xuICBjbG9zZShjYikge1xuICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAgICogQGV2ZW50IE9mZkNhbnZhcyNjbG9zZWRcbiAgICAgICAqL1xuICAgICAgICAudHJpZ2dlcignY2xvc2VkLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgLy8gSWYgYGNvbnRlbnRTY3JvbGxgIGlzIHNldCB0byBmYWxzZSwgcmVtb3ZlIGNsYXNzIGFuZCByZS1lbmFibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vZmYoJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxpbmcpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ3RvdWNoc3RhcnQnLCB0aGlzLl9yZWNvcmRTY3JvbGxhYmxlKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkucmVtb3ZlQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSAmJiB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkucmVtb3ZlQ2xhc3MoJ2lzLWNsb3NhYmxlJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWxlYXNlRm9jdXModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9mZi1jYW52YXMgbWVudSBvcGVuIG9yIGNsb3NlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqL1xuICB0b2dnbGUoZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICB0aGlzLmNsb3NlKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oZXZlbnQsIHRyaWdnZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGlucHV0IHdoZW4gZGV0ZWN0ZWQuIFdoZW4gdGhlIGVzY2FwZSBrZXkgaXMgcHJlc3NlZCwgdGhlIG9mZi1jYW52YXMgbWVudSBjbG9zZXMsIGFuZCBmb2N1cyBpcyByZXN0b3JlZCB0byB0aGUgZWxlbWVudCB0aGF0IG9wZW5lZCB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGFuZGxlS2V5Ym9hcmQoZSkge1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdPZmZDYW52YXMnLCB7XG4gICAgICBjbG9zZTogKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyLmZvY3VzKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGhhbmRsZWQ6ICgpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBvZmZjYW52YXMgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jbG9zZSgpO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJyk7XG4gICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5vZmZjYW52YXMnKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5PZmZDYW52YXMuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgdXNlciB0byBjbGljayBvdXRzaWRlIG9mIHRoZSBtZW51IHRvIGNsb3NlIGl0LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gb3ZlcmxheSBvbiB0b3Agb2YgYFtkYXRhLW9mZi1jYW52YXMtY29udGVudF1gLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjb250ZW50T3ZlcmxheTogdHJ1ZSxcblxuICAvKipcbiAgICogRW5hYmxlL2Rpc2FibGUgc2Nyb2xsaW5nIG9mIHRoZSBtYWluIGNvbnRlbnQgd2hlbiBhbiBvZmYgY2FudmFzIHBhbmVsIGlzIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGNvbnRlbnRTY3JvbGw6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIGluIG1zIHRoZSBvcGVuIGFuZCBjbG9zZSB0cmFuc2l0aW9uIHJlcXVpcmVzLiBJZiBub25lIHNlbGVjdGVkLCBwdWxscyBmcm9tIGJvZHkgc3R5bGUuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMFxuICAgKi9cbiAgdHJhbnNpdGlvblRpbWU6IDAsXG5cbiAgLyoqXG4gICAqIFR5cGUgb2YgdHJhbnNpdGlvbiBmb3IgdGhlIG9mZmNhbnZhcyBtZW51LiBPcHRpb25zIGFyZSAncHVzaCcsICdkZXRhY2hlZCcgb3IgJ3NsaWRlJy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBwdXNoXG4gICAqL1xuICB0cmFuc2l0aW9uOiAncHVzaCcsXG5cbiAgLyoqXG4gICAqIEZvcmNlIHRoZSBwYWdlIHRvIHNjcm9sbCB0byB0b3Agb3IgYm90dG9tIG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqIEBkZWZhdWx0IG51bGxcbiAgICovXG4gIGZvcmNlVG86IG51bGwsXG5cbiAgLyoqXG4gICAqIEFsbG93IHRoZSBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4gZm9yIGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBpc1JldmVhbGVkOiBmYWxzZSxcblxuICAvKipcbiAgICogQnJlYWtwb2ludCBhdCB3aGljaCB0byByZXZlYWwuIEpTIHdpbGwgdXNlIGEgUmVnRXhwIHRvIHRhcmdldCBzdGFuZGFyZCBjbGFzc2VzLCBpZiBjaGFuZ2luZyBjbGFzc25hbWVzLCBwYXNzIHlvdXIgY2xhc3Mgd2l0aCB0aGUgYHJldmVhbENsYXNzYCBvcHRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqIEBkZWZhdWx0IG51bGxcbiAgICovXG4gIHJldmVhbE9uOiBudWxsLFxuXG4gIC8qKlxuICAgKiBGb3JjZSBmb2N1cyB0byB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uIElmIHRydWUsIHdpbGwgZm9jdXMgdGhlIG9wZW5pbmcgdHJpZ2dlciBvbiBjbG9zZS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgYXV0b0ZvY3VzOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB1c2VkIHRvIGZvcmNlIGFuIG9mZmNhbnZhcyB0byByZW1haW4gb3Blbi4gRm91bmRhdGlvbiBkZWZhdWx0cyBmb3IgdGhpcyBhcmUgYHJldmVhbC1mb3ItbGFyZ2VgICYgYHJldmVhbC1mb3ItbWVkaXVtYC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCByZXZlYWwtZm9yLVxuICAgKiBAdG9kbyBpbXByb3ZlIHRoZSByZWdleCB0ZXN0aW5nIGZvciB0aGlzLlxuICAgKi9cbiAgcmV2ZWFsQ2xhc3M6ICdyZXZlYWwtZm9yLScsXG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIG9wdGlvbmFsIGZvY3VzIHRyYXBwaW5nIHdoZW4gb3BlbmluZyBhbiBvZmZjYW52YXMuIFNldHMgdGFiaW5kZXggb2YgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XSB0byAtMSBmb3IgYWNjZXNzaWJpbGl0eSBwdXJwb3Nlcy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHRyYXBGb2N1czogZmFsc2Vcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKE9mZkNhbnZhcywgJ09mZkNhbnZhcycpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbkZvdW5kYXRpb24uQm94ID0ge1xuICBJbU5vdFRvdWNoaW5nWW91OiBJbU5vdFRvdWNoaW5nWW91LFxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXG59XG5cbi8qKlxuICogQ29tcGFyZXMgdGhlIGRpbWVuc2lvbnMgb2YgYW4gZWxlbWVudCB0byBhIGNvbnRhaW5lciBhbmQgZGV0ZXJtaW5lcyBjb2xsaXNpb24gZXZlbnRzIHdpdGggY29udGFpbmVyLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdGVzdCBmb3IgY29sbGlzaW9ucy5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBwYXJlbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBhcyBib3VuZGluZyBjb250YWluZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxuICogQHBhcmFtIHtCb29sZWFufSB0Yk9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayB0b3AgYW5kIGJvdHRvbSB2YWx1ZXMgb25seS5cbiAqIEBkZWZhdWx0IGlmIG5vIHBhcmVudCBvYmplY3QgcGFzc2VkLCBkZXRlY3RzIGNvbGxpc2lvbnMgd2l0aCBgd2luZG93YC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIEltTm90VG91Y2hpbmdZb3UoZWxlbWVudCwgcGFyZW50LCBsck9ubHksIHRiT25seSkge1xuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XG5cbiAgaWYgKHBhcmVudCkge1xuICAgIHZhciBwYXJEaW1zID0gR2V0RGltZW5zaW9ucyhwYXJlbnQpO1xuXG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IHBhckRpbXMuaGVpZ2h0ICsgcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IHBhckRpbXMud2lkdGggKyBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgLSAkZWxlRGltcy53aWR0aCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgfVxufVxuXG59KGpRdWVyeSk7XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoaXMgdXRpbCB3YXMgY3JlYXRlZCBieSBNYXJpdXMgT2xiZXJ0eiAqXG4gKiBQbGVhc2UgdGhhbmsgTWFyaXVzIG9uIEdpdEh1YiAvb3dsYmVydHogKlxuICogb3IgdGhlIHdlYiBodHRwOi8vd3d3Lm1hcml1c29sYmVydHouZGUvICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4ndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IGtleUNvZGVzID0ge1xuICA5OiAnVEFCJyxcbiAgMTM6ICdFTlRFUicsXG4gIDI3OiAnRVNDQVBFJyxcbiAgMzI6ICdTUEFDRScsXG4gIDM3OiAnQVJST1dfTEVGVCcsXG4gIDM4OiAnQVJST1dfVVAnLFxuICAzOTogJ0FSUk9XX1JJR0hUJyxcbiAgNDA6ICdBUlJPV19ET1dOJ1xufVxuXG52YXIgY29tbWFuZHMgPSB7fVxuXG52YXIgS2V5Ym9hcmQgPSB7XG4gIGtleXM6IGdldEtleUNvZGVzKGtleUNvZGVzKSxcblxuICAvKipcbiAgICogUGFyc2VzIHRoZSAoa2V5Ym9hcmQpIGV2ZW50IGFuZCByZXR1cm5zIGEgU3RyaW5nIHRoYXQgcmVwcmVzZW50cyBpdHMga2V5XG4gICAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICogQHJldHVybiBTdHJpbmcga2V5IC0gU3RyaW5nIHRoYXQgcmVwcmVzZW50cyB0aGUga2V5IHByZXNzZWRcbiAgICovXG4gIHBhcnNlS2V5KGV2ZW50KSB7XG4gICAgdmFyIGtleSA9IGtleUNvZGVzW2V2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQud2hpY2gpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAvLyBSZW1vdmUgdW4tcHJpbnRhYmxlIGNoYXJhY3RlcnMsIGUuZy4gZm9yIGBmcm9tQ2hhckNvZGVgIGNhbGxzIGZvciBDVFJMIG9ubHkgZXZlbnRzXG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL1xcVysvLCAnJyk7XG5cbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSBrZXkgPSBgQ1RSTF8ke2tleX1gO1xuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcblxuICAgIC8vIFJlbW92ZSB0cmFpbGluZyB1bmRlcnNjb3JlLCBpbiBjYXNlIG9ubHkgbW9kaWZpZXJzIHdlcmUgdXNlZCAoZS5nLiBvbmx5IGBDVFJMX0FMVGApXG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL18kLywgJycpO1xuXG4gICAgcmV0dXJuIGtleTtcbiAgfSxcblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgZ2l2ZW4gKGtleWJvYXJkKSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50J3MgbmFtZSwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEBwYXJhbSB7T2JqZWN0c30gZnVuY3Rpb25zIC0gY29sbGVjdGlvbiBvZiBmdW5jdGlvbnMgdGhhdCBhcmUgdG8gYmUgZXhlY3V0ZWRcbiAgICovXG4gIGhhbmRsZUtleShldmVudCwgY29tcG9uZW50LCBmdW5jdGlvbnMpIHtcbiAgICB2YXIgY29tbWFuZExpc3QgPSBjb21tYW5kc1tjb21wb25lbnRdLFxuICAgICAga2V5Q29kZSA9IHRoaXMucGFyc2VLZXkoZXZlbnQpLFxuICAgICAgY21kcyxcbiAgICAgIGNvbW1hbmQsXG4gICAgICBmbjtcblxuICAgIGlmICghY29tbWFuZExpc3QpIHJldHVybiBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCBub3QgZGVmaW5lZCEnKTtcblxuICAgIGlmICh0eXBlb2YgY29tbWFuZExpc3QubHRyID09PSAndW5kZWZpbmVkJykgeyAvLyB0aGlzIGNvbXBvbmVudCBkb2VzIG5vdCBkaWZmZXJlbnRpYXRlIGJldHdlZW4gbHRyIGFuZCBydGxcbiAgICAgICAgY21kcyA9IGNvbW1hbmRMaXN0OyAvLyB1c2UgcGxhaW4gbGlzdFxuICAgIH0gZWxzZSB7IC8vIG1lcmdlIGx0ciBhbmQgcnRsOiBpZiBkb2N1bWVudCBpcyBydGwsIHJ0bCBvdmVyd3JpdGVzIGx0ciBhbmQgdmljZSB2ZXJzYVxuICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5sdHIsIGNvbW1hbmRMaXN0LnJ0bCk7XG5cbiAgICAgICAgZWxzZSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0LnJ0bCwgY29tbWFuZExpc3QubHRyKTtcbiAgICB9XG4gICAgY29tbWFuZCA9IGNtZHNba2V5Q29kZV07XG5cbiAgICBmbiA9IGZ1bmN0aW9uc1tjb21tYW5kXTtcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gIGlmIGV4aXN0c1xuICAgICAgdmFyIHJldHVyblZhbHVlID0gZm4uYXBwbHkoKTtcbiAgICAgIGlmIChmdW5jdGlvbnMuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLmhhbmRsZWQocmV0dXJuVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZnVuY3Rpb25zLnVuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLnVuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIG5vdCBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLnVuaGFuZGxlZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRmluZHMgYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gdGhlIGdpdmVuIGAkZWxlbWVudGBcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBzZWFyY2ggd2l0aGluXG4gICAqIEByZXR1cm4ge2pRdWVyeX0gJGZvY3VzYWJsZSAtIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIGAkZWxlbWVudGBcbiAgICovXG4gIGZpbmRGb2N1c2FibGUoJGVsZW1lbnQpIHtcbiAgICBpZighJGVsZW1lbnQpIHtyZXR1cm4gZmFsc2U7IH1cbiAgICByZXR1cm4gJGVsZW1lbnQuZmluZCgnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgKlt0YWJpbmRleF0sICpbY29udGVudGVkaXRhYmxlXScpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIGlmICghJCh0aGlzKS5pcygnOnZpc2libGUnKSB8fCAkKHRoaXMpLmF0dHIoJ3RhYmluZGV4JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfSAvL29ubHkgaGF2ZSB2aXNpYmxlIGVsZW1lbnRzIGFuZCB0aG9zZSB0aGF0IGhhdmUgYSB0YWJpbmRleCBncmVhdGVyIG9yIGVxdWFsIDBcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgbmFtZSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEByZXR1cm4gU3RyaW5nIGNvbXBvbmVudE5hbWVcbiAgICovXG5cbiAgcmVnaXN0ZXIoY29tcG9uZW50TmFtZSwgY21kcykge1xuICAgIGNvbW1hbmRzW2NvbXBvbmVudE5hbWVdID0gY21kcztcbiAgfSwgIFxuXG4gIC8qKlxuICAgKiBUcmFwcyB0aGUgZm9jdXMgaW4gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gJGVsZW1lbnQgIGpRdWVyeSBvYmplY3QgdG8gdHJhcCB0aGUgZm91Y3MgaW50by5cbiAgICovXG4gIHRyYXBGb2N1cygkZWxlbWVudCkge1xuICAgIHZhciAkZm9jdXNhYmxlID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKCRlbGVtZW50KSxcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlID0gJGZvY3VzYWJsZS5lcSgwKSxcbiAgICAgICAgJGxhc3RGb2N1c2FibGUgPSAkZm9jdXNhYmxlLmVxKC0xKTtcblxuICAgICRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnRyYXBmb2N1cycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSAkbGFzdEZvY3VzYWJsZVswXSAmJiBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGV2ZW50KSA9PT0gJ1RBQicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlLmZvY3VzKCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChldmVudC50YXJnZXQgPT09ICRmaXJzdEZvY3VzYWJsZVswXSAmJiBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGV2ZW50KSA9PT0gJ1NISUZUX1RBQicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGxhc3RGb2N1c2FibGUuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSB0cmFwcGVkIGZvY3VzIGZyb20gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gJGVsZW1lbnQgIGpRdWVyeSBvYmplY3QgdG8gcmVsZWFzZSB0aGUgZm9jdXMgZm9yLlxuICAgKi9cbiAgcmVsZWFzZUZvY3VzKCRlbGVtZW50KSB7XG4gICAgJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnRyYXBmb2N1cycpO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgaWYobmFtZWRRdWVyaWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIG1hdGNoZXMgdG8gYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLCBlaXRoZXIgJ3NtYWxsIG9ubHknIG9yICdzbWFsbCcuIE9taXR0aW5nICdvbmx5JyBmYWxscyBiYWNrIHRvIHVzaW5nIGF0TGVhc3QoKSBtZXRob2QuXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCBkb2VzIG5vdC5cbiAgICovXG4gIGlzKHNpemUpIHtcbiAgICBzaXplID0gc2l6ZS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICBpZihzaXplLmxlbmd0aCA+IDEgJiYgc2l6ZVsxXSA9PT0gJ29ubHknKSB7XG4gICAgICBpZihzaXplWzBdID09PSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpKSByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuYXRMZWFzdChzaXplWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZWRpYSBxdWVyeSBvZiBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfG51bGx9IC0gVGhlIG1lZGlhIHF1ZXJ5IG9mIHRoZSBicmVha3BvaW50LCBvciBgbnVsbGAgaWYgdGhlIGJyZWFrcG9pbnQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIGdldChzaXplKSB7XG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIGlmKHRoaXMucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG4gICAgICAgIGlmIChzaXplID09PSBxdWVyeS5uYW1lKSByZXR1cm4gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCBuYW1lIGJ5IHRlc3RpbmcgZXZlcnkgYnJlYWtwb2ludCBhbmQgcmV0dXJuaW5nIHRoZSBsYXN0IG9uZSB0byBtYXRjaCAodGhlIGJpZ2dlc3Qgb25lKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGN1cnJlbnQgYnJlYWtwb2ludC5cbiAgICovXG4gIF9nZXRDdXJyZW50U2l6ZSgpIHtcbiAgICB2YXIgbWF0Y2hlZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG5cbiAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShxdWVyeS52YWx1ZSkubWF0Y2hlcykge1xuICAgICAgICBtYXRjaGVkID0gcXVlcnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVkID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIG1hdGNoZWQubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBY3RpdmF0ZXMgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlciwgd2hpY2ggZmlyZXMgYW4gZXZlbnQgb24gdGhlIHdpbmRvdyB3aGVuZXZlciB0aGUgYnJlYWtwb2ludCBjaGFuZ2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF93YXRjaGVyKCkge1xuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLm1lZGlhcXVlcnknLCAoKSA9PiB7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCksIGN1cnJlbnRTaXplID0gdGhpcy5jdXJyZW50O1xuXG4gICAgICBpZiAobmV3U2l6ZSAhPT0gY3VycmVudFNpemUpIHtcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1NpemU7XG5cbiAgICAgICAgLy8gQnJvYWRjYXN0IHRoZSBtZWRpYSBxdWVyeSBjaGFuZ2Ugb24gdGhlIHdpbmRvd1xuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgW25ld1NpemUsIGN1cnJlbnRTaXplXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbi8vIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy5cbi8vIEF1dGhvcnMgJiBjb3B5cmlnaHQgKGMpIDIwMTI6IFNjb3R0IEplaGwsIFBhdWwgSXJpc2gsIE5pY2hvbGFzIFpha2FzLCBEYXZpZCBLbmlnaHQuIER1YWwgTUlUL0JTRCBsaWNlbnNlXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XG4gIHZhciBzdHlsZU1lZGlhID0gKHdpbmRvdy5zdHlsZU1lZGlhIHx8IHdpbmRvdy5tZWRpYSk7XG5cbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxuICBpZiAoIXN0eWxlTWVkaWEpIHtcbiAgICB2YXIgc3R5bGUgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyksXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgaW5mbyAgICAgICAgPSBudWxsO1xuXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLmlkICAgID0gJ21hdGNobWVkaWFqcy10ZXN0JztcblxuICAgIHNjcmlwdCAmJiBzY3JpcHQucGFyZW50Tm9kZSAmJiBzY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGUsIHNjcmlwdCk7XG5cbiAgICAvLyAnc3R5bGUuY3VycmVudFN0eWxlJyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICd3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZScgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgIGluZm8gPSAoJ2dldENvbXB1dGVkU3R5bGUnIGluIHdpbmRvdykgJiYgd2luZG93LmdldENvbXB1dGVkU3R5bGUoc3R5bGUsIG51bGwpIHx8IHN0eWxlLmN1cnJlbnRTdHlsZTtcblxuICAgIHN0eWxlTWVkaWEgPSB7XG4gICAgICBtYXRjaE1lZGl1bShtZWRpYSkge1xuICAgICAgICB2YXIgdGV4dCA9IGBAbWVkaWEgJHttZWRpYX17ICNtYXRjaG1lZGlhanMtdGVzdCB7IHdpZHRoOiAxcHg7IH0gfWA7XG5cbiAgICAgICAgLy8gJ3N0eWxlLnN0eWxlU2hlZXQnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3N0eWxlLnRleHRDb250ZW50JyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUZXN0IGlmIG1lZGlhIHF1ZXJ5IGlzIHRydWUgb3IgZmFsc2VcbiAgICAgICAgcmV0dXJuIGluZm8ud2lkdGggPT09ICcxcHgnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihtZWRpYSkge1xuICAgIHJldHVybiB7XG4gICAgICBtYXRjaGVzOiBzdHlsZU1lZGlhLm1hdGNoTWVkaXVtKG1lZGlhIHx8ICdhbGwnKSxcbiAgICAgIG1lZGlhOiBtZWRpYSB8fCAnYWxsJ1xuICAgIH07XG4gIH1cbn0oKSk7XG5cbi8vIFRoYW5rIHlvdTogaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9xdWVyeS1zdHJpbmdcbmZ1bmN0aW9uIHBhcnNlU3R5bGVUb09iamVjdChzdHIpIHtcbiAgdmFyIHN0eWxlT2JqZWN0ID0ge307XG5cbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3RyID0gc3RyLnRyaW0oKS5zbGljZSgxLCAtMSk7IC8vIGJyb3dzZXJzIHJlLXF1b3RlIHN0cmluZyBzdHlsZSB2YWx1ZXNcblxuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0eWxlT2JqZWN0ID0gc3RyLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uKHJldCwgcGFyYW0pIHtcbiAgICB2YXIgcGFydHMgPSBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKS5zcGxpdCgnPScpO1xuICAgIHZhciBrZXkgPSBwYXJ0c1swXTtcbiAgICB2YXIgdmFsID0gcGFydHNbMV07XG4gICAga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGtleSk7XG5cbiAgICAvLyBtaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxuICAgIC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcbiAgICB2YWwgPSB2YWwgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBkZWNvZGVVUklDb21wb25lbnQodmFsKTtcblxuICAgIGlmICghcmV0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldFtrZXldID0gdmFsO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXRba2V5XSkpIHtcbiAgICAgIHJldFtrZXldLnB1c2godmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0W2tleV0gPSBbcmV0W2tleV0sIHZhbF07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sIHt9KTtcblxuICByZXR1cm4gc3R5bGVPYmplY3Q7XG59XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBNb3Rpb24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm1vdGlvblxuICovXG5cbmNvbnN0IGluaXRDbGFzc2VzICAgPSBbJ211aS1lbnRlcicsICdtdWktbGVhdmUnXTtcbmNvbnN0IGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG5jb25zdCBNb3Rpb24gPSB7XG4gIGFuaW1hdGVJbjogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH0sXG5cbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUoZmFsc2UsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vdmUoZHVyYXRpb24sIGVsZW0sIGZuKXtcbiAgdmFyIGFuaW0sIHByb2csIHN0YXJ0ID0gbnVsbDtcbiAgLy8gY29uc29sZS5sb2coJ2NhbGxlZCcpO1xuXG4gIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmUodHMpe1xuICAgIGlmKCFzdGFydCkgc3RhcnQgPSB0cztcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcblxuICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmFkZENsYXNzKGhhc1N1YkNsYXNzKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJGl0ZW0uY2hpbGRyZW4oJ2E6Zmlyc3QnKS50ZXh0KClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyBOb3RlOiAgRHJpbGxkb3ducyBiZWhhdmUgZGlmZmVyZW50bHkgaW4gaG93IHRoZXkgaGlkZSwgYW5kIHNvIG5lZWRcbiAgICAgICAgICAvLyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMuICBXZSBzaG91bGQgbG9vayBpZiB0aGlzIHBvc3NpYmx5IG92ZXItZ2VuZXJhbGl6ZWRcbiAgICAgICAgICAvLyB1dGlsaXR5IChOZXN0KSBpcyBhcHByb3ByaWF0ZSB3aGVuIHdlIHJld29yayBtZW51cyBpbiA2LjRcbiAgICAgICAgICBpZih0eXBlID09PSAnZHJpbGxkb3duJykge1xuICAgICAgICAgICAgJGl0ZW0uYXR0cih7J2FyaWEtZXhwYW5kZWQnOiBmYWxzZX0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAkc3ViXG4gICAgICAgICAgLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2RhdGEtc3VibWVudSc6ICcnLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgaWYodHlwZSA9PT0gJ2RyaWxsZG93bicpIHtcbiAgICAgICAgICAkc3ViLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAkaXRlbS5hZGRDbGFzcyhgaXMtc3VibWVudS1pdGVtICR7c3ViSXRlbUNsYXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIEJ1cm4obWVudSwgdHlwZSkge1xuICAgIHZhciAvL2l0ZW1zID0gbWVudS5maW5kKCdsaScpLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51XG4gICAgICAuZmluZCgnPmxpLCAubWVudSwgLm1lbnUgPiBsaScpXG4gICAgICAucmVtb3ZlQ2xhc3MoYCR7c3ViTWVudUNsYXNzfSAke3N1Ykl0ZW1DbGFzc30gJHtoYXNTdWJDbGFzc30gaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlYClcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyggICAgICBtZW51LmZpbmQoJy4nICsgc3ViTWVudUNsYXNzICsgJywgLicgKyBzdWJJdGVtQ2xhc3MgKyAnLCAuaGFzLXN1Ym1lbnUsIC5pcy1zdWJtZW51LWl0ZW0sIC5zdWJtZW51LCBbZGF0YS1zdWJtZW51XScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnIGhhcy1zdWJtZW51IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51JylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpKTtcbiAgICAvLyBpdGVtcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgLy8gICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgIC8vICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcbiAgICAvLyAgIGlmKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xuICAgIC8vICAgfVxuICAgIC8vICAgaWYoJHN1Yi5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaGFzLXN1Ym1lbnUnKTtcbiAgICAvLyAgICAgJHN1Yi5yZW1vdmVDbGFzcygnc3VibWVudSAnICsgc3ViTWVudUNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk5lc3QgPSBOZXN0O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmZ1bmN0aW9uIFRpbWVyKGVsZW0sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBkdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24sLy9vcHRpb25zIGlzIGFuIG9iamVjdCBmb3IgZWFzaWx5IGFkZGluZyBmZWF0dXJlcyBsYXRlci5cbiAgICAgIG5hbWVTcGFjZSA9IE9iamVjdC5rZXlzKGVsZW0uZGF0YSgpKVswXSB8fCAndGltZXInLFxuICAgICAgcmVtYWluID0gLTEsXG4gICAgICBzdGFydCxcbiAgICAgIHRpbWVyO1xuXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcblxuICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZW1haW4gPSAtMTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgfVxuXG4gIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgLy8gaWYoIWVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICByZW1haW4gPSByZW1haW4gPD0gMCA/IGR1cmF0aW9uIDogcmVtYWluO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgZmFsc2UpO1xuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG9wdGlvbnMuaW5maW5pdGUpe1xuICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXG4gICAgICB9XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyBDaGVjayBpZiBpbWFnZSBpcyBsb2FkZWRcbiAgICBpZiAodGhpcy5jb21wbGV0ZSB8fCAodGhpcy5yZWFkeVN0YXRlID09PSA0KSB8fCAodGhpcy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgLy8gRm9yY2UgbG9hZCB0aGUgaW1hZ2VcbiAgICBlbHNlIHtcbiAgICAgIC8vIGZpeCBmb3IgSUUuIFNlZSBodHRwczovL2Nzcy10cmlja3MuY29tL3NuaXBwZXRzL2pxdWVyeS9maXhpbmctbG9hZC1pbi1pZS1mb3ItY2FjaGVkLWltYWdlcy9cbiAgICAgIHZhciBzcmMgPSAkKHRoaXMpLmF0dHIoJ3NyYycpO1xuICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBzcmMgKyAoc3JjLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSkpO1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IG5ldyB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG4gIH0gZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCd0b2dnbGUuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5vbignbG9hZCcsICgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgbXV0YXRlTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbXV0YXRlTGlzdGVuZXIoZGVib3VuY2UpIHtcbiAgICBsZXQgJG5vZGVzID0gJCgnW2RhdGEtbXV0YXRlXScpO1xuICAgIGlmICgkbm9kZXMubGVuZ3RoICYmIE11dGF0aW9uT2JzZXJ2ZXIpe1xuXHRcdFx0Ly90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0ZSBldmVudFxuICAgICAgLy9ubyBJRSA5IG9yIDEwXG5cdFx0XHQkbm9kZXMuZWFjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcblx0XHRcdH0pO1xuICAgIH1cbiB9XG5cbmZ1bmN0aW9uIGV2ZW50c0xpc3RlbmVyKCkge1xuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxuICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZXNpemVdLCBbZGF0YS1zY3JvbGxdLCBbZGF0YS1tdXRhdGVdJyk7XG5cbiAgLy9lbGVtZW50IGNhbGxiYWNrXG4gIHZhciBsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uID0gZnVuY3Rpb24gKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnRhcmdldCk7XG5cblx0ICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXG4gICAgICBzd2l0Y2ggKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udHlwZSkge1xuXG4gICAgICAgIGNhc2UgXCJhdHRyaWJ1dGVzXCI6XG4gICAgICAgICAgaWYgKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpID09PSBcInNjcm9sbFwiICYmIG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJkYXRhLWV2ZW50c1wiKSB7XG5cdFx0ICBcdCR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInLCBbJHRhcmdldCwgd2luZG93LnBhZ2VZT2Zmc2V0XSk7XG5cdFx0ICB9XG5cdFx0ICBpZiAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikgPT09IFwicmVzaXplXCIgJiYgbXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcImRhdGEtZXZlbnRzXCIpIHtcblx0XHQgIFx0JHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XG5cdFx0ICAgfVxuXHRcdCAgaWYgKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG5cdFx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikuYXR0cihcImRhdGEtZXZlbnRzXCIsXCJtdXRhdGVcIik7XG5cdFx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKV0pO1xuXHRcdCAgfVxuXHRcdCAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImNoaWxkTGlzdFwiOlxuXHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS5hdHRyKFwiZGF0YS1ldmVudHNcIixcIm11dGF0ZVwiKTtcblx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKV0pO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAvL25vdGhpbmdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgLy9mb3IgZWFjaCBlbGVtZW50IHRoYXQgbmVlZHMgdG8gbGlzdGVuIGZvciByZXNpemluZywgc2Nyb2xsaW5nLCBvciBtdXRhdGlvbiBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICB2YXIgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XG4gICAgICAgIGVsZW1lbnRPYnNlcnZlci5vYnNlcnZlKG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUsIGF0dHJpYnV0ZUZpbHRlcjogW1wiZGF0YS1ldmVudHNcIiwgXCJzdHlsZVwiXSB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFtQSF1cbi8vIEZvdW5kYXRpb24uQ2hlY2tXYXRjaGVycyA9IGNoZWNrV2F0Y2hlcnM7XG5Gb3VuZGF0aW9uLklIZWFyWW91ID0gY2hlY2tMaXN0ZW5lcnM7XG4vLyBGb3VuZGF0aW9uLklTZWVZb3UgPSBzY3JvbGxMaXN0ZW5lcjtcbi8vIEZvdW5kYXRpb24uSUZlZWxZb3UgPSBjbG9zZW1lTGlzdGVuZXI7XG5cbn0oalF1ZXJ5KTtcblxuLy8gZnVuY3Rpb24gZG9tTXV0YXRpb25PYnNlcnZlcihkZWJvdW5jZSkge1xuLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cbi8vICAgdmFyIHRpbWVyLFxuLy8gICBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW11dGF0ZV0nKTtcbi8vICAgLy9cbi8vICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuLy8gICAgIC8vIHZhciBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbi8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuLy8gICAgIC8vICAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAvLyAgICAgaWYgKHByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xuLy8gICAgIC8vICAgICB9XG4vLyAgICAgLy8gICB9XG4vLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XG4vLyAgICAgLy8gfSgpKTtcbi8vXG4vL1xuLy8gICAgIC8vZm9yIHRoZSBib2R5LCB3ZSBuZWVkIHRvIGxpc3RlbiBmb3IgYWxsIGNoYW5nZXMgZWZmZWN0aW5nIHRoZSBzdHlsZSBhbmQgY2xhc3MgYXR0cmlidXRlc1xuLy8gICAgIHZhciBib2R5T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihib2R5TXV0YXRpb24pO1xuLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xuLy9cbi8vXG4vLyAgICAgLy9ib2R5IGNhbGxiYWNrXG4vLyAgICAgZnVuY3Rpb24gYm9keU11dGF0aW9uKG11dGF0ZSkge1xuLy8gICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0aW9uIGV2ZW50XG4vLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuLy9cbi8vICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbi8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbi8vICAgICAgICAgJCgnW2RhdGEtbXV0YXRlXScpLmF0dHIoJ2RhdGEtZXZlbnRzJyxcIm11dGF0ZVwiKTtcbi8vICAgICAgIH0sIGRlYm91bmNlIHx8IDE1MCk7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBJblZpZXdwb3J0IGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9JblZpZXdwb3J0JztcbmltcG9ydCBDb21wb25lbnRNYXAgZnJvbSAnLi9Db21wb25lbnRNYXAnO1xuaW1wb3J0IFNlcnZpY2VzIGZyb20gJy4vY29tcG9uZW50cy9zZXJ2aWNlcyc7XG5cbi8qKlxuICogVGhlIHRvcC1sZXZlbCBjb250cm9sbGVyIGZvciB0aGUgd2hvbGUgcGFnZS4gVGhpcyBjb21wb25lbnQgaXMgcmVzcG9uc2libGVcbiAqIGZvciBsb2FkaW5nIG90aGVyIGNvbnRyb2xsZXJzIGFuZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwIHtcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYWxsIGdsb2JhbCBKUyBjb21wb25lbnRzIGFuZCBjYWxsIGBsb2FkY29tcG9uZW50c2BcbiAgICogdG8gaW5pdGlhbGl6ZSBhbGwgdW5pcXVlIEpTIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIFNlcnZpY2VzIGlzIHRoZSBvYmplY3Qgd2hpY2ggaG9sZHMgcmVmZXJlbmNlcyB0byBhbGwgc2VydmljZXNcbiAgICAgKiBjcmVhdGVkIGZvciBwYWdlcy4gU2VydmljZXMgc2hvdWxkIGJlIGluc3RhbnRpYXRlZCB0aGVyZSBhbmRcbiAgICAgKiB0aGVuIHdpbGwgYmUgaW5qZWN0ZWQgaW50byBlYWNoIGNvbXBvbmVudCBmb3Igb3B0aW9uYWwgdXNlIHZpYSB0aGVcbiAgICAgKiBgbG9hZGNvbXBvbmVudHNgIGZ1bmN0aW9uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U2VydmljZXN9XG4gICAgICogQHByb3BlcnR5IHtTZXJ2aWNlc31cbiAgICAgKi9cbiAgICB0aGlzLlNlcnZpY2VzID0gbmV3IFNlcnZpY2VzKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgSW5WaWV3cG9ydCB2aWV3IGNvbXBvbmVudCB3aGljaCBuZWVkcyB0byBydW4gZ2xvYmFsbHkgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgICAqIEB0eXBlIHtJblZpZXdwb3J0fVxuICAgICAqIEBwcm9wZXJ0eSB7SW5WaWV3cG9ydH1cbiAgICAgKi9cbiAgICB0aGlzLmluVmlld3BvcnQgPSBuZXcgSW5WaWV3cG9ydCh0aGlzLlNlcnZpY2VzKTtcblxuICAgIC8vIExvYWQgZWFjaCBjb21wb25lbnRcbiAgICB0aGlzLmxvYWRQYWdlY29tcG9uZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgZnVuY3Rpb24gbG9vcHMgb3ZlciBhbGwgZWxlbWVudHMgaW4gdGhlIERPTSB3aXRoIHRoZVxuICAgKiBgZGF0YS1sb2FkY29tcG9uZW50YCBhdHRyaWJ1dGUgYW5kIGxvYWRzIHRoZSBzcGVjaWZpZWQgdmlld1xuICAgKiBvciBjb250cm9sbGVyLlxuICAgKlxuICAgKiBUbyBhdHRhY2ggYSBKUyBjb21wb25lbnQgdG8gYW4gSFRNTCBlbGVtZW50LCBpbiB5b3VyIG1hcmt1cCB5b3UnZFxuICAgKiBkbyBzb21ldGhpbmcgbGlrZTogPHNlY3Rpb24gY2xhc3M9XCJleGFtcGxlLWNvbXBvbmVudFwiIGRhdGEtbG9hZGNvbXBvbmVudD0nRXhhbXBsZWNvbXBvbmVudCc+XG4gICAqIHdoZXJlICdFeGFtcGxlY29tcG9uZW50JyBpcyB5b3VyIEpTIGNsYXNzIG5hbWUuIFlvdSdkIG5lZWQgdG8gYWRkIHRoYXQgY29tcG9uZW50IHRvIHRoZSAuL2NvbXBvbmVudE1hcC5qc1xuICAgKiBhbmQgbWFrZSBzdXJlIHRoZSBjb21wb25lbnQgZXhpc3RzIGFuZCBpcyBhIHByb3BlciBFUzYgY2xhc3MsIGFuZCB0aGVuIHlvdSdsbCBlbmQgdXAgd2l0aFxuICAgKiBhbiBFUzYgY2xhc3MgdGhhdCBpcyBwYXNzZWQgYSByZWZlcmVuY2UgdG8gc2VjdGlvbi5leGFtcGxlLWNvbXBvbmVudCBvbiBpbml0LlxuICAgKi9cbiAgbG9hZFBhZ2Vjb21wb25lbnRzKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9ICdkYXRhLWxvYWRjb21wb25lbnQnO1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnWycgKyBhdHRyaWJ1dGUgKyAnXScpLCAoZWxlbWVudCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ2xvYWRpbmcgY29tcG9uZW50ICcsIGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkpO1xuICAgICAgbmV3IENvbXBvbmVudE1hcFtlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpXShlbGVtZW50LCB0aGlzLlNlcnZpY2VzKTtcbiAgICB9KTtcbiAgfVxuXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEltcG9ydCBhbGwgcmVxdWlyZWQgbW9kdWxlc1xuLy8gaW1wb3J0IEhlYWRlciBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvSGVhZGVyJztcbmltcG9ydCBOYXYgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL05hdic7XG5pbXBvcnQgVmlkZW8gZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1ZpZGVvJztcbi8vIGltcG9ydCBGb3JtIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9Gb3JtJztcbi8vIGltcG9ydCBGaWx0ZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0ZpbHRlcic7XG4vLyBpbXBvcnQgVmlkZW8gZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1ZpZGVvJztcbi8vIGltcG9ydCBTbGlkZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1NsaWRlcic7XG4vLyBpbXBvcnQgQW5jaG9yIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9BbmNob3InO1xuLy8gaW1wb3J0IFNvY2lhbFNoYXJlIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9Tb2NpYWxTaGFyZSc7XG4vLyBpbXBvcnQgSW5WaWV3cG9ydCBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvSW5WaWV3cG9ydCc7XG4vLyBpbXBvcnQgQmFubmVyIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9CYW5uZXInO1xuXG4vLyBFeHBvcnQgcmVmZXJlbmNlIHRvIGFsbCBtb2R1bGVzIGluIGFuIG9iamVjdFxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC8vIEhlYWRlcixcbiAgICBOYXYsXG4gICAgVmlkZW8sXG4gICAgLy8gRm9ybSxcbiAgICAvLyBGaWx0ZXIsXG4gICAgLy8gVmlkZW9cbiAgICAvLyBBbmNob3IsXG4gICAgLy8gU2xpZGVyLFxuICAgIC8vIFNvY2lhbFNoYXJlLFxuICAgIC8vIEluVmlld3BvcnQsXG4gICAgLy8gQmFubmVyLFxufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRBUklBIFNUUklOR1Ncbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgQVJJQSA9IHtcbiAgRVhQQU5ERUQ6ICAgICAgICAgICAgICAgICAgICAgICdhcmlhLWV4cGFuZGVkJyxcbiAgSElEREVOOiAgICAgICAgICAgICAgICAgICAgICAgICdhcmlhLWhpZGRlbicsXG4gIFNFTEVDVEVEOiAgICAgICAgICAgICAgICAgICAgICAnYXJpYS1zZWxlY3RlZCdcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkQ0xBU1MgTkFNRVMgLSBmb3IgY2xhc3MgbmFtZXNcbi8vICAgICAgbm90IENTUyBzZWxlY3RvcnNcbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgQ0xBU1NfTkFNRVMgPSB7XG4gIEFCT1ZFX0JPVFRPTTogICAgICAgICAgICAgICAgICAgJ2Fib3ZlLWJvdHRvbScsXG4gIEFCT1ZFX0hBTEZXQVk6ICAgICAgICAgICAgICAgICAgJ2Fib3ZlLWhhbGZ3YXknLFxuICBBQk9WRV9WSUVXUE9SVDogICAgICAgICAgICAgICAgICdhYm92ZS12aWV3cG9ydCcsXG4gIEFDVElWRTogICAgICAgICAgICAgICAgICAgICAgICAgJ2FjdGl2ZScsXG4gIEJBTk5FUl9BQ1RJVkU6ICAgICAgICAgICAgICAgICAgJ2Jhbm5lci1hY3RpdmUnLFxuICBCVVRUT05fU1VCTUlUVElORzogICAgICAgICAgICAgICdidXR0b24tLXN1Ym1pdHRpbmcnLFxuICBCVVRUT05fU1VCTUlUVEVEOiAgICAgICAgICAgICAgICdidXR0b24tLXN1Ym1pdHRlZCcsXG4gIEVSUk9SOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Vycm9yJyxcbiAgQ0xJQ0s6ICAgICAgICAgICAgICAgICAgICAgICAgICAnY2xpY2snLFxuICBDTE9TRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICdjbG9zZWQnLFxuICBGSVJTVF9CQVRDSDogICAgICAgICAgICAgICAgICAgICdmaXJzdC1iYXRjaCcsXG4gIEZJWEVEOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hdi1maXhlZCcsXG4gIEhJRElORzogICAgICAgICAgICAgICAgICAgICAgICAgJ2hpZGluZycsXG4gIEhJRERFTjogICAgICAgICAgICAgICAgICAgICAgICAgJ2hpZGRlbicsXG4gIEhPVkVSOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2hvdmVyJyxcbiAgSU5WQUxJRDogICAgICAgICAgICAgICAgICAgICAgICAnaW52YWxpZCcsXG4gIElOX1ZJRVdQT1JUOiAgICAgICAgICAgICAgICAgICAgJ2luLXZpZXdwb3J0JyxcbiAgTE9BRElORzogICAgICAgICAgICAgICAgICAgICAgICAnbG9hZGluZycsXG4gIE1JTkk6ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21pbmknLFxuICBPUEVOOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdvcGVuJyxcbiAgT1BFTkVEOiAgICAgICAgICAgICAgICAgICAgICAgICAnb3BlbmVkJyxcbiAgU0NST0xMRUQ6ICAgICAgICAgICAgICAgICAgICAgICAnc2Nyb2xsZWQnLFxuICBTRUxFQ1RFRDogICAgICAgICAgICAgICAgICAgICAgICdzZWxlY3RlZCcsXG4gIFNVQk1JVFRFRDogICAgICAgICAgICAgICAgICAgICAgJ3N1Ym1pdHRlZCcsXG4gIFZJU1VBTExZX0hJRERFTjogICAgICAgICAgICAgICAgJ3Zpc3VhbGx5LWhpZGRlbicsXG4gIFZBTElEOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ3ZhbGlkJyxcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkTUlTQyBTVFJJTkdTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgRU5EUE9JTlRTID0ge1xuICBTRUFSQ0g6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnL3dwLWpzb24vcmVsZXZhbnNzaS92MS9zZWFyY2g/JyxcbiAgV1BBUEk6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy93cC1qc29uL3dwL3YyLycsXG4gIFdQQVBJVE9UQUw6ICAgICAgICAgICAgICAgICAgICAgICAgICdYLVdQLVRvdGFsJ1xufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRFUlJPUiBNZXNzYWdlc1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBFUlJPUlMgPSB7XG4gIEZFQVRVUkVEX0lNQUdFOiAgICAgICAgICAgICAgICAgJ0EgZmVhdHVyZWQgaW1hZ2UgaXMgcmVxdWlyZWQnLFxufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRFVkVOVFNcbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgRVZFTlRTID0ge1xuICBBTklNQVRJT05FTkQ6ICAgICAgICAgICAgICAgICAgICdhbmltYXRpb25lbmQnLFxuICBCRUZPUkVVTkxPQUQ6ICAgICAgICAgICAgICAgICAgICdiZWZvcmV1bmxvYWQnLFxuICBCTFVSOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdibHVyJyxcbiAgQ0hBTkdFOiAgICAgICAgICAgICAgICAgICAgICAgICAnY2hhbmdlJyxcbiAgQ0xFQVJfRklMVEVSUzogICAgICAgICAgICAgICAgICAnY2xlYXJmaWx0ZXJzJyxcbiAgQ0xJQ0s6ICAgICAgICAgICAgICAgICAgICAgICAgICAnY2xpY2snLFxuICBDVVNUT01fRVZFTlQ6ICAgICAgICAgICAgICAgICAgICdjdXN0b21ldmVudCcsXG4gIERJU1BMQVlfU1VCSEVBRElORzogICAgICAgICAgICAgJ2Rpc3BsYXlzdWJoZWFkaW5nJyxcbiAgRFJPUERPV05fQ0hBTkdFRDogICAgICAgICAgICAgICAnZHJvcGRvd25jaGFuZ2VkJyxcbiAgRk9STV9FUlJPUjogICAgICAgICAgICAgICAgICAgICAnZm9ybWVycm9yJyxcbiAgRk9STV9TVUNDRVNTOiAgICAgICAgICAgICAgICAgICAnZm9ybXN1Y2Nlc3MnLFxuICBGT0NVUzogICAgICAgICAgICAgICAgICAgICAgICAgICdmb2N1cycsXG4gIEhFQURFUl9ISURJTkc6ICAgICAgICAgICAgICAgICAgJ2hlYWRlci1oaWRpbmcnLFxuICBJTlBVVDogICAgICAgICAgICAgICAgICAgICAgICAgICdpbnB1dCcsXG4gIEtFWV9ET1dOOiAgICAgICAgICAgICAgICAgICAgICAgJ2tleWRvd24nLFxuICBNT1VTRU9VVDogICAgICAgICAgICAgICAgICAgICAgICdtb3VzZW91dCcsXG4gIE1PVVNFT1ZFUjogICAgICAgICAgICAgICAgICAgICAgJ21vdXNlb3ZlcicsXG4gIFBBR0VTSE9XOiAgICAgICAgICAgICAgICAgICAgICAgJ3BhZ2VzaG93JyxcbiAgUkVRVUVTVF9NQURFOiAgICAgICAgICAgICAgICAgICAncmVxdWVzdG1hZGUnLFxuICBSRVNJWkU6ICAgICAgICAgICAgICAgICAgICAgICAgICdyZXNpemUnLFxuICBSRVNVTFRTX1JFVFVSTkVEOiAgICAgICAgICAgICAgICdyZXN1bHRzcmV0dXJuZCcsXG4gIFNDUk9MTDogICAgICAgICAgICAgICAgICAgICAgICAgJ3Njcm9sbCcsXG4gIFNJTVVMQVRFRF9DTElDSzogICAgICAgICAgICAgICAgJ3NpbXVsYXRlZC1jbGljaycsXG4gIFNIT1dfSElERTogICAgICAgICAgICAgICAgICAgICAgJ3Nob3doaWRlJyxcbiAgU1VCTUlUOiAgICAgICAgICAgICAgICAgICAgICAgICAnc3VibWl0JyxcbiAgVE9VQ0hfRU5EOiAgICAgICAgICAgICAgICAgICAgICAndG91Y2hlbmQnLFxuICBUT1VDSF9TVEFSVDogICAgICAgICAgICAgICAgICAgICd0b3VjaHN0YXJ0JyxcbiAgVFJBTlNJVElPTkVORDogICAgICAgICAgICAgICAgICAndHJhbnNpdGlvbmVuZCcsXG4gIFVQREFURV9QT1NUX0NPVU5UOiAgICAgICAgICAgICAgJ3VwZGF0ZXBvc3Rjb3VudCcsXG4gIFVQREFURV9JTl9WSUVXUE9SVF9NT0RVTEVTOiAgICAgJ3VwZGF0ZWludmlld3BvcnRtb2R1bGVzJyxcbiAgVVBEQVRFX1NFQVJDSF9XSVRIX05FV19JVEVNUzogICAndXBkYXRlc2VhcmNod2l0aG5ld2l0ZW1zJyxcbiAgVVBEQVRFX1NFVFRJTkdTOiAgICAgICAgICAgICAgICAndXBkYXRlc2V0dGluZ3MnLFxuICBXSEVFTDogICAgICAgICAgICAgICAgICAgICAgICAgICd3aGVlbCdcbn07XG4iLCJleHBvcnQgeyBBUklBIH0gZnJvbSAnLi9hcmlhJztcbmV4cG9ydCB7IENMQVNTX05BTUVTIH0gZnJvbSAnLi9jbGFzcy1uYW1lcyc7XG5leHBvcnQgeyBFTkRQT0lOVFMgfSBmcm9tICcuL2VuZHBvaW50cyc7XG5leHBvcnQgeyBFUlJPUlMgfSBmcm9tICcuL2Vycm9ycyc7XG5leHBvcnQgeyBFVkVOVFMgfSBmcm9tICcuL2V2ZW50cyc7XG5leHBvcnQgeyBNSVNDIH0gZnJvbSAnLi9taXNjJztcbmV4cG9ydCB7IEtFWV9DT0RFU30gZnJvbSAnLi9rZXktY29kZXMnO1xuZXhwb3J0IHsgU0VMRUNUT1JTIH0gZnJvbSAnLi9zZWxlY3RvcnMnO1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEtFWSBDT0RFU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBLRVlfQ09ERVMgPSB7XG4gIEVTQ0FQRTogMjcsXG4gIEVOVEVSOiAxMyxcbiAgU1BBQ0VCQVI6IDMyXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJE1JU0MgU1RSSU5HU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IE1JU0MgPSB7XG4gIEJBTk5FUl9DT09LSUU6ICAgICAgICAgICAgICAgICAgICAgICdiYW5uZXJfdmlld2VkJyxcbiAgQkFOTkVSX0NPT0tJRV9WSUVXRUQ6ICAgICAgICAgICAgICAgJ3ZpZXdlZCcsXG4gIEJVVFRPTl9TVUJNSVRURUQ6ICAgICAgICAgICAgICAgICAgICdUaGFuayBZb3UnLFxuICBCVVRUT05fUFJPQ0VTU0lORzogICAgICAgICAgICAgICAgICAnV29ya2luZycsXG4gIEJFRk9SRUVORDogICAgICAgICAgICAgICAgICAgICAgICAgICdiZWZvcmVlbmQnLFxuICBDSEFOR0U6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQ2hhbmdlICcsXG4gIERBVEFfVklTSUJMRTogICAgICAgICAgICAgICAgICAgICAgICdkYXRhLXZpc2libGUnLFxuICBESVNBQkxFRDogICAgICAgICAgICAgICAgICAgICAgICAgICAnZGlzYWJsZWQnLFxuICBmVVJMMTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLy93d3cuZmFjZWJvb2suY29tL3NoYXJlci5waHA/dT0nLFxuICBMQVJHRTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMDI0LFxuICBNRURJVU06ICAgICAgICAgICAgICAgICAgICAgICAgICAgICA2NDAsXG4gIG1VUkwxOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtYWlsdG86JyxcbiAgbVVSTDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJz9zdWJqZWN0PScsXG4gIG1VUkwzOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcmYm9keT0nLFxuICB0VVJMMTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT91cmw9JyxcbiAgdFVSTFRleHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgJyZ0ZXh0PScsXG4gIHRVUkxWaWE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICcmdmlhPVRoZURlbW9jcmF0cycsXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkU0VMRUNUT1JTIC0gQ1NTIHNlbGVjdG9ycyBPTkxZXG4vLyAtICB0YWcgbmFtZXMsICNpZHMsIC5jbGFzc25hbWVzLCBbYXR0cmlidXRlc10sIGV0Y1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IFNFTEVDVE9SUyA9IHtcbiAgQUxMOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnI2FsbCcsXG4gIEFOQ0hPUjogICAgICAgICAgICAgICAgICAgICAgICAgJ2EnLFxuICBBTkNIT1JfV0lUSF9IUkVGOiAgICAgICAgICAgICAgICdhW2hyZWZdJyxcbiAgQVBJX1JFU1VMVFM6ICAgICAgICAgICAgICAgICAgICAnW2RhdGEtbG9hZGNvbXBvbmVudD1cIkFQSVJlc3VsdHNcIl0nLFxuICBCQUNLR1JPVU5EOiAgICAgICAgICAgICAgICAgICAgICcuYmFja2dyb3VuZCcsXG4gIEJBTk5FUl9UUklHR0VSOiAgICAgICAgICAgICAgICAgJy5iYW5uZXItY2xvc2UnLFxuICBCVVRUT046ICAgICAgICAgICAgICAgICAgICAgICAgICdidXR0b24nLFxuICBDSEVDS0VEOiAgICAgICAgICAgICAgICAgICAgICAgICc6Y2hlY2tlZCcsXG4gIENIRUNLRURfTEFCRUw6ICAgICAgICAgICAgICAgICAgJzpjaGVja2VkICsgbGFiZWwnLFxuICBDSEVDS0JPWDogICAgICAgICAgICAgICAgICAgICAgICdjaGVja2JveCcsXG4gIENIRVZST05fU1RSSVBFOiAgICAgICAgICAgICAgICAgJy5jaGV2cm9uLXN0cmlwZScsXG4gIENMT1NFOiAgICAgICAgICAgICAgICAgICAgICAgICAgJy5jbG9zZScsXG4gIENMT1NFX1NFQVJDSDogICAgICAgICAgICAgICAgICAgJy5jbG9zZS1zZWFyY2gnLFxuICBEQVRBX0JPVFRPTTogICAgICAgICAgICAgICAgICAgICdkYXRhLWJvdHRvbXBvc2l0aW9uJyxcbiAgREFUQV9IQUxGV0FZOiAgICAgICAgICAgICAgICAgICAnZGF0YS1oYWxmd2F5JyxcbiAgREFUQV9IQVNfQU5JTUFURUQ6ICAgICAgICAgICAgICAnZGF0YS1oYXMtYW5pbWF0ZWQnLFxuICBEQVRBX0xBWllfTE9BRDogICAgICAgICAgICAgICAgICdkYXRhLWxhenlsb2FkJyxcbiAgREFUQV9QT1NJVElPTjogICAgICAgICAgICAgICAgICAnZGF0YS1wb3NpdGlvbicsXG4gIERBVEFfVklTSUJMRTogICAgICAgICAgICAgICAgICAgJ1tkYXRhLXZpc2libGVdJyxcbiAgRElWOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGl2JyxcbiAgRFJPUERPV046ICAgICAgICAgICAgICAgICAgICAgICAnLmRyb3Bkb3duJyxcbiAgRFJPUERPV05fQ09OVEVOVDogICAgICAgICAgICAgICAnLmRyb3Bkb3duX19jb250ZW50JyxcbiAgRFJPUERPV05fVE9HR0xFOiAgICAgICAgICAgICAgICAnLmRyb3Bkb3duX190b2dnbGUnLFxuICBEUk9QRE9XTl9UT0dHTEVfQ0xJQ0s6ICAgICAgICAgICcuZHJvcGRvd24uY2xpY2snLFxuICBEUk9QRE9XTl9UT0dHTEVfSE9WRVI6ICAgICAgICAgICcuZHJvcGRvd24uaG92ZXInLFxuICBFTUFJTDogICAgICAgICAgICAgICAgICAgICAgICAgICcuc2hhcmUtLWVtYWlsJyxcbiAgRkFDRUJPT0s6ICAgICAgICAgICAgICAgICAgICAgICAnLnNoYXJlLS1mYicsXG4gIEZFQVRVUkVEVklERU86ICAgICAgICAgICAgICAgICAgJy5mZWF0dXJlZC12aWRlbyB2aWRlbycsXG4gIEZJTEVfSU5QVVQ6ICAgICAgICAgICAgICAgICAgICAgJ2lucHV0W3R5cGU9ZmlsZV0nLFxuICBGSUxURVI6ICAgICAgICAgICAgICAgICAgICAgICAgICcuZmlsdGVyJyxcbiAgRklMVEVSX0NIT0lDRTogICAgICAgICAgICAgICAgICAnLmZpbHRlci1jaG9pY2UnLFxuICBGSUxURVJfT1BUSU9OOiAgICAgICAgICAgICAgICAgICcuZmlsdGVyLW9wdGlvbicsXG4gIEZJTFRFUl9UUklHR0VSOiAgICAgICAgICAgICAgICAgJy5maWx0ZXItdHJpZ2dlcicsXG4gIEZPUk06ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zvcm0nLFxuICBGT1JNX0ZJRUxEUzogICAgICAgICAgICAgICAgICAgICdpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYScsXG4gIEhUTUw6ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2h0bWwnLFxuICBJTlZBTElEOiAgICAgICAgICAgICAgICAgICAgICAgICc6aW52YWxpZCcsXG4gIExBTkRJTkdfUEFHRV9USVRMRTogICAgICAgICAgICAgJy5sYW5kaW5nLXBhZ2UtaGVhZGVyX190aXRsZScsXG4gIExJTktFRElOOiAgICAgICAgICAgICAgICAgICAgICAgJy5zaGFyZS0tbGknLFxuICBMT0FESU5HOiAgICAgICAgICAgICAgICAgICAgICAgICcubG9hZGluZycsXG4gIExPQURfTU9SRTogICAgICAgICAgICAgICAgICAgICAgJy5sb2FkLW1vcmUnLFxuICBOQVY6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICcucHJpbWFyeS1uYXYnLFxuICBOQVZfVFJJR0dFUjogICAgICAgICAgICAgICAgICAgICcubmF2LXRyaWdnZXInLFxuICBORVNURUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICcubmVzdGVkJyxcbiAgT0dERVNDOiAgICAgICAgICAgICAgICAgICAgICAgICAnbWV0YVtwcm9wZXJ0eT1cIm9nOmRlc2NyaXB0aW9uXCJdJyxcbiAgT0dUSVRMRTogICAgICAgICAgICAgICAgICAgICAgICAnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJyxcbiAgT0dVUkw6ICAgICAgICAgICAgICAgICAgICAgICAgICAnbWV0YVtwcm9wZXJ0eT1cIm9nOnVybFwiXScsXG4gIE9QRU5fU0VBUkNIOiAgICAgICAgICAgICAgICAgICAgJy5vcGVuLXNlYXJjaCcsXG4gIE9QVEdST1VQOiAgICAgICAgICAgICAgICAgICAgICAgJ29wdGdyb3VwJyxcbiAgUEFSQUdSQVBIOiAgICAgICAgICAgICAgICAgICAgICAncCcsXG4gIFBMQVlFUjogICAgICAgICAgICAgICAgICAgICAgICAgJy5wbGF5ZXInLFxuICBQTEFZX1RSSUdHRVI6ICAgICAgICAgICAgICAgICAgICcudmlkZW9fX3BsYXktdHJpZ2dlcicsXG4gIFBPU1RfQ09VTlQ6ICAgICAgICAgICAgICAgICAgICAgJy5wb3N0LWNvdW50IC5jb3VudCcsXG4gIFBPU1RfTElTVElORzogICAgICAgICAgICAgICAgICAgJy5wb3N0LWxpc3RpbmcnLFxuICBSRVNVTFRTX0NPTlRBSU5FUjogICAgICAgICAgICAgICcucmVzdWx0cy1jb250YWluZXInLFxuICBTRUNPTkRBUllfQkxPR19MSVNUSU5HOiAgICAgICAgICcuc2Vjb25kYXJ5LWJsb2ctbGlzdGluZycsXG4gIFNFQVJDSF9JTlBVVDogICAgICAgICAgICAgICAgICAgJy5zZWFyY2gtZmllbGRfX2lucHV0JyxcbiAgU0VMRUNURUQ6ICAgICAgICAgICAgICAgICAgICAgICAnLnNlbGVjdGVkJyxcbiAgU0lURV9OQVY6ICAgICAgICAgICAgICAgICAgICAgICAnLm5hdmlnYXRpb24nLFxuICBTVEFUSVNUSUNfVkFMVUU6ICAgICAgICAgICAgICAgICcuc3RhdGlzdGljX192YWx1ZScsXG4gIFNVQk1JVDogICAgICAgICAgICAgICAgICAgICAgICAgJ1t0eXBlPVwic3VibWl0XCJdJyxcbiAgU1ZHX0JHX0NPTlRBSU5FUjogICAgICAgICAgICAgICAnLnN2Zy1iYWNrZ3JvdW5kJyxcbiAgVEFCOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnW3JvbGU9XCJ0YWJcIl0nLFxuICBUQUJQQU5FTDogICAgICAgICAgICAgICAgICAgICAgICdbcm9sZT1cInRhYnBhbmVsXCJdJyxcbiAgVFdJVFRFUjogICAgICAgICAgICAgICAgICAgICAgICAnLnNoYXJlLS10dycsXG59O1xuIiwiLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gKiBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gKiBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAqIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZ1bmMgQSBmdW5jdGlvbiB0byBjYWxsIGFmdGVyIE4gbWlsbGlzZWNvbmRzXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdFxuICogQHBhcmFtICB7Ym9vbGVhbn0gaW1tZWRpYXRlIFRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmdcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdCBiZSB0cmlnZ2VyZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICBsZXQgdGltZW91dDtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgY29udGV4dCA9IHRoaXM7XG4gICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgY29uc3QgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICBpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgaWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gIH07XG59XG5cbiIsIi8qKlxuICogUmV0dXJucyB0aGUgY29va2llIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmRcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgb2YgdGhlIGNvb2tpZSB0byBmaW5kXG4gKiBAcmV0dXJuIHtPYmplY3R9IGNvb2tpZSBiYXNlZCBvbiBuYW1lIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Y29va2llKG5hbWUpIHtcbiAgY29uc3QgY29va2llcyA9IHt9XG4gIGNvbnN0IGNvb2tpZVNldCA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOyAnKTtcbiAgY29va2llU2V0LmZvckVhY2goY29va2llID0+IGNvb2tpZXNbY29va2llLnNwbGl0KCc9JylbMF1dID0gY29va2llLnNwbGl0KCc9JylbMV0pO1xuXG4gIHJldHVybiBjb29raWVzW25hbWVdO1xufTsiLCIvLyBleHBvcnQgeyBjbG9zZXN0IH0gZnJvbSAnLi9jbG9zZXN0LmpzJztcbi8vIGV4cG9ydCB7IGNyZWF0ZWxvYWRlciB9IGZyb20gJy4vbG9hZGVyJztcbi8vIGV4cG9ydCB7IGNvbnZlcnRkYXRlIH0gZnJvbSAnLi9jb252ZXJ0ZGF0ZS5qcyc7XG5leHBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4vZGVib3VuY2UnO1xuZXhwb3J0IHsgZ2V0Y29va2llIH0gZnJvbSAnLi9nZXRjb29raWUnO1xuLy8gZXhwb3J0IHsgaGFzaG92ZXIgfSBmcm9tICcuL2hhc2hvdmVyJztcbi8vIGV4cG9ydCB7IGhleHRvcmdiIH0gZnJvbSAnLi9oZXh0b3JnYic7XG4vLyBleHBvcnQgeyBpbnRlcnBvbGF0ZW51bWJlcnMgfSBmcm9tICcuL2ludGVycG9sYXRlbnVtYmVycyc7XG4vLyBleHBvcnQgeyBpc29iamVjdGVtcHR5IH0gZnJvbSAnLi9pc29iamVjdGVtcHR5JztcbmV4cG9ydCB7IGlzc2Nyb2xsZWRpbnRvdmlldyB9IGZyb20gJy4vaXNzY3JvbGxlZGludG92aWV3Jztcbi8vIGV4cG9ydCB7IE1lc3NhZ2VCdXMgfSBmcm9tICcuL21lc3NhZ2VidXMnO1xuZXhwb3J0IHsgb3BlbnBvcHVwIH0gZnJvbSAnLi9vcGVucG9wdXAnO1xuLy8gZXhwb3J0IHsgcmVtb3ZlbG9hZGVyIH0gZnJvbSAnLi9sb2FkZXInO1xuZXhwb3J0IHsgcmFuZG9tc2VjdXJlc3RyaW5nIH0gZnJvbSAnLi9yYW5kb21zZWN1cmVzdHJpbmcnO1xuZXhwb3J0IHsgc2Nyb2xsdG8gfSBmcm9tICcuL3Njcm9sbHRvJztcbiIsIi8qKlxuICogQSBmdW5jdGlvbiB3aGljaCBtZWFzdXJlcyB0aGUgZWxlbWVudHMgcG9zaXRpb24gb24gdGhlIHBhZ2UgaW5cbiAqIHJlbGF0aW9uIHRvIHRoZSB3aGF0IHRoZSB1c2VyIGNhbiBjdXJyZW50bHkgc2VlIG9uIHRoZWlyIHNjcmVlblxuICogYW5kIHJldHVybnMgYSBib29sZWFuIHZhbHVlIHdpdGggYHRydWVgIGJlaW5nIHRoYXQgdGhlIGVsZW1lbnRcbiAqIGlzIHZpc2libGUgYW5kIGBmYWxzZWAgYmVpbmcgdGhhdCBpdCBpcyBub3QgdmlzaWJsZS5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9ICBlbGVtIEEgRE9NIGVsZW1lbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGlzVmlzaWJsZSBBIGJvb2xlYW4gdmFsdWUgd2l0aCBgdHJ1ZWAgcmVwcmVzZW50aW5nIHRoYXQgdGhlIGVsZW1lbnQgaXMgdmlzaWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNzY3JvbGxlZGludG92aWV3KGVsZW0pIHtcbiAgY29uc3QgZWxlbWVudEJvdW5kcyA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiBlbGVtZW50Qm91bmRzLnRvcCA8IHdpbmRvdy5pbm5lckhlaWdodCAmJiBlbGVtZW50Qm91bmRzLmJvdHRvbSA+PSAwO1xufVxuXG4iLCIvKipcbiAqIEEgZnVuY3Rpb24gd2hpY2ggb3BlbnMgYSBwb3B1cCB3aW5kb3dcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHVybCB0aGUgdXJsIHRvIG9wZW4gaW4gdGhlIHBvcHVwXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHdpbmRvd05hbWUgYSB1bmlxdWUgbmFtZSBmb3IgdGhlIHBvcHVwXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSB3IHRoZSBkZXNpcmVkIHdpZHRoIG9mIHRoZSBwb3B1cFxuICogQHBhcmFtICB7SW50ZWdlcn0gaCB0aGUgZGVzaXJlZCBoZWlnaHQgb2YgdGhlIHBvcHVwXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFuIG9iamVjdCB0aGUgcG9wdXAgZnVuY3Rpb24gaXMgYm91bmQgdG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5wb3B1cCh1cmwsIHdpbmRvd05hbWUsIHcsIGgpIHtcbiAgcmV0dXJuIHdpbmRvdy5vcGVuKHVybCwgd2luZG93TmFtZSxcbiAgICAnbWVudWJhcj1ubyxzdGF0dXM9bm8sdG9vbGJhcj1ubyxsb2NhdGlvbj15ZXMscmVzaXphYmxlPXllcyxzY3JvbGxiYXJzPXllcyxzdGF0dXM9bm8sd2lkdGg9JyArIHcgKyAnLGhlaWdodD0nICsgaCArICcnXG4gICk7XG59XG4iLCIvKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIGxlbmd0aCBhbmRcbiAqIHJldHVybnMgYSByYW5kb20gc3RyaW5nXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBsZW5ndGggb2YgdGhlIHJhbmRvbSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gcmFuZG9tIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tc2VjdXJlc3RyaW5nKGxlbmd0aCkge1xuICBsZXQgdGV4dCA9ICcnO1xuICBjb25zdCBwb3NzaWJsZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB0ZXh0ICs9IHBvc3NpYmxlLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZS5sZW5ndGgpKTtcbiAgfVxuICByZXR1cm4gdGV4dDtcbn0iLCIvKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBzY3JvbGxzIHRvIGEgdGFyZ2V0IG9uIHBhZ2VcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IGV2ZW50XG4gKiBAcGFyYW0gIHtIVE1MTm9kZX0gZWxlbWVudFxuICogQHBhcmFtICB7SW50ZWdlcn0gb2Zmc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY3JvbGx0byhldmVudCwgZWxlbWVudCwgb2Zmc2V0ID0gMCkge1xuICBjb25zdCBoYXNoID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5jaGFyQXQoMCkgPT09ICcjJyA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdocmVmJykgOiB1bmRlZmluZWQ7XG5cbiAgaWYgKGhhc2ggJiYgd2luZG93LnNjcm9sbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgJHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaGFzaCk7XG4gICAgY29uc3QgdGFyZ2V0WSA9ICR0YXJnZXQub2Zmc2V0VG9wIC0gb2Zmc2V0O1xuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHdpbmRvdy5zY3JvbGxUbyh7XG4gICAgICB0b3A6IHRhcmdldFksXG4gICAgICBiZWhhdmlvcjogJ3Ntb290aCdcbiAgICB9KTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBFVkVOVFMgfSBmcm9tICcuLi8uLi9Db25zdGFudHMnO1xuXG4vKipcbiAqIElEXG4gKlxuICogQHR5cGUge051bWJlcn1cbiAqIEBpZ25vcmVcbiAqL1xubGV0IGlkID0gMDtcblxuLyoqXG4gKiBHZXQgSURcbiAqXG4gKiBCZWNhdXNlIGZpbGUgaXMgbG9hZGVkIG9ubHkgb25jZSwgdGhpcyBmdW5jdGlvblxuICogY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZXZlcnkgdGltZVxuICogaXQgaXMgY2FsbGVkLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVW5pcXVlIElEIHZhbHVlXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIGdldElkKCkge1xuICByZXR1cm4gaWQrKztcbn1cblxuLyoqXG4gKiBDbGljayBTZXJ2aWNlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWNrU2VydmljZSB7XG4gIC8qKlxuICAgKiBDbGljayBTZXJ2aWNlIGNvbnN0cnVjdG9yIGluIHdoaWNoIHRoZSBgY2FsbGJhY2tzYCBhcnJheSBpcyBjcmVhdGVkXG4gICAqIGFzIGEgcHJvcGVydHkgb2YgdGhlIGNsYXNzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvKipcbiAgICAgICAqIEFuIGFycmF5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIG9uIENsaWNrXG4gICAgICAgKlxuICAgICAgICogQHByb3BlcnR5IHtBcnJheX0gY2FsbGJhY2tzXG4gICAgICAgKi9cbiAgICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG5cbiAgICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICogQGRlc2MgSW5pdGlhbGl6ZSB0aGUgc2luZ2xldG9uIGJ5IGF0dGFjaGluZyB0aGUgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIHdpbmRvd1xuICAqIEBsaXN0ZW5zIHtFdmVudH0gbGlzdGVucyB0byB0aGUgd2luZG93IENsaWNrIGV2ZW50XG4gICovXG4gIGluaXQoKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuQ0xJQ0ssIHRoaXMub25DbGljay5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAqIEBkZXNjIFRoZSBjbGljayBldmVudCBoYW5kbGVyLiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCBpbnZva2VzIGVhY2ggY2FsbGJhY2sgaW4gdGhlIEFycmF5XG4gICogQHBhcmFtICB7RXZlbnR9IGV2ZW50IHRoZSBldmVudCBvYmplY3RcbiAgKi9cbiAgb25DbGljayhldmVudCkge1xuICAgICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2suaXNFbGVtZW50TWF0Y2gpIHtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gY2FsbGJhY2sudGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEEgaG9vayBmb3IgcHVzaGluZyBhIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIGludG8gdGhlIGBjYWxsYmFja3NgIGFycmF5LiBBIHVuaXF1ZVxuICAgKiBJRCB2YWx1ZSBmb3IgdGhlIGNhbGxiYWNrIGlzIGdlbmVyYXRlZFxuICAgKiBhbmQgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBmb3IgcmVtb3ZpbmdcbiAgICogdGhlIGNhbGxiYWNrIGlmIG5lZWQgYmUuXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgQSByZWZlcmVuY2UgdG8gdGhlIERPTSBlbGVtZW50IHRoYXQgdHJpZ2dlcnMgdGhlIGV2ZW50XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gaW52b2tlIGJ5IHRoZSBDbGlja1NlcnZpY2VcbiAgICogQHBhcmFtIHtCb29sZWFufSBpc0VsZW1lbnRNYXRjaCBBIGZsYWcgdXNlZCB0byBpbnZlcnQgdGhlIGNvbmRpdGlvbmFsIGNoZWNrIGZvciBmaXJpbmcgdGhlIGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBgcmVtb3ZlQ2FsbGJhY2tgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCByZW1vdmUgYW4gZW50cnkgZnJvbSB0aGUgYGNhbGxiYWNrc2AgYXJyYXlcbiAgICovXG4gIGFkZENhbGxiYWNrKGVsZW1lbnQsIGNhbGxiYWNrLCBpc0VsZW1lbnRNYXRjaCkge1xuICAgIC8vIEdlbmVyYXRlIGFuIGlkIGZvciB0aGUgY2FsbGJhY2tcbiAgICBjb25zdCBpZCA9IGdldElkKCk7XG4gICAgLy8gbW9kdWxlIGNhbid0IGJlIHVuZGVmaW5lZCBiZWNhdXNlIGl0J3MgYXMgaW4gaWRlbnRpZmllciBmb3IgdGhlIGNhbGxiYWNrcyBhcnJheS5cbiAgICBjb25zdCBtb2R1bGUgPSBlbGVtZW50LmRhdGFzZXQgJiYgZWxlbWVudC5kYXRhc2V0LmxvYWRtb2R1bGUgPyBlbGVtZW50LmRhdGFzZXQubG9hZG1vZHVsZSA6IGVsZW1lbnQ7XG4gICAgbGV0IGZsYWcgPSBmYWxzZTtcbiAgICBjb25zdCB0YXJnZXRFbGVtZW50ID0gZWxlbWVudDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmNhbGxiYWNrc1tpXS5tb2R1bGUgPT09IG1vZHVsZSkge1xuICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWZsYWcpIHtcbiAgICAgIC8vIFB1c2ggZnVuY3Rpb24gaW50byBhcnJheSB3aXRoIGEgdW5pcXVlIGlkXG4gICAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKHtcbiAgICAgICAgbW9kdWxlLFxuICAgICAgICBpZCxcbiAgICAgICAgdGFyZ2V0RWxlbWVudCxcbiAgICAgICAgaXNFbGVtZW50TWF0Y2gsXG4gICAgICAgIGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIHJlbW92ZSBmdW5jdGlvblxuICAgIHJldHVybiB0aGlzLnJlbW92ZUNhbGxiYWNrLmJpbmQodGhpcywgaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlcnMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgcmVtb3Zlc1xuICAgKiB0aGUgZW50cnkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaWQgcGFzc2VkXG4gICAqIGluIGFzIGFuIGFyZ3VtZW50XG4gICAqXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgQW4gaWQgdmFsdWUgdG8gZmlsdGVyIGJ5XG4gICAqL1xuICByZW1vdmVDYWxsYmFjayhpZCkge1xuICAgIHRoaXMuY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3MuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS5pZCAhPT0gaWQ7XG4gICAgfSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZGVib3VuY2UgfSBmcm9tICcuLi8uLi9VdGlscyc7XG5pbXBvcnQgeyBFVkVOVFMgfSBmcm9tICcuLi8uLi9Db25zdGFudHMnO1xuXG4vKipcbiAqIElEXG4gKlxuICogQHR5cGUge051bWJlcn1cbiAqIEBpZ25vcmVcbiAqL1xubGV0IGlkID0gMDtcblxuLyoqXG4gKiBHZXQgSURcbiAqXG4gKiBCZWNhdXNlIGZpbGUgaXMgbG9hZGVkIG9ubHkgb25jZSwgdGhpcyBmdW5jdGlvblxuICogY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZXZlcnkgdGltZVxuICogaXQgaXMgY2FsbGVkLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVW5pcXVlIElEIHZhbHVlXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIGdldElkKCkge1xuICByZXR1cm4gaWQrKztcbn1cblxuLyoqXG4gKiBSZXNpemUgU2VydmljZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXNpemVTZXJ2aWNlIHtcbiAgLyoqXG4gICAqIFJlc2l6ZVNlcnZpY2UgY29uc3RydWN0b3IgaW4gd2hpY2ggdGhlIGBjYWxsYmFja3NgIGFycmF5IGlzIGNyZWF0ZWRcbiAgICogYXMgYSBwcm9wZXJ0eSBvZiB0aGUgY2xhc3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBjYWxsYmFjayBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCBvbiByZXNpemVcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXl9IGNhbGxiYWNrc1xuICAgICAqL1xuICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG5cbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBJbml0aWFsaXplIHRoZSBzaW5nbGV0b24gYnkgYXR0YWNoaW5nIHRoZSBldmVudCBsaXN0ZW5lciB0byB0aGUgd2luZG93XG4gICAqIEBsaXN0ZW5zIHtFdmVudH0gbGlzdGVucyB0byB0aGUgd2luZG93IHJlc2l6ZSBldmVudFxuICAgKi9cbiAgaW5pdCgpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuUkVTSVpFLCBkZWJvdW5jZSh0aGlzLm9uUmVzaXplLmJpbmQodGhpcyksIDEwKSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgVGhlIHJlc2l6ZSBldmVudCBoYW5kbGVyLiBJdGVydGF0ZXMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgaW52b2tlcyBlYWNoIGNhbGxiYWNrIGluIHRoZSBBcnJheVxuICAgKi9cbiAgb25SZXNpemUoKSB7XG4gICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcbiAgICAgIGNhbGxiYWNrLmNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgQSBob29rIGZvciBwdXNoaW5nIGEgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogaW50byB0aGUgYGNhbGxiYWNrc2AgYXJyYXkuIEEgdW5pcXVlXG4gICAqIElEIHZhbHVlIGZvciB0aGUgY2FsbGJhY2sgaXMgZ2VuZXJhdGVkXG4gICAqIGFuZCBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGZvciByZW1vdmluZ1xuICAgKiB0aGUgY2FsbGJhY2sgaWYgbmVlZCBiZS5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBpbnZva2UgYnkgdGhlIFJlc2l6ZVNlcnZpY2VcbiAgICogQHJldHVybiB7RnVuY3Rpb259IGByZW1vdmVDYWxsYmFja2AgQSBmdW5jdGlvbiB3aGljaCB3aWxsIHJlbW92ZSBhbiBlbnRyeSBmcm9tIHRoZSBgY2FsbGJhY2tzYCBhcnJheVxuICAgKi9cbiAgYWRkQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAvLyBHZW5lcmF0ZSBhbiBpZCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgY29uc3QgaWQgPSBnZXRJZCgpO1xuXG4gICAgLy8gUHVzaCBmdW5jdGlvbiBpbnRvIGFycmF5IHdpdGggYSB1bmlxdWUgaWRcbiAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKHtcbiAgICAgIGlkLFxuICAgICAgY2FsbGJhY2tcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiB0aGUgcmVtb3ZlIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2FsbGJhY2suYmluZCh0aGlzLCBpZCk7XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVycyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCByZW1vdmVzXG4gICAqIHRoZSBlbnRyeSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpZCBwYXNzZWRcbiAgICogaW4gYXMgYW4gYXJndW1lbnRcbiAgICpcbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBBbiBpZCB2YWx1ZSB0byBmaWx0ZXIgYnlcbiAgICovXG4gIHJlbW92ZUNhbGxiYWNrKGlkKSB7XG4gICAgdGhpcy5jYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrcy5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgIHJldHVybiBpdGVtLmlkICE9PSBpZDtcbiAgICB9KTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4uLy4uL1V0aWxzJztcbmltcG9ydCB7IEVWRU5UUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5cbi8qKlxuICogSURcbiAqXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGlnbm9yZVxuICovXG5sZXQgaWQgPSAwO1xuXG4vKipcbiAqIEdldCBJRFxuICpcbiAqIEJlY2F1c2UgZmlsZSBpcyBsb2FkZWQgb25seSBvbmNlLCB0aGlzIGZ1bmN0aW9uXG4gKiBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBldmVyeSB0aW1lXG4gKiBpdCBpcyBjYWxsZWQuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBVbmlxdWUgSUQgdmFsdWVcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG4vKipcbiAqIFNjcm9sbCBTZXJ2aWNlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjcm9sbFNlcnZpY2Uge1xuICAvKipcbiAgICogU2Nyb2xsIFNlcnZpY2UgY29uc3RydWN0b3IgaW4gd2hpY2ggdGhlIGBjYWxsYmFja3NgIGFycmF5IGlzIGNyZWF0ZWRcbiAgICogYXMgYSBwcm9wZXJ0eSBvZiB0aGUgY2xhc3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBjYWxsYmFjayBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCBvbiBzY3JvbGxcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXl9IGNhbGxiYWNrc1xuICAgICAqL1xuICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgdXNlciBiYXNlZCBvbiBzY3JvbGwsIHZlcnRpY2FsbHlcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBwb3NpdGlvblxuICAgICAqL1xuICAgIHRoaXMuc2Nyb2xsWSA9IDA7XG5cbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBJbml0aWFsaXplIHRoZSBzaW5nbGV0b24gYnkgYXR0YWNoaW5nIHRoZSBldmVudCBsaXN0ZW5lciB0byB0aGUgd2luZG93XG4gICAqIEBsaXN0ZW5zIHtFdmVudH0gbGlzdGVucyB0byB0aGUgd2luZG93IHNjcm9sbCBldmVudFxuICAgKi9cbiAgaW5pdCgpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuU0NST0xMLCBkZWJvdW5jZSh0aGlzLm9uU2Nyb2xsLmJpbmQodGhpcyksIDEwKSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgVGhlIHNjcm9sbCBldmVudCBoYW5kbGVyLiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCBpbnZva2VzIGVhY2ggY2FsbGJhY2sgaW4gdGhlIEFycmF5XG4gICAqL1xuICBvblNjcm9sbCgpIHtcbiAgICB0aGlzLnNjcm9sbFkgPSB3aW5kb3cuc2Nyb2xsWTtcbiAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgY2FsbGJhY2suY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBBIGhvb2sgZm9yIHB1c2hpbmcgYSBjYWxsYmFjayBmdW5jdGlvbiBpbnRvIHRoZSBgY2FsbGJhY2tzYCBhcnJheS4gQSB1bmlxdWVcbiAgICogSUQgdmFsdWUgZm9yIHRoZSBjYWxsYmFjayBpcyBnZW5lcmF0ZWQgYW5kIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgZm9yIHJlbW92aW5nXG4gICAqIHRoZSBjYWxsYmFjayBpZiBuZWVkIGJlLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGludm9rZSBieSB0aGUgU2Nyb2xsU2VydmljZVxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYHJlbW92ZUNhbGxiYWNrYCBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgcmVtb3ZlIGFuIGVudHJ5IGZyb20gdGhlIGBjYWxsYmFja3NgIGFycmF5XG4gICAqL1xuICBhZGRDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIC8vIEdlbmVyYXRlIGFuIGlkIGZvciB0aGUgY2FsbGJhY2tcbiAgICBjb25zdCBpZCA9IGdldElkKCk7XG5cbiAgICAvLyBQdXNoIGZ1bmN0aW9uIGludG8gYXJyYXkgd2l0aCBhIHVuaXF1ZSBpZFxuICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goe1xuICAgICAgaWQsXG4gICAgICBjYWxsYmFja1xuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIHRoZSByZW1vdmUgZnVuY3Rpb25cbiAgICByZXR1cm4gdGhpcy5yZW1vdmVDYWxsYmFjay5iaW5kKHRoaXMsIGlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIHJlbW92ZXNcbiAgICogdGhlIGVudHJ5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGlkIHBhc3NlZFxuICAgKiBpbiBhcyBhbiBhcmd1bWVudFxuICAgKlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIEFuIGlkIHZhbHVlIHRvIGZpbHRlciBieVxuICAgKi9cbiAgcmVtb3ZlQ2FsbGJhY2soaWQpIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0uaWQgIT09IGlkO1xuICAgIH0pO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEltcG9ydCBzZXJ2aWNlc1xuaW1wb3J0IENsaWNrU2VydmljZSBmcm9tICcuL0NsaWNrU2VydmljZSc7XG5pbXBvcnQgUmVzaXplU2VydmljZSBmcm9tICcuL1Jlc2l6ZVNlcnZpY2UnO1xuaW1wb3J0IFNjcm9sbFNlcnZpY2UgZnJvbSAnLi9TY3JvbGxTZXJ2aWNlJztcblxuLyoqXG4gKiBBIHNpbmdsZXRvbiB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBpbmRpdmlkdWFsIHNlcnZpY2VzLlxuICpcbiAqIEFueSBzZXJ2aWNlIHNpbmdsZXRvbiBzZXJ2aWNlIHRoYXQgbmVlZHMgdG8gYmUgaW5zdGFudGlhdGVkXG4gKiBzaG91bGQgYmUgZG9uZSBzbyBpbiB0aGUgU2VydmljZXMgY2xhc3MuXG4gKlxuICogU2VydmljZXMgc2hvdWxkIG5vdCBpbnRlcmFjdCB3aXRoIHRoZSBET00sIHRoYXQgc2hvdWxkIGJlXG4gKiBsZWZ0IHRvIHRoZSBWaWV3cy4gU2VydmljZXMgY2FuIHNpbXBseSBiZSB1c2VkIHRvIGNvbnNvbGlkYXRlXG4gKiBhbiBleHBlbnNpdmUgZXZlbnQgbGlzdGVuZXIgKCdzY3JvbGwnLCAncmVzaXplJywgZXRjKS4gb3JcbiAqIHRyYWNrIHN0YXRlIChsaWtlIHdoaWNoIG1vZGFsIGlzIG9wZW4gYXQgd2hpY2ggdGltZSkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlcnZpY2VzIHtcbiAgLyoqXG4gICAqIFNlcnZpY2VzIGNvbnN0cnVjdG9yIHRoYXQgaW5zdGFudGlhdGVzIGVhY2ggc2VydmljZSBpbmRpdmlkdWFsbHkuXG4gICAqIFRvIGFkZCBhbm90aGVyIHNlcnZpY2VzIGluc3RpYXRlIGl0IGhlcmUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvKipcbiAgICAgKiBBIHNlcnZpY2Ugd2hpY2ggbGlzdGVucyB0byB0aGUgYHdpbmRvd2AgY2xpY2sgZXZlbnQgYW5kXG4gICAgICogaW52b2tlcyBhbiBhcnJheSBvZiBjYWxsYmFja3NcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBDbGlja1NlcnZpY2UgQSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIENsaWNrU2VydmljZSBjbGFzc1xuICAgICAqL1xuICAgIHRoaXMuQ2xpY2tTZXJ2aWNlID0gbmV3IENsaWNrU2VydmljZSgpO1xuXG4gICAgLyoqXG4gICAgICogQSBzZXJ2aWNlIHdoaWNoIGxpc3RlbnMgdG8gdGhlIGB3aW5kb3dgIHJlc2l6ZSBldmVudCBhbmRcbiAgICAgKiBpbnZva2VzIGFuIGFycmF5IG9mIGNhbGxiYWNrc1xuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IFJlc2l6ZVNlcnZpY2UgQSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIFJlc2l6ZVNlcnZpY2UgY2xhc3NcbiAgICAgKi9cbiAgICB0aGlzLlJlc2l6ZVNlcnZpY2UgPSBuZXcgUmVzaXplU2VydmljZSgpO1xuXG4gICAgLyoqXG4gICAgICogQSBzZXJ2aWNlIHdoaWNoIGxpc3RlbnMgdG8gdGhlIGB3aW5kb3dgIHNjcm9sbCBldmVudCBhbmRcbiAgICAgKiBpbnZva2VzIGFuIGFycmF5IG9mIGNhbGxiYWNrc1xuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IFNjcm9sbFNlcnZpY2UgQSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIFNjcm9sbFNlcnZpY2UgY2xhc3NcbiAgICAgKi9cbiAgICB0aGlzLlNjcm9sbFNlcnZpY2UgPSBuZXcgU2Nyb2xsU2VydmljZSgpO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGlzc2Nyb2xsZWRpbnRvdmlldyB9IGZyb20gJy4uLy4uL1V0aWxzJztcbmltcG9ydCB7IENMQVNTX05BTUVTLCBFVkVOVFMsIE1JU0MsIFNFTEVDVE9SUyB9IGZyb20gJ0NvbnN0YW50cyc7XG5cbi8qKlxuICogSW4gVmlld3BvcnRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5WaWV3cG9ydCB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgaW52aWV3cG9ydCB3aGljaCBzaW1wbHkgYXNzaWducyB0aGUgU2Nyb2xsU2VydmljZVxuICAgKiB0byBhIHByb3BlcnR5IG9uIHRoZSBjb250cnVjdG9yIGZvciByZWZlcmVuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTZXJ2aWNlcyB2YXJpb3VzIHNlcnZpY2VzLCBwYXNzZWQgaW4gYXMgcGFyYW1cbiAgICovXG4gIGNvbnN0cnVjdG9yKFNlcnZpY2VzKSB7XG4gICAgLyoqXG4gICAgICogUmVmZXJlbmNlIHRvIHRoZSBTY3JvbGxTZXJ2aWNlIHNpbmdsZXRvblxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMuU2Nyb2xsU2VydmljZSA9IFNlcnZpY2VzLlNjcm9sbFNlcnZpY2U7XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSB2aWV3XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHZpZXcgYnkgY2FsbGluZyB0aGUgZnVuY3Rpb25zIHRvXG4gICAqIGNyZWF0ZSBET00gcmVmZXJlbmNlcywgc2V0dXAgZXZlbnQgaGFuZGxlcnMgYW5kXG4gICAqIHRoZW4gY3JlYXRlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGluaXQoKSB7XG4gICAgdGhpcy5jYWNoZURvbVJlZmVyZW5jZXMoKVxuICAgICAgLnNldHVwSGFuZGxlcnMoKVxuICAgICAgLmVuYWJsZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbGwgbmVjZXNzYXJ5IERPTSBlbGVtZW50cyB1c2VkIGluIHRoZSB2aWV3IGFuZCBjYWNoZSB0aGVtXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjYWNoZURvbVJlZmVyZW5jZXMoKSB7XG4gICAgLyoqXG4gICAgICogQWxsIERPTSBlbGVtZW50cyB3aXRoIHRoZSBgZGF0YS12aXNpYmxlYCBhdHRyaWJ1dGVcbiAgICAgKiBAcHJvcGVydHkge05vZGVMaXN0fVxuICAgICAqL1xuICAgIHRoaXMubW9kdWxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1JTLkRBVEFfVklTSUJMRSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhlIHByb3BlciBjb250ZXh0IG9mIGB0aGlzYC5cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHNldHVwSGFuZGxlcnMoKSB7XG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGBvblNjcm9sbGAgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyXG4gICAgICogY29udGV4dCBib3VuZCB0byB0aGUgSW5WaWV3cG9ydCBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgdGhpcy5vblNjcm9sbEhhbmRsZXIgPSB0aGlzLm9uU2Nyb2xsLmJpbmQodGhpcyk7XG5cbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYHVwZGF0ZU1vZHVsZXNgIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlclxuICAgICAqIGNvbnRleHQgYm91bmQgdG8gdGhlIEluVmlld3BvcnQgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHRoaXMub25Nb2R1bGVVcGRhdGVIYW5kbGVyID0gdGhpcy51cGRhdGVNb2R1bGVzLmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgZXZlbnQgaGFuZGxlcnMgdG8gZW5hYmxlIGludGVyYWN0aW9uIHdpdGggdmlld1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW5hYmxlKCkge1xuICAgIC8vIENhbGwgc2Nyb2xsIGhhbmRsZXIgb24gbG9hZCB0byBnZXQgaW5pdGlhbCB2aWV3YWJsZSBlbGVtZW50c1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KHRoaXMub25TY3JvbGxIYW5kbGVyLCAzMDApO1xuXG4gICAgLy8gQWRkIHRvIFNjcm9sbFNlcml2ZSBjYWxsYmFja3NcbiAgICB0aGlzLlNjcm9sbFNlcnZpY2UuYWRkQ2FsbGJhY2sodGhpcy5vblNjcm9sbEhhbmRsZXIpO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5VUERBVEVfSU5fVklFV1BPUlRfTU9EVUxFUywgdGhpcy5vbk1vZHVsZVVwZGF0ZUhhbmRsZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCBsb29wcyBvdmVyIHRoZSBjdXJyZW50IG1vZHVsZXMgYW5kIGRldGVybWluZXNcbiAgICogd2hpY2ggYXJlIGN1cnJlbnRseSBpbiB0aGUgdmlld3BvcnQuIERlcGVuZGluZyBvbiB3aGV0aGVyIG9yXG4gICAqIG5vdCB0aGV5IGFyZSB2aXNpYmxlIGEgZGF0YSBhdHRyaWJ1dGUgYm9vbGVhbiBpcyB0b2dnbGVkXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvblNjcm9sbCgpIHtcbiAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRoaXMubW9kdWxlcywgKG1vZHVsZSkgPT4ge1xuICAgICAgaWYgKGlzc2Nyb2xsZWRpbnRvdmlldyhtb2R1bGUpKSB7XG4gICAgICAgIGlmIChtb2R1bGUuZ2V0QXR0cmlidXRlKE1JU0MuREFUQV9WSVNJQkxFKSA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoTUlTQy5EQVRBX1ZJU0lCTEUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbW9kdWxlLmhhc0F0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9IQVNfQU5JTUFURUQpICYmIG1vZHVsZS5nZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfQk9UVE9NKSA9PT0gJ2Fib3ZlLWJvdHRvbScpIHtcbiAgICAgICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX0hBU19BTklNQVRFRCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtb2R1bGUuZ2V0QXR0cmlidXRlKE1JU0MuREFUQV9WSVNJQkxFKSA9PT0gJ3RydWUnKSB7XG4gICAgICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShNSVNDLkRBVEFfVklTSUJMRSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCByZWN0ID0gbW9kdWxlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgY3VycmVudERhdGFQb3NpdGlvbiA9IG1vZHVsZS5nZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfUE9TSVRJT04pO1xuICAgICAgY29uc3QgY2FsY3VsYXRlZERhdGFQb3NpdGlvbiA9IHJlY3QuYm90dG9tIDwgMCA/IENMQVNTX05BTUVTLkFCT1ZFX1ZJRVdQT1JUIDogcmVjdC50b3AgPj0gd2luZG93LmlubmVySGVpZ2h0ID8gQ0xBU1NfTkFNRVMuQkVMT1dfVklFV1BPUlQgOiBDTEFTU19OQU1FUy5JTl9WSUVXUE9SVDtcbiAgICAgIGNvbnN0IGNhbGN1bGF0ZWRCb3R0b21Qb3NpdGlvbiA9IHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0ID8gQ0xBU1NfTkFNRVMuQkVMT1dfQk9UVE9NIDogQ0xBU1NfTkFNRVMuQUJPVkVfQk9UVE9NO1xuICAgICAgY29uc3QgaGFsZndheVBvc2l0aW9uID0gcmVjdC5ib3R0b20gPD0gKHdpbmRvdy5pbm5lckhlaWdodCAvIDEuMjUpID8gQ0xBU1NfTkFNRVMuQUJPVkVfSEFMRldBWSA6IENMQVNTX05BTUVTLkJFTE9XX0hBTEZXQVk7XG4gICAgICBpZiAoY3VycmVudERhdGFQb3NpdGlvbiAhPT0gY2FsY3VsYXRlZERhdGFQb3NpdGlvbikge1xuICAgICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX1BPU0lUSU9OLCBjYWxjdWxhdGVkRGF0YVBvc2l0aW9uKTtcbiAgICAgIH1cbiAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfQk9UVE9NLCBjYWxjdWxhdGVkQm90dG9tUG9zaXRpb24pO1xuICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9IQUxGV0FZLCBoYWxmd2F5UG9zaXRpb24pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCB1cGRhdGVzIHRoZSBsaXN0IG9mIGRhdGEtdmlzaWJsZSBtb2R1bGVzIGJ5IGNhbGxpbmcgYGNhY2hlRG9tUmVmZXJlbmNlc2AgYW5kIGNhbGxzIGBvblNjcm9sbGBcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHVwZGF0ZU1vZHVsZXMoKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ3Njcm9sbCcpO1xuICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKCkub25TY3JvbGwoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFSSUEsIFNFTEVDVE9SUywgQ0xBU1NfTkFNRVMsIEVWRU5UUywgS0VZX0NPREVTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuXG4vKipcbiAqIEEgY2xhc3Mgd2hpY2ggaGlkZXMgYW5kIHJldmVhbHMgaGlkZGVuIG1lbnUgY29udGVudCBiYXNlZCBvbiB1c2VyIGNsaWNrIG9mIGEgYnV0dG9uLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOYXYge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIE5hdiB3aGljaCBzaW1wbHkgYXNzaWducyB0aGUgU2Nyb2xsU2VydmljZVxuICAgKiB0byBhIHByb3BlcnR5IG9uIHRoZSBjb250cnVjdG9yIGZvciByZWZlcmVuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBSRVFVSVJFRCAtIHRoZSBtb2R1bGUncyBjb250YWluZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IFNlcnZpY2VzIHZhcmlvdXMgc2VydmljZXMsIHBhc3NlZCBpbiBhcyBwYXJhbVxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgU2VydmljZXMgKSB7XG4gICAgLyoqXG4gICAgICogRE9NIG5vZGUgdGhhdCBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBlbGVtZW50IERPTSBub2RlIHRoYXQgaXMgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgdmlld1xuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB2aWV3IGJ5IGNhbGxpbmcgdGhlIGZ1bmN0aW9ucyB0b1xuICAgKiBjcmVhdGUgRE9NIHJlZmVyZW5jZXMsIHNldHVwIGV2ZW50IGhhbmRsZXJzIGFuZFxuICAgKiB0aGVuIGNyZWF0ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gSGVhZGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBpbml0KCkge1xuICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKClcbiAgICAgIC5zZXR1cEhhbmRsZXJzKClcbiAgICAgIC5lbmFibGUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENhY2hlIERPTSBSZWZlcmVuY2VzXG4gICAqXG4gICAqIEZpbmQgYWxsIG5lY2Vzc2FyeSBET00gZWxlbWVudHMgdXNlZCBpbiB0aGUgdmlldyBhbmQgY2FjaGUgdGhlbVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY2FjaGVEb21SZWZlcmVuY2VzKCkge1xuICAgIHRoaXMubmF2VHJpZ2dlciA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKFNFTEVDVE9SUy5OQVZfVFJJR0dFUik7XG4gICAgdGhpcy5zaXRlTmF2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihTRUxFQ1RPUlMuU0lURV9OQVYpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQmluZCBldmVudCBoYW5kbGVycyB3aXRoIHRoZSBwcm9wZXIgY29udGV4dCBvZiBgdGhpc2AuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gTmF2IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXR1cEhhbmRsZXJzKCkge1xuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgb25DbGlja2AgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyXG4gICAgICogY29udGV4dCBib3VuZCB0byB0aGUgU1ZHU2Nyb2xsQW5pbWF0aW9ucyBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgdGhpcy5vbkNsaWNrSGFuZGxlciA9IHRoaXMub25DbGljay5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGV2ZW50IGhhbmRsZXJzIHRvIGVuYWJsZSBpbnRlcmFjdGlvbiB3aXRoIHZpZXdcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBOYXYgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGVuYWJsZSgpIHtcbiAgICAvLyBoYW5kbGUgbmF2IHRyaWdnZXIgY2xpY2tcbiAgICB0aGlzLm5hdlRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuQ0xJQ0ssIHRoaXMub25DbGlja0hhbmRsZXIpO1xuICAgIHRoaXMubmF2VHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5LRVlfRE9XTiwgdGhpcy5vbkNsaWNrSGFuZGxlcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxpbmcgYmV5b25kIHRoZSBoZWlnaHQgb2YgdGhlIG5hdiB3aWxsIHRyaWdnZXIgYSBjbGFzcyBjaGFuZ2VcbiAgICogYW5kIHZpY2UgdmVyc2EuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBvbkNsaWNrKCkge1xuICAgIGNvbnN0IGlzT3BlbiA9IHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5oZWFkZXJPcGVuID0gIWlzT3BlbjtcbiAgICBpZiAoZXZlbnQudHlwZSA9PT0gRVZFTlRTLktFWV9ET1dOICYmIChcbiAgICAgIGV2ZW50LnRhcmdldC5ub2RlTmFtZS5tYXRjaCgvYXxpbnB1dHx0ZXh0YXJlYXxzZWxlY3R8YnV0dG9uL2kpIHx8XG4gICAgICAoaXNPcGVuICYmIGV2ZW50LmtleUNvZGUgIT09IEtFWV9DT0RFUy5FU0NBUEUgJiYgKGV2ZW50LmtleUNvZGUgIT09IEtFWV9DT0RFUy5TUEFDRUJBUiB8fCBldmVudC5jdXJyZW50VGFyZ2V0ID09PSB3aW5kb3cpKSB8fFxuICAgICAgKCFpc09wZW4gJiYgZXZlbnQua2V5Q29kZSAhPT0gS0VZX0NPREVTLlNQQUNFQkFSKVxuICAgICkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LnR5cGUgPT09IEVWRU5UUy5LRVlfRE9XTiAmJiBldmVudC5rZXlDb2RlID09PSBLRVlfQ09ERVMuU1BBQ0VCQVIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShDTEFTU19OQU1FUy5PUEVOKTtcbiAgICB0aGlzLm5hdlRyaWdnZXIuY2xhc3NMaXN0LnRvZ2dsZShDTEFTU19OQU1FUy5PUEVOKTtcbiAgICB0aGlzLnNpdGVOYXYuY2xhc3NMaXN0LnRvZ2dsZShDTEFTU19OQU1FUy5PUEVOKTtcbiAgICB0aGlzLm5hdlRyaWdnZXIuc2V0QXR0cmlidXRlKEFSSUEuRVhQQU5ERUQsIGlzT3Blbik7XG4gICAgdGhpcy5zaXRlTmF2LnNldEF0dHJpYnV0ZShBUklBLkhJRERFTiwgaXNPcGVuKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTkVEKTtcbiAgfVxuXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFSSUEsIFNFTEVDVE9SUywgQ0xBU1NfTkFNRVMsIEVWRU5UUywgS0VZX0NPREVTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuXG4vKipcbiAqIEEgY2xhc3Mgd2hpY2ggaGlkZXMgYW5kIHJldmVhbHMgaGlkZGVuIG1lbnUgY29udGVudCBiYXNlZCBvbiB1c2VyIGNsaWNrIG9mIGEgYnV0dG9uLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWaWRlbyB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgVmlkZW8gd2hpY2ggc2ltcGx5IGFzc2lnbnMgdGhlIFNjcm9sbFNlcnZpY2VcbiAgICogdG8gYSBwcm9wZXJ0eSBvbiB0aGUgY29udHJ1Y3RvciBmb3IgcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gUkVRVUlSRUQgLSB0aGUgbW9kdWxlJ3MgY29udGFpbmVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTZXJ2aWNlcyB2YXJpb3VzIHNlcnZpY2VzLCBwYXNzZWQgaW4gYXMgcGFyYW1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIFNlcnZpY2VzICkge1xuICAgIC8qKlxuICAgICAqIERPTSBub2RlIHRoYXQgaXMgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gZWxlbWVudCBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cblxuICAgIC8vIEluaXRpYWxpemUgdGhlIHZpZXdcbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdmlldyBieSBjYWxsaW5nIHRoZSBmdW5jdGlvbnMgdG9cbiAgICogY3JlYXRlIERPTSByZWZlcmVuY2VzLCBzZXR1cCBldmVudCBoYW5kbGVycyBhbmRcbiAgICogdGhlbiBjcmVhdGUgdGhlIGV2ZW50IGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmNhY2hlRG9tUmVmZXJlbmNlcygpXG4gICAgICAuc2V0dXBIYW5kbGVycygpXG4gICAgICAuZW5hYmxlKCk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3ZpZGVvLW9wZW4nKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENhY2hlIERPTSBSZWZlcmVuY2VzXG4gICAqXG4gICAqIEZpbmQgYWxsIG5lY2Vzc2FyeSBET00gZWxlbWVudHMgdXNlZCBpbiB0aGUgdmlldyBhbmQgY2FjaGUgdGhlbVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY2FjaGVEb21SZWZlcmVuY2VzKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmQgZXZlbnQgaGFuZGxlcnMgd2l0aCB0aGUgcHJvcGVyIGNvbnRleHQgb2YgYHRoaXNgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFZpZGVvIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXR1cEhhbmRsZXJzKCkge1xuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgb25DbGlja2AgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyXG4gICAgICogY29udGV4dCBib3VuZFxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICB0aGlzLm9uQ2xpY2tIYW5kbGVyID0gdGhpcy5vbkNsaWNrLmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgZXZlbnQgaGFuZGxlcnMgdG8gZW5hYmxlIGludGVyYWN0aW9uIHdpdGggdmlld1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFZpZGVvIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbmFibGUoKSB7XG4gICAgLy8gaGFuZGxlIFZpZGVvIHRyaWdnZXIgY2xpY2tcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuQ0xJQ0ssIHRoaXMub25DbGlja0hhbmRsZXIpO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5LRVlfRE9XTiwgdGhpcy5vbkNsaWNrSGFuZGxlcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGlja2luZyB0aGUgY29udGVudCB3aWxsIGNhdXNlIGl0IHRvIGJlIHJlbW92ZWQgZnJvbSBzaWdodFxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25DbGljaygpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmYWRlJyk7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCd2aWRlby1vcGVuJyk7XG4gIH1cbn1cbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBGb3VuZGF0aW9uIENvcmVcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmNvcmUuanMnO1xuLy8gRm91bmRhdGlvbiBVdGlsaXRpZXNcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwuYm94LmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5LmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubmVzdC5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXIuanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50b3VjaC5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzJztcbi8vIEZvdW5kYXRpb24gUGx1Z2lucy4gQWRkIG9yIHJlbW92ZSBhcyBuZWVkZWQgZm9yIHlvdXIgc2l0ZVxuLy8gaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24uZHJpbGxkb3duLmpzJztcbi8vIGltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmRyb3Bkb3duTWVudS5qcyc7XG4vLyBpbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudS5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi5vZmZjYW52YXMuanMnO1xuXG5pbXBvcnQganF1ZXJ5IGZyb20gJ2pxdWVyeSc7XG4vLyBpbXBvcnQgcHJlcElucHV0cyBmcm9tICdtb2R1bGVzL3ByZXBpbnB1dHMuanMnO1xuaW1wb3J0IHNvY2lhbFNoYXJlIGZyb20gJ21vZHVsZXMvc29jaWFsU2hhcmUuanMnO1xuLy8gaW1wb3J0IGNhcm91c2VsIGZyb20gJ21vZHVsZXMvY2Fyb3VzZWwuanMnO1xuXG5pbXBvcnQgQXBwIGZyb20gJy4vQXBwJztcblxuKGZ1bmN0aW9uKCQpIHtcbiAgLy8gSW5pdGlhbGl6ZSBGb3VuZGF0aW9uXG4gICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcblxuICAvLyBQcmVwYXJlIGZvcm0gaW5wdXRzXG4gIC8vIHByZXBJbnB1dHMoKTtcbiAgLy8gSW5pdGlhbGl6ZSBzb2NpYWwgc2hhcmUgZnVuY3Rpb25hbGl0eVxuICAvLyBSZXBsYWNlIHRoZSBlbXB0eSBzdHJpbmcgcGFyYW1ldGVyIHdpdGggeW91ciBGYWNlYm9vayBJRFxuICBzb2NpYWxTaGFyZSgnJyk7XG5cbiAgLy8gQXR0YWNoIEFwcCB0byB0aGUgd2luZG93XG4gIHdpbmRvdy5BcHAgPSBuZXcgQXBwKCk7XG59KShqcXVlcnkpO1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5cbmNvbnN0IHNvY2lhbFNoYXJlID0gZnVuY3Rpb24oZmJJZCkge1xuICBjb25zdCAkYm9keSA9ICQoJ2JvZHknKTtcblxuICAvLyBGYWNlYm9vayBzaGFyaW5nIHdpdGggdGhlIFNES1xuICAkLmdldFNjcmlwdCgnLy9jb25uZWN0LmZhY2Vib29rLm5ldC9lbl9VUy9zZGsuanMnKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICRib2R5Lm9uKCdjbGljay5zaGFyZXItZmInLCAnLnNoYXJlci1mYicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGNvbnN0ICRsaW5rID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgbWV0aG9kOiAnZmVlZCcsXG4gICAgICAgIGRpc3BsYXk6ICdwb3B1cCcsXG4gICAgICB9O1xuICAgICAgY29uc3QgbmV3VXJsID0gJGxpbmsuZGF0YSgncmVkaXJlY3QtdG8nKSA/XG4gICAgICAgICAgJGxpbmsuZGF0YSgncmVkaXJlY3QtdG8nKSA6IG51bGw7XG5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgd2luZG93LkZCLmluaXQoe1xuICAgICAgICBhcHBJZDogZmJJZCxcbiAgICAgICAgeGZibWw6IGZhbHNlLFxuICAgICAgICB2ZXJzaW9uOiAndjIuMCcsXG4gICAgICAgIHN0YXR1czogZmFsc2UsXG4gICAgICAgIGNvb2tpZTogdHJ1ZSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoJGxpbmsuZGF0YSgndGl0bGUnKSkge1xuICAgICAgICBvcHRpb25zLm5hbWUgPSAkbGluay5kYXRhKCd0aXRsZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoJGxpbmsuZGF0YSgndXJsJykpIHtcbiAgICAgICAgb3B0aW9ucy5saW5rID0gJGxpbmsuZGF0YSgndXJsJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCdwaWN0dXJlJykpIHtcbiAgICAgICAgb3B0aW9ucy5waWN0dXJlID0gJGxpbmsuZGF0YSgncGljdHVyZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoJGxpbmsuZGF0YSgnZGVzY3JpcHRpb24nKSkge1xuICAgICAgICBvcHRpb25zLmRlc2NyaXB0aW9uID0gJGxpbmsuZGF0YSgnZGVzY3JpcHRpb24nKTtcbiAgICAgIH1cblxuICAgICAgd2luZG93LkZCLnVpKG9wdGlvbnMsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmIChuZXdVcmwpIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG5ld1VybDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFR3aXR0ZXIgc2hhcmluZ1xuICAkYm9keS5vbignY2xpY2suc2hhcmVyLXR3JywgJy5zaGFyZXItdHcnLCBmdW5jdGlvbihlKSB7XG4gICAgY29uc3QgJGxpbmsgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgY29uc3QgdXJsID0gJGxpbmsuZGF0YSgndXJsJyk7XG4gICAgY29uc3QgdGV4dCA9ICRsaW5rLmRhdGEoJ2Rlc2NyaXB0aW9uJyk7XG4gICAgY29uc3QgdmlhID0gJGxpbmsuZGF0YSgnc291cmNlJyk7XG4gICAgbGV0IHR3aXR0ZXJVUkwgPSBgaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT91cmw9JHtlbmNvZGVVUklDb21wb25lbnQodXJsKX1gO1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgIHR3aXR0ZXJVUkwgKz0gYCZ0ZXh0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRleHQpfWA7XG4gICAgfVxuICAgIGlmICh2aWEpIHtcbiAgICAgIHR3aXR0ZXJVUkwgKz0gYCZ2aWE9JHtlbmNvZGVVUklDb21wb25lbnQodmlhKX1gO1xuICAgIH1cbiAgICB3aW5kb3cub3Blbih0d2l0dGVyVVJMLCAndHdlZXQnLFxuICAgICAgICAnd2lkdGg9NTAwLGhlaWdodD0zODQsbWVudWJhcj1ubyxzdGF0dXM9bm8sdG9vbGJhcj1ubycpO1xuICB9KTtcblxuICAvLyBMaW5rZWRJbiBzaGFyaW5nXG4gICRib2R5Lm9uKCdjbGljay5zaGFyZXItbGknLCAnLnNoYXJlci1saScsIGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCAkbGluayA9ICQoZS50YXJnZXQpO1xuICAgIGNvbnN0IHVybCA9ICRsaW5rLmRhdGEoJ3VybCcpO1xuICAgIGNvbnN0IHRpdGxlID0gJGxpbmsuZGF0YSgndGl0bGUnKTtcbiAgICBjb25zdCBzdW1tYXJ5ID0gJGxpbmsuZGF0YSgnZGVzY3JpcHRpb24nKTtcbiAgICBjb25zdCBzb3VyY2UgPSAkbGluay5kYXRhKCdzb3VyY2UnKTtcbiAgICBsZXQgbGlua2VkaW5VUkwgPSAnaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL3NoYXJlQXJ0aWNsZT9taW5pPXRydWUmdXJsPScgK1xuICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodXJsKTtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmICh0aXRsZSkge1xuICAgICAgbGlua2VkaW5VUkwgKz0gYCZ0aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aXRsZSl9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlua2VkaW5VUkwgKz0gJyZ0aXRsZT0nO1xuICAgIH1cblxuICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICBsaW5rZWRpblVSTCArPVxuICAgICAgICAgIGAmc3VtbWFyeT0ke2VuY29kZVVSSUNvbXBvbmVudChzdW1tYXJ5LnN1YnN0cmluZygwLCAyNTYpKX1gO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2UpIHtcbiAgICAgIGxpbmtlZGluVVJMICs9IGAmc291cmNlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHNvdXJjZSl9YDtcbiAgICB9XG5cbiAgICB3aW5kb3cub3BlbihsaW5rZWRpblVSTCwgJ2xpbmtlZGluJyxcbiAgICAgICAgJ3dpZHRoPTUyMCxoZWlnaHQ9NTcwLG1lbnViYXI9bm8sc3RhdHVzPW5vLHRvb2xiYXI9bm8nKTtcbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzb2NpYWxTaGFyZTtcbiJdfQ==
