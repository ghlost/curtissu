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
        document.cookie = 'video=true;max-age=1200;';
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
require('vendor/_rellax.js');
var _socialShare = require('modules/socialShare.js');var _socialShare2 = _interopRequireDefault(_socialShare);


var _App = require('./App');var _App2 = _interopRequireDefault(_App);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

(function ($) {
  // Initialize Foundation
  $(document).foundation();

  // Prepare form inputs
  // prepInputs();
  // Initialize social share functionality
  // Replace the empty string parameter with your Facebook ID
  (0, _socialShare2.default)('');

  // Attach App to the window
  window.App = new _App2.default();
})(_jquery2.default); // import carousel from 'modules/carousel.js';
// Foundation Plugins. Add or remove as needed for your site
// import 'foundation-sites/js/foundation.drilldown.js';
// import 'foundation-sites/js/foundation.dropdownMenu.js';
// import 'foundation-sites/js/foundation.responsiveMenu.js';
// Foundation Utilities
var rellax = new Rellax('.rellax');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./App":11,"foundation-sites/js/foundation.core.js":1,"foundation-sites/js/foundation.offcanvas.js":2,"foundation-sites/js/foundation.util.box.js":3,"foundation-sites/js/foundation.util.keyboard.js":4,"foundation-sites/js/foundation.util.mediaQuery.js":5,"foundation-sites/js/foundation.util.motion.js":6,"foundation-sites/js/foundation.util.nest.js":7,"foundation-sites/js/foundation.util.timerAndImageLoader.js":8,"foundation-sites/js/foundation.util.touch.js":9,"foundation-sites/js/foundation.util.triggers.js":10,"modules/socialShare.js":38,"vendor/_rellax.js":39}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
(function (global){
'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};
// ------------------------------------------
// Rellax.js
// Buttery smooth parallax library
// Copyright (c) 2016 Moe Amaya (@moeamaya)
// MIT license
//
// Thanks to Paraxify.js and Jaime Cabllero
// for parallax concepts
// ------------------------------------------

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.Rellax = factory();
  }
})(typeof window !== "undefined" ? window : global, function () {
  var Rellax = function Rellax(el, options) {
    "use strict";

    var self = Object.create(Rellax.prototype);

    var posY = 0;
    var screenY = 0;
    var posX = 0;
    var screenX = 0;
    var blocks = [];
    var pause = true;

    // check what requestAnimationFrame to use, and if
    // it's not supported, use the onscroll event
    var loop = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function (callback) {return setTimeout(callback, 1000 / 60);};

    // store the id for later use
    var loopId = null;

    // Test via a getter in the options object to see if the passive property is accessed
    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function get() {
          supportsPassive = true;
        } });

      window.addEventListener("testPassive", null, opts);
      window.removeEventListener("testPassive", null, opts);
    } catch (e) {}

    // check what cancelAnimation method to use
    var clearLoop = window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout;

    // check which transform property to use
    var transformProp = window.transformProp || function () {
      var testEl = document.createElement('div');
      if (testEl.style.transform === null) {
        var vendors = ['Webkit', 'Moz', 'ms'];
        for (var vendor in vendors) {
          if (testEl.style[vendors[vendor] + 'Transform'] !== undefined) {
            return vendors[vendor] + 'Transform';
          }
        }
      }
      return 'transform';
    }();

    // Default Settings
    self.options = {
      speed: -2,
      verticalSpeed: null,
      horizontalSpeed: null,
      breakpoints: [576, 768, 1201],
      center: false,
      wrapper: null,
      relativeToWrapper: false,
      round: true,
      vertical: true,
      horizontal: false,
      verticalScrollAxis: "y",
      horizontalScrollAxis: "x",
      callback: function callback() {} };


    // User defined options (might have more in the future)
    if (options) {
      Object.keys(options).forEach(function (key) {
        self.options[key] = options[key];
      });
    }

    function validateCustomBreakpoints() {
      if (self.options.breakpoints.length === 3 && Array.isArray(self.options.breakpoints)) {
        var isAscending = true;
        var isNumerical = true;
        var lastVal;
        self.options.breakpoints.forEach(function (i) {
          if (typeof i !== 'number') isNumerical = false;
          if (lastVal !== null) {
            if (i < lastVal) isAscending = false;
          }
          lastVal = i;
        });
        if (isAscending && isNumerical) return;
      }
      // revert defaults if set incorrectly
      self.options.breakpoints = [576, 768, 1201];
      console.warn("Rellax: You must pass an array of 3 numbers in ascending order to the breakpoints option. Defaults reverted");
    }

    if (options && options.breakpoints) {
      validateCustomBreakpoints();
    }

    // By default, rellax class
    if (!el) {
      el = '.rellax';
    }

    // check if el is a className or a node
    var elements = typeof el === 'string' ? document.querySelectorAll(el) : [el];

    // Now query selector
    if (elements.length > 0) {
      self.elems = elements;
    }

    // The elements don't exist
    else {
        console.warn("Rellax: The elements you're trying to select don't exist.");
        return;
      }

    // Has a wrapper and it exists
    if (self.options.wrapper) {
      if (!self.options.wrapper.nodeType) {
        var wrapper = document.querySelector(self.options.wrapper);

        if (wrapper) {
          self.options.wrapper = wrapper;
        } else {
          console.warn("Rellax: The wrapper you're trying to use doesn't exist.");
          return;
        }
      }
    }

    // set a placeholder for the current breakpoint
    var currentBreakpoint;

    // helper to determine current breakpoint
    var getCurrentBreakpoint = function getCurrentBreakpoint(w) {
      var bp = self.options.breakpoints;
      if (w < bp[0]) return 'xs';
      if (w >= bp[0] && w < bp[1]) return 'sm';
      if (w >= bp[1] && w < bp[2]) return 'md';
      return 'lg';
    };

    // Get and cache initial position of all elements
    var cacheBlocks = function cacheBlocks() {
      for (var i = 0; i < self.elems.length; i++) {
        var block = createBlock(self.elems[i]);
        blocks.push(block);
      }
    };


    // Let's kick this script off
    // Build array for cached element values
    var init = function init() {
      for (var i = 0; i < blocks.length; i++) {
        self.elems[i].style.cssText = blocks[i].style;
      }

      blocks = [];

      screenY = window.innerHeight;
      screenX = window.innerWidth;
      currentBreakpoint = getCurrentBreakpoint(screenX);

      setPosition();

      cacheBlocks();

      animate();

      // If paused, unpause and set listener for window resizing events
      if (pause) {
        window.addEventListener('resize', init);
        pause = false;
        // Start the loop
        update();
      }
    };

    // We want to cache the parallax blocks'
    // values: base, top, height, speed
    // el: is dom object, return: el cache values
    var createBlock = function createBlock(el) {
      var dataPercentage = el.getAttribute('data-rellax-percentage');
      var dataSpeed = el.getAttribute('data-rellax-speed');
      var dataXsSpeed = el.getAttribute('data-rellax-xs-speed');
      var dataMobileSpeed = el.getAttribute('data-rellax-mobile-speed');
      var dataTabletSpeed = el.getAttribute('data-rellax-tablet-speed');
      var dataDesktopSpeed = el.getAttribute('data-rellax-desktop-speed');
      var dataVerticalSpeed = el.getAttribute('data-rellax-vertical-speed');
      var dataHorizontalSpeed = el.getAttribute('data-rellax-horizontal-speed');
      var dataVericalScrollAxis = el.getAttribute('data-rellax-vertical-scroll-axis');
      var dataHorizontalScrollAxis = el.getAttribute('data-rellax-horizontal-scroll-axis');
      var dataZindex = el.getAttribute('data-rellax-zindex') || 0;
      var dataMin = el.getAttribute('data-rellax-min');
      var dataMax = el.getAttribute('data-rellax-max');
      var dataMinX = el.getAttribute('data-rellax-min-x');
      var dataMaxX = el.getAttribute('data-rellax-max-x');
      var dataMinY = el.getAttribute('data-rellax-min-y');
      var dataMaxY = el.getAttribute('data-rellax-max-y');
      var mapBreakpoints;
      var breakpoints = true;

      if (!dataXsSpeed && !dataMobileSpeed && !dataTabletSpeed && !dataDesktopSpeed) {
        breakpoints = false;
      } else {
        mapBreakpoints = {
          'xs': dataXsSpeed,
          'sm': dataMobileSpeed,
          'md': dataTabletSpeed,
          'lg': dataDesktopSpeed };

      }

      // initializing at scrollY = 0 (top of browser), scrollX = 0 (left of browser)
      // ensures elements are positioned based on HTML layout.
      //
      // If the element has the percentage attribute, the posY and posX needs to be
      // the current scroll position's value, so that the elements are still positioned based on HTML layout
      var wrapperPosY = self.options.wrapper ? self.options.wrapper.scrollTop : window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      // If the option relativeToWrapper is true, use the wrappers offset to top, subtracted from the current page scroll.
      if (self.options.relativeToWrapper) {
        var scrollPosY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        wrapperPosY = scrollPosY - self.options.wrapper.offsetTop;
      }
      var posY = self.options.vertical ? dataPercentage || self.options.center ? wrapperPosY : 0 : 0;
      var posX = self.options.horizontal ? dataPercentage || self.options.center ? self.options.wrapper ? self.options.wrapper.scrollLeft : window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft : 0 : 0;

      var blockTop = posY + el.getBoundingClientRect().top;
      var blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;

      var blockLeft = posX + el.getBoundingClientRect().left;
      var blockWidth = el.clientWidth || el.offsetWidth || el.scrollWidth;

      // apparently parallax equation everyone uses
      var percentageY = dataPercentage ? dataPercentage : (posY - blockTop + screenY) / (blockHeight + screenY);
      var percentageX = dataPercentage ? dataPercentage : (posX - blockLeft + screenX) / (blockWidth + screenX);
      if (self.options.center) {percentageX = 0.5;percentageY = 0.5;}

      // Optional individual block speed as data attr, otherwise global speed
      var speed = breakpoints && mapBreakpoints[currentBreakpoint] !== null ? Number(mapBreakpoints[currentBreakpoint]) : dataSpeed ? dataSpeed : self.options.speed;
      var verticalSpeed = dataVerticalSpeed ? dataVerticalSpeed : self.options.verticalSpeed;
      var horizontalSpeed = dataHorizontalSpeed ? dataHorizontalSpeed : self.options.horizontalSpeed;

      // Optional individual block movement axis direction as data attr, otherwise gobal movement direction
      var verticalScrollAxis = dataVericalScrollAxis ? dataVericalScrollAxis : self.options.verticalScrollAxis;
      var horizontalScrollAxis = dataHorizontalScrollAxis ? dataHorizontalScrollAxis : self.options.horizontalScrollAxis;

      var bases = updatePosition(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed);

      // ~~Store non-translate3d transforms~~
      // Store inline styles and extract transforms
      var style = el.style.cssText;
      var transform = '';

      // Check if there's an inline styled transform
      var searchResult = /transform\s*:/i.exec(style);
      if (searchResult) {
        // Get the index of the transform
        var index = searchResult.index;

        // Trim the style to the transform point and get the following semi-colon index
        var trimmedStyle = style.slice(index);
        var delimiter = trimmedStyle.indexOf(';');

        // Remove "transform" string and save the attribute
        if (delimiter) {
          transform = " " + trimmedStyle.slice(11, delimiter).replace(/\s/g, '');
        } else {
          transform = " " + trimmedStyle.slice(11).replace(/\s/g, '');
        }
      }

      return {
        baseX: bases.x,
        baseY: bases.y,
        top: blockTop,
        left: blockLeft,
        height: blockHeight,
        width: blockWidth,
        speed: speed,
        verticalSpeed: verticalSpeed,
        horizontalSpeed: horizontalSpeed,
        verticalScrollAxis: verticalScrollAxis,
        horizontalScrollAxis: horizontalScrollAxis,
        style: style,
        transform: transform,
        zindex: dataZindex,
        min: dataMin,
        max: dataMax,
        minX: dataMinX,
        maxX: dataMaxX,
        minY: dataMinY,
        maxY: dataMaxY };

    };

    // set scroll position (posY, posX)
    // side effect method is not ideal, but okay for now
    // returns true if the scroll changed, false if nothing happened
    var setPosition = function setPosition() {
      var oldY = posY;
      var oldX = posX;

      posY = self.options.wrapper ? self.options.wrapper.scrollTop : (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
      posX = self.options.wrapper ? self.options.wrapper.scrollLeft : (document.documentElement || document.body.parentNode || document.body).scrollLeft || window.pageXOffset;
      // If option relativeToWrapper is true, use relative wrapper value instead.
      if (self.options.relativeToWrapper) {
        var scrollPosY = (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
        posY = scrollPosY - self.options.wrapper.offsetTop;
      }


      if (oldY != posY && self.options.vertical) {
        // scroll changed, return true
        return true;
      }

      if (oldX != posX && self.options.horizontal) {
        // scroll changed, return true
        return true;
      }

      // scroll did not change
      return false;
    };

    // Ahh a pure function, gets new transform value
    // based on scrollPosition and speed
    // Allow for decimal pixel values
    var updatePosition = function updatePosition(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed) {
      var result = {};
      var valueX = (horizontalSpeed ? horizontalSpeed : speed) * (100 * (1 - percentageX));
      var valueY = (verticalSpeed ? verticalSpeed : speed) * (100 * (1 - percentageY));

      result.x = self.options.round ? Math.round(valueX) : Math.round(valueX * 100) / 100;
      result.y = self.options.round ? Math.round(valueY) : Math.round(valueY * 100) / 100;

      return result;
    };

    // Remove event listeners and loop again
    var deferredUpdate = function deferredUpdate() {
      window.removeEventListener('resize', deferredUpdate);
      window.removeEventListener('orientationchange', deferredUpdate);
      (self.options.wrapper ? self.options.wrapper : window).removeEventListener('scroll', deferredUpdate);
      (self.options.wrapper ? self.options.wrapper : document).removeEventListener('touchmove', deferredUpdate);

      // loop again
      loopId = loop(update);
    };

    // Loop
    var update = function update() {
      if (setPosition() && pause === false) {
        animate();

        // loop again
        loopId = loop(update);
      } else {
        loopId = null;

        // Don't animate until we get a position updating event
        window.addEventListener('resize', deferredUpdate);
        window.addEventListener('orientationchange', deferredUpdate);
        (self.options.wrapper ? self.options.wrapper : window).addEventListener('scroll', deferredUpdate, supportsPassive ? { passive: true } : false);
        (self.options.wrapper ? self.options.wrapper : document).addEventListener('touchmove', deferredUpdate, supportsPassive ? { passive: true } : false);
      }
    };

    // Transform3d on parallax element
    var animate = function animate() {
      var positions;
      for (var i = 0; i < self.elems.length; i++) {
        // Determine relevant movement directions
        var verticalScrollAxis = blocks[i].verticalScrollAxis.toLowerCase();
        var horizontalScrollAxis = blocks[i].horizontalScrollAxis.toLowerCase();
        var verticalScrollX = verticalScrollAxis.indexOf("x") != -1 ? posY : 0;
        var verticalScrollY = verticalScrollAxis.indexOf("y") != -1 ? posY : 0;
        var horizontalScrollX = horizontalScrollAxis.indexOf("x") != -1 ? posX : 0;
        var horizontalScrollY = horizontalScrollAxis.indexOf("y") != -1 ? posX : 0;

        var percentageY = (verticalScrollY + horizontalScrollY - blocks[i].top + screenY) / (blocks[i].height + screenY);
        var percentageX = (verticalScrollX + horizontalScrollX - blocks[i].left + screenX) / (blocks[i].width + screenX);

        // Subtracting initialize value, so element stays in same spot as HTML
        positions = updatePosition(percentageX, percentageY, blocks[i].speed, blocks[i].verticalSpeed, blocks[i].horizontalSpeed);
        var positionY = positions.y - blocks[i].baseY;
        var positionX = positions.x - blocks[i].baseX;

        // The next two "if" blocks go like this:
        // Check if a limit is defined (first "min", then "max");
        // Check if we need to change the Y or the X
        // (Currently working only if just one of the axes is enabled)
        // Then, check if the new position is inside the allowed limit
        // If so, use new position. If not, set position to limit.

        // Check if a min limit is defined
        if (blocks[i].min !== null) {
          if (self.options.vertical && !self.options.horizontal) {
            positionY = positionY <= blocks[i].min ? blocks[i].min : positionY;
          }
          if (self.options.horizontal && !self.options.vertical) {
            positionX = positionX <= blocks[i].min ? blocks[i].min : positionX;
          }
        }

        // Check if directional min limits are defined
        if (blocks[i].minY != null) {
          positionY = positionY <= blocks[i].minY ? blocks[i].minY : positionY;
        }
        if (blocks[i].minX != null) {
          positionX = positionX <= blocks[i].minX ? blocks[i].minX : positionX;
        }

        // Check if a max limit is defined
        if (blocks[i].max !== null) {
          if (self.options.vertical && !self.options.horizontal) {
            positionY = positionY >= blocks[i].max ? blocks[i].max : positionY;
          }
          if (self.options.horizontal && !self.options.vertical) {
            positionX = positionX >= blocks[i].max ? blocks[i].max : positionX;
          }
        }

        // Check if directional max limits are defined
        if (blocks[i].maxY != null) {
          positionY = positionY >= blocks[i].maxY ? blocks[i].maxY : positionY;
        }
        if (blocks[i].maxX != null) {
          positionX = positionX >= blocks[i].maxX ? blocks[i].maxX : positionX;
        }

        var zindex = blocks[i].zindex;

        // Move that element
        // (Set the new translation and append initial inline transforms.)
        var translate = 'translate3d(' + (self.options.horizontal ? positionX : '0') + 'px,' + (self.options.vertical ? positionY : '0') + 'px,' + zindex + 'px) ' + blocks[i].transform;
        self.elems[i].style[transformProp] = translate;
      }
      self.options.callback(positions);
    };

    self.destroy = function () {
      for (var i = 0; i < self.elems.length; i++) {
        self.elems[i].style.cssText = blocks[i].style;
      }

      // Remove resize event listener if not pause, and pause
      if (!pause) {
        window.removeEventListener('resize', init);
        pause = true;
      }

      // Clear the animation loop to prevent possible memory leak
      clearLoop(loopId);
      loopId = null;
    };

    // Init
    init();

    // Allow to recalculate the initial values whenever we want
    self.refresh = init;

    return self;
  };
  return Rellax;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[37])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmNvcmUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5ib3guanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwic3JjL2pzL0FwcC5qcyIsInNyYy9qcy9Db21wb25lbnRNYXAuanMiLCJzcmMvanMvQ29uc3RhbnRzL2FyaWEuanMiLCJzcmMvanMvQ29uc3RhbnRzL2NsYXNzLW5hbWVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9lbmRwb2ludHMuanMiLCJzcmMvanMvQ29uc3RhbnRzL2Vycm9ycy5qcyIsInNyYy9qcy9Db25zdGFudHMvZXZlbnRzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9pbmRleC5qcyIsInNyYy9qcy9Db25zdGFudHMva2V5LWNvZGVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9taXNjLmpzIiwic3JjL2pzL0NvbnN0YW50cy9zZWxlY3RvcnMuanMiLCJzcmMvanMvVXRpbHMvZGVib3VuY2UuanMiLCJzcmMvanMvVXRpbHMvZ2V0Y29va2llLmpzIiwic3JjL2pzL1V0aWxzL2luZGV4LmpzIiwic3JjL2pzL1V0aWxzL2lzc2Nyb2xsZWRpbnRvdmlldy5qcyIsInNyYy9qcy9VdGlscy9vcGVucG9wdXAuanMiLCJzcmMvanMvVXRpbHMvcmFuZG9tc2VjdXJlc3RyaW5nLmpzIiwic3JjL2pzL1V0aWxzL3Njcm9sbHRvLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvQ2xpY2tTZXJ2aWNlLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvUmVzaXplU2VydmljZS5qcyIsInNyYy9qcy9jb21wb25lbnRzL3NlcnZpY2VzL1Njcm9sbFNlcnZpY2UuanMiLCJzcmMvanMvY29tcG9uZW50cy9zZXJ2aWNlcy9pbmRleC5qcyIsInNyYy9qcy9jb21wb25lbnRzL3ZpZXdzL0ZpbGUuanMiLCJzcmMvanMvY29tcG9uZW50cy92aWV3cy9JblZpZXdwb3J0LmpzIiwic3JjL2pzL2NvbXBvbmVudHMvdmlld3MvTmF2LmpzIiwic3JjL2pzL2NvbXBvbmVudHMvdmlld3MvVmlkZW8uanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9tb2R1bGVzL3NvY2lhbFNoYXJlLmpzIiwic3JjL2pzL3ZlbmRvci9fcmVsbGF4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO3NSQ0FBLENBQUMsVUFBUyxDQUFULEVBQVk7O0FBRWI7O0FBRUEsTUFBSSxxQkFBcUIsT0FBekI7O0FBRUE7QUFDQTtBQUNBLE1BQUksYUFBYTtBQUNmLGFBQVMsa0JBRE07O0FBR2Y7OztBQUdBLGNBQVUsRUFOSzs7QUFRZjs7O0FBR0EsWUFBUSxFQVhPOztBQWFmOzs7QUFHQSxTQUFLLGVBQVU7QUFDYixhQUFPLEVB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QUFDQTs7QUFFQTtBQUNBLFNBQUssT0FBTCxHQUFlLElBQWY7O0FBRUEsV0FBTyxJQUFQO0FBQ0QsR0FyZEQ7QUFzZEEsU0FBTyxNQUFQO0FBQ0QsQ0FyZUEsQ0FBRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjMuMSc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBldGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYgKCd0cnVlJyA9PT0gc3RyKSByZXR1cm4gdHJ1ZTtcbiAgZWxzZSBpZiAoJ2ZhbHNlJyA9PT0gc3RyKSByZXR1cm4gZmFsc2U7XG4gIGVsc2UgaWYgKCFpc05hTihzdHIgKiAxKSkgcmV0dXJuIHBhcnNlRmxvYXQoc3RyKTtcbiAgcmV0dXJuIHN0cjtcbn1cbi8vIENvbnZlcnQgUGFzY2FsQ2FzZSB0byBrZWJhYi1jYXNlXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcbmZ1bmN0aW9uIGh5cGhlbmF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogT2ZmQ2FudmFzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vZmZjYW52YXNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBPZmZDYW52YXMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT2ZmQ2FudmFzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKCk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPZmZDYW52YXMnKVxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09mZkNhbnZhcycsIHtcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhgaXMtdHJhbnNpdGlvbi0ke3RoaXMub3B0aW9ucy50cmFuc2l0aW9ufWApO1xuXG4gICAgLy8gRmluZCB0cmlnZ2VycyB0aGF0IGFmZmVjdCB0aGlzIGVsZW1lbnQgYW5kIGFkZCBhcmlhLWV4cGFuZGVkIHRvIHRoZW1cbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoZG9jdW1lbnQpXG4gICAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcblxuICAgIC8vIEFkZCBhbiBvdmVybGF5IG92ZXIgdGhlIGNvbnRlbnQgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHZhciBvdmVybGF5UG9zaXRpb24gPSAkKHRoaXMuJGVsZW1lbnQpLmNzcyhcInBvc2l0aW9uXCIpID09PSAnZml4ZWQnID8gJ2lzLW92ZXJsYXktZml4ZWQnIDogJ2lzLW92ZXJsYXktYWJzb2x1dGUnO1xuICAgICAgb3ZlcmxheS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2pzLW9mZi1jYW52YXMtb3ZlcmxheSAnICsgb3ZlcmxheVBvc2l0aW9uKTtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSAkKG92ZXJsYXkpO1xuICAgICAgaWYob3ZlcmxheVBvc2l0aW9uID09PSAnaXMtb3ZlcmxheS1maXhlZCcpIHtcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLiRvdmVybGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hcHBlbmQodGhpcy4kb3ZlcmxheSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPSB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCB8fCBuZXcgUmVnRXhwKHRoaXMub3B0aW9ucy5yZXZlYWxDbGFzcywgJ2cnKS50ZXN0KHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnJldmVhbE9uID0gdGhpcy5vcHRpb25zLnJldmVhbE9uIHx8IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8ocmV2ZWFsLWZvci1tZWRpdW18cmV2ZWFsLWZvci1sYXJnZSkvZylbMF0uc3BsaXQoJy0nKVsyXTtcbiAgICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID0gcGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgkKCdbZGF0YS1vZmYtY2FudmFzXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKS5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAna2V5ZG93bi56Zi5vZmZjYW52YXMnOiB0aGlzLl9oYW5kbGVLZXlib2FyZC5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSkge1xuICAgICAgdmFyICR0YXJnZXQgPSB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPyB0aGlzLiRvdmVybGF5IDogJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpO1xuICAgICAgJHRhcmdldC5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGV2ZW50IGxpc3RlbmVyIGZvciBlbGVtZW50cyB0aGF0IHdpbGwgcmV2ZWFsIGF0IGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0TVFDaGVja2VyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzLnJldmVhbChmYWxzZSk7XG4gICAgICB9XG4gICAgfSkub25lKCdsb2FkLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1JldmVhbGVkIC0gdHJ1ZSBpZiBlbGVtZW50IHNob3VsZCBiZSByZXZlYWxlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICByZXZlYWwoaXNSZXZlYWxlZCkge1xuICAgIHZhciAkY2xvc2VyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKTtcbiAgICBpZiAoaXNSZXZlYWxlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdvcGVuLnpmLnRyaWdnZXIgdG9nZ2xlLnpmLnRyaWdnZXInKTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkgeyAkY2xvc2VyLmhpZGUoKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKVxuICAgICAgfSk7XG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHtcbiAgICAgICAgJGNsb3Nlci5zaG93KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHNjcm9sbGluZyBvZiB0aGUgYm9keSB3aGVuIG9mZmNhbnZhcyBpcyBvcGVuIG9uIG1vYmlsZSBTYWZhcmkgYW5kIG90aGVyIHRyb3VibGVzb21lIGJyb3dzZXJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3N0b3BTY3JvbGxpbmcoZXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUYWtlbiBhbmQgYWRhcHRlZCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTY4ODk0NDcvcHJldmVudC1mdWxsLXBhZ2Utc2Nyb2xsaW5nLWlvc1xuICAvLyBPbmx5IHJlYWxseSB3b3JrcyBmb3IgeSwgbm90IHN1cmUgaG93IHRvIGV4dGVuZCB0byB4IG9yIGlmIHdlIG5lZWQgdG8uXG4gIF9yZWNvcmRTY3JvbGxhYmxlKGV2ZW50KSB7XG4gICAgbGV0IGVsZW0gPSB0aGlzOyAvLyBjYWxsZWQgZnJvbSBldmVudCBoYW5kbGVyIGNvbnRleHQgd2l0aCB0aGlzIGFzIGVsZW1cblxuICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBzY3JvbGxhYmxlIChjb250ZW50IG92ZXJmbG93cyksIHRoZW4uLi5cbiAgICBpZiAoZWxlbS5zY3JvbGxIZWlnaHQgIT09IGVsZW0uY2xpZW50SGVpZ2h0KSB7XG4gICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgdG9wLCBzY3JvbGwgZG93biBvbmUgcGl4ZWwgdG8gYWxsb3cgc2Nyb2xsaW5nIHVwXG4gICAgICBpZiAoZWxlbS5zY3JvbGxUb3AgPT09IDApIHtcbiAgICAgICAgZWxlbS5zY3JvbGxUb3AgPSAxO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UncmUgYXQgdGhlIGJvdHRvbSwgc2Nyb2xsIHVwIG9uZSBwaXhlbCB0byBhbGxvdyBzY3JvbGxpbmcgZG93blxuICAgICAgaWYgKGVsZW0uc2Nyb2xsVG9wID09PSBlbGVtLnNjcm9sbEhlaWdodCAtIGVsZW0uY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIGVsZW0uc2Nyb2xsVG9wID0gZWxlbS5zY3JvbGxIZWlnaHQgLSBlbGVtLmNsaWVudEhlaWdodCAtIDE7XG4gICAgICB9XG4gICAgfVxuICAgIGVsZW0uYWxsb3dVcCA9IGVsZW0uc2Nyb2xsVG9wID4gMDtcbiAgICBlbGVtLmFsbG93RG93biA9IGVsZW0uc2Nyb2xsVG9wIDwgKGVsZW0uc2Nyb2xsSGVpZ2h0IC0gZWxlbS5jbGllbnRIZWlnaHQpO1xuICAgIGVsZW0ubGFzdFkgPSBldmVudC5vcmlnaW5hbEV2ZW50LnBhZ2VZO1xuICB9XG5cbiAgX3N0b3BTY3JvbGxQcm9wYWdhdGlvbihldmVudCkge1xuICAgIGxldCBlbGVtID0gdGhpczsgLy8gY2FsbGVkIGZyb20gZXZlbnQgaGFuZGxlciBjb250ZXh0IHdpdGggdGhpcyBhcyBlbGVtXG4gICAgbGV0IHVwID0gZXZlbnQucGFnZVkgPCBlbGVtLmxhc3RZO1xuICAgIGxldCBkb3duID0gIXVwO1xuICAgIGVsZW0ubGFzdFkgPSBldmVudC5wYWdlWTtcblxuICAgIGlmKCh1cCAmJiBlbGVtLmFsbG93VXApIHx8IChkb3duICYmIGVsZW0uYWxsb3dEb3duKSkge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI29wZW5lZFxuICAgKi9cbiAgb3BlbihldmVudCwgdHJpZ2dlcikge1xuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodHJpZ2dlcikge1xuICAgICAgdGhpcy4kbGFzdFRyaWdnZXIgPSB0cmlnZ2VyO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VUbyA9PT0gJ3RvcCcpIHtcbiAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvID09PSAnYm90dG9tJykge1xuICAgICAgd2luZG93LnNjcm9sbFRvKDAsZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI29wZW5lZFxuICAgICAqL1xuICAgIF90aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1vcGVuJylcblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKVxuICAgICAgICAudHJpZ2dlcignb3BlbmVkLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgLy8gSWYgYGNvbnRlbnRTY3JvbGxgIGlzIHNldCB0byBmYWxzZSwgYWRkIGNsYXNzIGFuZCBkaXNhYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtb2ZmLWNhbnZhcy1vcGVuJykub24oJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxpbmcpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigndG91Y2hzdGFydCcsIHRoaXMuX3JlY29yZFNjcm9sbGFibGUpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbFByb3BhZ2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgPT09IHRydWUgJiYgdGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdpcy1jbG9zYWJsZScpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQodGhpcy4kZWxlbWVudCksIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy4kZWxlbWVudC5maW5kKCdhLCBidXR0b24nKS5lcSgwKS5mb2N1cygpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC50cmFwRm9jdXModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYiB0byBmaXJlIGFmdGVyIGNsb3N1cmUuXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjY2xvc2VkXG4gICAqL1xuICBjbG9zZShjYikge1xuICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAgICogQGV2ZW50IE9mZkNhbnZhcyNjbG9zZWRcbiAgICAgICAqL1xuICAgICAgICAudHJpZ2dlcignY2xvc2VkLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgLy8gSWYgYGNvbnRlbnRTY3JvbGxgIGlzIHNldCB0byBmYWxzZSwgcmVtb3ZlIGNsYXNzIGFuZCByZS1lbmFibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vZmYoJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxpbmcpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ3RvdWNoc3RhcnQnLCB0aGlzLl9yZWNvcmRTY3JvbGxhYmxlKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsUHJvcGFnYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkucmVtb3ZlQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSAmJiB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkucmVtb3ZlQ2xhc3MoJ2lzLWNsb3NhYmxlJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWxlYXNlRm9jdXModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9mZi1jYW52YXMgbWVudSBvcGVuIG9yIGNsb3NlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqL1xuICB0b2dnbGUoZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICB0aGlzLmNsb3NlKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oZXZlbnQsIHRyaWdnZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGlucHV0IHdoZW4gZGV0ZWN0ZWQuIFdoZW4gdGhlIGVzY2FwZSBrZXkgaXMgcHJlc3NlZCwgdGhlIG9mZi1jYW52YXMgbWVudSBjbG9zZXMsIGFuZCBmb2N1cyBpcyByZXN0b3JlZCB0byB0aGUgZWxlbWVudCB0aGF0IG9wZW5lZCB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGFuZGxlS2V5Ym9hcmQoZSkge1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdPZmZDYW52YXMnLCB7XG4gICAgICBjbG9zZTogKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyLmZvY3VzKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGhhbmRsZWQ6ICgpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBvZmZjYW52YXMgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jbG9zZSgpO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJyk7XG4gICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5vZmZjYW52YXMnKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5PZmZDYW52YXMuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgdXNlciB0byBjbGljayBvdXRzaWRlIG9mIHRoZSBtZW51IHRvIGNsb3NlIGl0LlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gb3ZlcmxheSBvbiB0b3Agb2YgYFtkYXRhLW9mZi1jYW52YXMtY29udGVudF1gLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjb250ZW50T3ZlcmxheTogdHJ1ZSxcblxuICAvKipcbiAgICogRW5hYmxlL2Rpc2FibGUgc2Nyb2xsaW5nIG9mIHRoZSBtYWluIGNvbnRlbnQgd2hlbiBhbiBvZmYgY2FudmFzIHBhbmVsIGlzIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGNvbnRlbnRTY3JvbGw6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIGluIG1zIHRoZSBvcGVuIGFuZCBjbG9zZSB0cmFuc2l0aW9uIHJlcXVpcmVzLiBJZiBub25lIHNlbGVjdGVkLCBwdWxscyBmcm9tIGJvZHkgc3R5bGUuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge251bWJlcn1cbiAgICogQGRlZmF1bHQgMFxuICAgKi9cbiAgdHJhbnNpdGlvblRpbWU6IDAsXG5cbiAgLyoqXG4gICAqIFR5cGUgb2YgdHJhbnNpdGlvbiBmb3IgdGhlIG9mZmNhbnZhcyBtZW51LiBPcHRpb25zIGFyZSAncHVzaCcsICdkZXRhY2hlZCcgb3IgJ3NsaWRlJy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBwdXNoXG4gICAqL1xuICB0cmFuc2l0aW9uOiAncHVzaCcsXG5cbiAgLyoqXG4gICAqIEZvcmNlIHRoZSBwYWdlIHRvIHNjcm9sbCB0byB0b3Agb3IgYm90dG9tIG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqIEBkZWZhdWx0IG51bGxcbiAgICovXG4gIGZvcmNlVG86IG51bGwsXG5cbiAgLyoqXG4gICAqIEFsbG93IHRoZSBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4gZm9yIGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBpc1JldmVhbGVkOiBmYWxzZSxcblxuICAvKipcbiAgICogQnJlYWtwb2ludCBhdCB3aGljaCB0byByZXZlYWwuIEpTIHdpbGwgdXNlIGEgUmVnRXhwIHRvIHRhcmdldCBzdGFuZGFyZCBjbGFzc2VzLCBpZiBjaGFuZ2luZyBjbGFzc25hbWVzLCBwYXNzIHlvdXIgY2xhc3Mgd2l0aCB0aGUgYHJldmVhbENsYXNzYCBvcHRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUgez9zdHJpbmd9XG4gICAqIEBkZWZhdWx0IG51bGxcbiAgICovXG4gIHJldmVhbE9uOiBudWxsLFxuXG4gIC8qKlxuICAgKiBGb3JjZSBmb2N1cyB0byB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uIElmIHRydWUsIHdpbGwgZm9jdXMgdGhlIG9wZW5pbmcgdHJpZ2dlciBvbiBjbG9zZS5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgYXV0b0ZvY3VzOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB1c2VkIHRvIGZvcmNlIGFuIG9mZmNhbnZhcyB0byByZW1haW4gb3Blbi4gRm91bmRhdGlvbiBkZWZhdWx0cyBmb3IgdGhpcyBhcmUgYHJldmVhbC1mb3ItbGFyZ2VgICYgYHJldmVhbC1mb3ItbWVkaXVtYC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKiBAZGVmYXVsdCByZXZlYWwtZm9yLVxuICAgKiBAdG9kbyBpbXByb3ZlIHRoZSByZWdleCB0ZXN0aW5nIGZvciB0aGlzLlxuICAgKi9cbiAgcmV2ZWFsQ2xhc3M6ICdyZXZlYWwtZm9yLScsXG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIG9wdGlvbmFsIGZvY3VzIHRyYXBwaW5nIHdoZW4gb3BlbmluZyBhbiBvZmZjYW52YXMuIFNldHMgdGFiaW5kZXggb2YgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XSB0byAtMSBmb3IgYWNjZXNzaWJpbGl0eSBwdXJwb3Nlcy5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHRyYXBGb2N1czogZmFsc2Vcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKE9mZkNhbnZhcywgJ09mZkNhbnZhcycpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbkZvdW5kYXRpb24uQm94ID0ge1xuICBJbU5vdFRvdWNoaW5nWW91OiBJbU5vdFRvdWNoaW5nWW91LFxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXG59XG5cbi8qKlxuICogQ29tcGFyZXMgdGhlIGRpbWVuc2lvbnMgb2YgYW4gZWxlbWVudCB0byBhIGNvbnRhaW5lciBhbmQgZGV0ZXJtaW5lcyBjb2xsaXNpb24gZXZlbnRzIHdpdGggY29udGFpbmVyLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdGVzdCBmb3IgY29sbGlzaW9ucy5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBwYXJlbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBhcyBib3VuZGluZyBjb250YWluZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxuICogQHBhcmFtIHtCb29sZWFufSB0Yk9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayB0b3AgYW5kIGJvdHRvbSB2YWx1ZXMgb25seS5cbiAqIEBkZWZhdWx0IGlmIG5vIHBhcmVudCBvYmplY3QgcGFzc2VkLCBkZXRlY3RzIGNvbGxpc2lvbnMgd2l0aCBgd2luZG93YC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIEltTm90VG91Y2hpbmdZb3UoZWxlbWVudCwgcGFyZW50LCBsck9ubHksIHRiT25seSkge1xuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XG5cbiAgaWYgKHBhcmVudCkge1xuICAgIHZhciBwYXJEaW1zID0gR2V0RGltZW5zaW9ucyhwYXJlbnQpO1xuXG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IHBhckRpbXMuaGVpZ2h0ICsgcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IHBhckRpbXMud2lkdGggKyBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgLSAkZWxlRGltcy53aWR0aCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgfVxufVxuXG59KGpRdWVyeSk7XG4iLCIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoaXMgdXRpbCB3YXMgY3JlYXRlZCBieSBNYXJpdXMgT2xiZXJ0eiAqXG4gKiBQbGVhc2UgdGhhbmsgTWFyaXVzIG9uIEdpdEh1YiAvb3dsYmVydHogKlxuICogb3IgdGhlIHdlYiBodHRwOi8vd3d3Lm1hcml1c29sYmVydHouZGUvICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4ndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IGtleUNvZGVzID0ge1xuICA5OiAnVEFCJyxcbiAgMTM6ICdFTlRFUicsXG4gIDI3OiAnRVNDQVBFJyxcbiAgMzI6ICdTUEFDRScsXG4gIDM3OiAnQVJST1dfTEVGVCcsXG4gIDM4OiAnQVJST1dfVVAnLFxuICAzOTogJ0FSUk9XX1JJR0hUJyxcbiAgNDA6ICdBUlJPV19ET1dOJ1xufVxuXG52YXIgY29tbWFuZHMgPSB7fVxuXG52YXIgS2V5Ym9hcmQgPSB7XG4gIGtleXM6IGdldEtleUNvZGVzKGtleUNvZGVzKSxcblxuICAvKipcbiAgICogUGFyc2VzIHRoZSAoa2V5Ym9hcmQpIGV2ZW50IGFuZCByZXR1cm5zIGEgU3RyaW5nIHRoYXQgcmVwcmVzZW50cyBpdHMga2V5XG4gICAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICogQHJldHVybiBTdHJpbmcga2V5IC0gU3RyaW5nIHRoYXQgcmVwcmVzZW50cyB0aGUga2V5IHByZXNzZWRcbiAgICovXG4gIHBhcnNlS2V5KGV2ZW50KSB7XG4gICAgdmFyIGtleSA9IGtleUNvZGVzW2V2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQud2hpY2gpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAvLyBSZW1vdmUgdW4tcHJpbnRhYmxlIGNoYXJhY3RlcnMsIGUuZy4gZm9yIGBmcm9tQ2hhckNvZGVgIGNhbGxzIGZvciBDVFJMIG9ubHkgZXZlbnRzXG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL1xcVysvLCAnJyk7XG5cbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSBrZXkgPSBgQ1RSTF8ke2tleX1gO1xuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcblxuICAgIC8vIFJlbW92ZSB0cmFpbGluZyB1bmRlcnNjb3JlLCBpbiBjYXNlIG9ubHkgbW9kaWZpZXJzIHdlcmUgdXNlZCAoZS5nLiBvbmx5IGBDVFJMX0FMVGApXG4gICAga2V5ID0ga2V5LnJlcGxhY2UoL18kLywgJycpO1xuXG4gICAgcmV0dXJuIGtleTtcbiAgfSxcblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgZ2l2ZW4gKGtleWJvYXJkKSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50J3MgbmFtZSwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEBwYXJhbSB7T2JqZWN0c30gZnVuY3Rpb25zIC0gY29sbGVjdGlvbiBvZiBmdW5jdGlvbnMgdGhhdCBhcmUgdG8gYmUgZXhlY3V0ZWRcbiAgICovXG4gIGhhbmRsZUtleShldmVudCwgY29tcG9uZW50LCBmdW5jdGlvbnMpIHtcbiAgICB2YXIgY29tbWFuZExpc3QgPSBjb21tYW5kc1tjb21wb25lbnRdLFxuICAgICAga2V5Q29kZSA9IHRoaXMucGFyc2VLZXkoZXZlbnQpLFxuICAgICAgY21kcyxcbiAgICAgIGNvbW1hbmQsXG4gICAgICBmbjtcblxuICAgIGlmICghY29tbWFuZExpc3QpIHJldHVybiBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCBub3QgZGVmaW5lZCEnKTtcblxuICAgIGlmICh0eXBlb2YgY29tbWFuZExpc3QubHRyID09PSAndW5kZWZpbmVkJykgeyAvLyB0aGlzIGNvbXBvbmVudCBkb2VzIG5vdCBkaWZmZXJlbnRpYXRlIGJldHdlZW4gbHRyIGFuZCBydGxcbiAgICAgICAgY21kcyA9IGNvbW1hbmRMaXN0OyAvLyB1c2UgcGxhaW4gbGlzdFxuICAgIH0gZWxzZSB7IC8vIG1lcmdlIGx0ciBhbmQgcnRsOiBpZiBkb2N1bWVudCBpcyBydGwsIHJ0bCBvdmVyd3JpdGVzIGx0ciBhbmQgdmljZSB2ZXJzYVxuICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5sdHIsIGNvbW1hbmRMaXN0LnJ0bCk7XG5cbiAgICAgICAgZWxzZSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0LnJ0bCwgY29tbWFuZExpc3QubHRyKTtcbiAgICB9XG4gICAgY29tbWFuZCA9IGNtZHNba2V5Q29kZV07XG5cbiAgICBmbiA9IGZ1bmN0aW9uc1tjb21tYW5kXTtcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gIGlmIGV4aXN0c1xuICAgICAgdmFyIHJldHVyblZhbHVlID0gZm4uYXBwbHkoKTtcbiAgICAgIGlmIChmdW5jdGlvbnMuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLmhhbmRsZWQocmV0dXJuVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZnVuY3Rpb25zLnVuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLnVuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIG5vdCBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLnVuaGFuZGxlZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRmluZHMgYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gdGhlIGdpdmVuIGAkZWxlbWVudGBcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBzZWFyY2ggd2l0aGluXG4gICAqIEByZXR1cm4ge2pRdWVyeX0gJGZvY3VzYWJsZSAtIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIGAkZWxlbWVudGBcbiAgICovXG4gIGZpbmRGb2N1c2FibGUoJGVsZW1lbnQpIHtcbiAgICBpZighJGVsZW1lbnQpIHtyZXR1cm4gZmFsc2U7IH1cbiAgICByZXR1cm4gJGVsZW1lbnQuZmluZCgnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgKlt0YWJpbmRleF0sICpbY29udGVudGVkaXRhYmxlXScpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIGlmICghJCh0aGlzKS5pcygnOnZpc2libGUnKSB8fCAkKHRoaXMpLmF0dHIoJ3RhYmluZGV4JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfSAvL29ubHkgaGF2ZSB2aXNpYmxlIGVsZW1lbnRzIGFuZCB0aG9zZSB0aGF0IGhhdmUgYSB0YWJpbmRleCBncmVhdGVyIG9yIGVxdWFsIDBcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgbmFtZSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEByZXR1cm4gU3RyaW5nIGNvbXBvbmVudE5hbWVcbiAgICovXG5cbiAgcmVnaXN0ZXIoY29tcG9uZW50TmFtZSwgY21kcykge1xuICAgIGNvbW1hbmRzW2NvbXBvbmVudE5hbWVdID0gY21kcztcbiAgfSwgIFxuXG4gIC8qKlxuICAgKiBUcmFwcyB0aGUgZm9jdXMgaW4gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gJGVsZW1lbnQgIGpRdWVyeSBvYmplY3QgdG8gdHJhcCB0aGUgZm91Y3MgaW50by5cbiAgICovXG4gIHRyYXBGb2N1cygkZWxlbWVudCkge1xuICAgIHZhciAkZm9jdXNhYmxlID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKCRlbGVtZW50KSxcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlID0gJGZvY3VzYWJsZS5lcSgwKSxcbiAgICAgICAgJGxhc3RGb2N1c2FibGUgPSAkZm9jdXNhYmxlLmVxKC0xKTtcblxuICAgICRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnRyYXBmb2N1cycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSAkbGFzdEZvY3VzYWJsZVswXSAmJiBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGV2ZW50KSA9PT0gJ1RBQicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGZpcnN0Rm9jdXNhYmxlLmZvY3VzKCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChldmVudC50YXJnZXQgPT09ICRmaXJzdEZvY3VzYWJsZVswXSAmJiBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGV2ZW50KSA9PT0gJ1NISUZUX1RBQicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGxhc3RGb2N1c2FibGUuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSB0cmFwcGVkIGZvY3VzIGZyb20gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gJGVsZW1lbnQgIGpRdWVyeSBvYmplY3QgdG8gcmVsZWFzZSB0aGUgZm9jdXMgZm9yLlxuICAgKi9cbiAgcmVsZWFzZUZvY3VzKCRlbGVtZW50KSB7XG4gICAgJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnRyYXBmb2N1cycpO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgaWYobmFtZWRRdWVyaWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIG1hdGNoZXMgdG8gYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLCBlaXRoZXIgJ3NtYWxsIG9ubHknIG9yICdzbWFsbCcuIE9taXR0aW5nICdvbmx5JyBmYWxscyBiYWNrIHRvIHVzaW5nIGF0TGVhc3QoKSBtZXRob2QuXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCBkb2VzIG5vdC5cbiAgICovXG4gIGlzKHNpemUpIHtcbiAgICBzaXplID0gc2l6ZS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICBpZihzaXplLmxlbmd0aCA+IDEgJiYgc2l6ZVsxXSA9PT0gJ29ubHknKSB7XG4gICAgICBpZihzaXplWzBdID09PSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpKSByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuYXRMZWFzdChzaXplWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZWRpYSBxdWVyeSBvZiBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfG51bGx9IC0gVGhlIG1lZGlhIHF1ZXJ5IG9mIHRoZSBicmVha3BvaW50LCBvciBgbnVsbGAgaWYgdGhlIGJyZWFrcG9pbnQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIGdldChzaXplKSB7XG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIGlmKHRoaXMucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG4gICAgICAgIGlmIChzaXplID09PSBxdWVyeS5uYW1lKSByZXR1cm4gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCBuYW1lIGJ5IHRlc3RpbmcgZXZlcnkgYnJlYWtwb2ludCBhbmQgcmV0dXJuaW5nIHRoZSBsYXN0IG9uZSB0byBtYXRjaCAodGhlIGJpZ2dlc3Qgb25lKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGN1cnJlbnQgYnJlYWtwb2ludC5cbiAgICovXG4gIF9nZXRDdXJyZW50U2l6ZSgpIHtcbiAgICB2YXIgbWF0Y2hlZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG5cbiAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShxdWVyeS52YWx1ZSkubWF0Y2hlcykge1xuICAgICAgICBtYXRjaGVkID0gcXVlcnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVkID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIG1hdGNoZWQubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBY3RpdmF0ZXMgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlciwgd2hpY2ggZmlyZXMgYW4gZXZlbnQgb24gdGhlIHdpbmRvdyB3aGVuZXZlciB0aGUgYnJlYWtwb2ludCBjaGFuZ2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF93YXRjaGVyKCkge1xuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLm1lZGlhcXVlcnknLCAoKSA9PiB7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCksIGN1cnJlbnRTaXplID0gdGhpcy5jdXJyZW50O1xuXG4gICAgICBpZiAobmV3U2l6ZSAhPT0gY3VycmVudFNpemUpIHtcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1NpemU7XG5cbiAgICAgICAgLy8gQnJvYWRjYXN0IHRoZSBtZWRpYSBxdWVyeSBjaGFuZ2Ugb24gdGhlIHdpbmRvd1xuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgW25ld1NpemUsIGN1cnJlbnRTaXplXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbi8vIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy5cbi8vIEF1dGhvcnMgJiBjb3B5cmlnaHQgKGMpIDIwMTI6IFNjb3R0IEplaGwsIFBhdWwgSXJpc2gsIE5pY2hvbGFzIFpha2FzLCBEYXZpZCBLbmlnaHQuIER1YWwgTUlUL0JTRCBsaWNlbnNlXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XG4gIHZhciBzdHlsZU1lZGlhID0gKHdpbmRvdy5zdHlsZU1lZGlhIHx8IHdpbmRvdy5tZWRpYSk7XG5cbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxuICBpZiAoIXN0eWxlTWVkaWEpIHtcbiAgICB2YXIgc3R5bGUgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyksXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgaW5mbyAgICAgICAgPSBudWxsO1xuXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLmlkICAgID0gJ21hdGNobWVkaWFqcy10ZXN0JztcblxuICAgIHNjcmlwdCAmJiBzY3JpcHQucGFyZW50Tm9kZSAmJiBzY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGUsIHNjcmlwdCk7XG5cbiAgICAvLyAnc3R5bGUuY3VycmVudFN0eWxlJyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICd3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZScgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgIGluZm8gPSAoJ2dldENvbXB1dGVkU3R5bGUnIGluIHdpbmRvdykgJiYgd2luZG93LmdldENvbXB1dGVkU3R5bGUoc3R5bGUsIG51bGwpIHx8IHN0eWxlLmN1cnJlbnRTdHlsZTtcblxuICAgIHN0eWxlTWVkaWEgPSB7XG4gICAgICBtYXRjaE1lZGl1bShtZWRpYSkge1xuICAgICAgICB2YXIgdGV4dCA9IGBAbWVkaWEgJHttZWRpYX17ICNtYXRjaG1lZGlhanMtdGVzdCB7IHdpZHRoOiAxcHg7IH0gfWA7XG5cbiAgICAgICAgLy8gJ3N0eWxlLnN0eWxlU2hlZXQnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3N0eWxlLnRleHRDb250ZW50JyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUZXN0IGlmIG1lZGlhIHF1ZXJ5IGlzIHRydWUgb3IgZmFsc2VcbiAgICAgICAgcmV0dXJuIGluZm8ud2lkdGggPT09ICcxcHgnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihtZWRpYSkge1xuICAgIHJldHVybiB7XG4gICAgICBtYXRjaGVzOiBzdHlsZU1lZGlhLm1hdGNoTWVkaXVtKG1lZGlhIHx8ICdhbGwnKSxcbiAgICAgIG1lZGlhOiBtZWRpYSB8fCAnYWxsJ1xuICAgIH07XG4gIH1cbn0oKSk7XG5cbi8vIFRoYW5rIHlvdTogaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9xdWVyeS1zdHJpbmdcbmZ1bmN0aW9uIHBhcnNlU3R5bGVUb09iamVjdChzdHIpIHtcbiAgdmFyIHN0eWxlT2JqZWN0ID0ge307XG5cbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3RyID0gc3RyLnRyaW0oKS5zbGljZSgxLCAtMSk7IC8vIGJyb3dzZXJzIHJlLXF1b3RlIHN0cmluZyBzdHlsZSB2YWx1ZXNcblxuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0eWxlT2JqZWN0ID0gc3RyLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uKHJldCwgcGFyYW0pIHtcbiAgICB2YXIgcGFydHMgPSBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKS5zcGxpdCgnPScpO1xuICAgIHZhciBrZXkgPSBwYXJ0c1swXTtcbiAgICB2YXIgdmFsID0gcGFydHNbMV07XG4gICAga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGtleSk7XG5cbiAgICAvLyBtaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxuICAgIC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcbiAgICB2YWwgPSB2YWwgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBkZWNvZGVVUklDb21wb25lbnQodmFsKTtcblxuICAgIGlmICghcmV0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldFtrZXldID0gdmFsO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXRba2V5XSkpIHtcbiAgICAgIHJldFtrZXldLnB1c2godmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0W2tleV0gPSBbcmV0W2tleV0sIHZhbF07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sIHt9KTtcblxuICByZXR1cm4gc3R5bGVPYmplY3Q7XG59XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBNb3Rpb24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm1vdGlvblxuICovXG5cbmNvbnN0IGluaXRDbGFzc2VzICAgPSBbJ211aS1lbnRlcicsICdtdWktbGVhdmUnXTtcbmNvbnN0IGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG5jb25zdCBNb3Rpb24gPSB7XG4gIGFuaW1hdGVJbjogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH0sXG5cbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUoZmFsc2UsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vdmUoZHVyYXRpb24sIGVsZW0sIGZuKXtcbiAgdmFyIGFuaW0sIHByb2csIHN0YXJ0ID0gbnVsbDtcbiAgLy8gY29uc29sZS5sb2coJ2NhbGxlZCcpO1xuXG4gIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmUodHMpe1xuICAgIGlmKCFzdGFydCkgc3RhcnQgPSB0cztcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcblxuICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmFkZENsYXNzKGhhc1N1YkNsYXNzKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJGl0ZW0uY2hpbGRyZW4oJ2E6Zmlyc3QnKS50ZXh0KClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyBOb3RlOiAgRHJpbGxkb3ducyBiZWhhdmUgZGlmZmVyZW50bHkgaW4gaG93IHRoZXkgaGlkZSwgYW5kIHNvIG5lZWRcbiAgICAgICAgICAvLyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMuICBXZSBzaG91bGQgbG9vayBpZiB0aGlzIHBvc3NpYmx5IG92ZXItZ2VuZXJhbGl6ZWRcbiAgICAgICAgICAvLyB1dGlsaXR5IChOZXN0KSBpcyBhcHByb3ByaWF0ZSB3aGVuIHdlIHJld29yayBtZW51cyBpbiA2LjRcbiAgICAgICAgICBpZih0eXBlID09PSAnZHJpbGxkb3duJykge1xuICAgICAgICAgICAgJGl0ZW0uYXR0cih7J2FyaWEtZXhwYW5kZWQnOiBmYWxzZX0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAkc3ViXG4gICAgICAgICAgLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2RhdGEtc3VibWVudSc6ICcnLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgaWYodHlwZSA9PT0gJ2RyaWxsZG93bicpIHtcbiAgICAgICAgICAkc3ViLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAkaXRlbS5hZGRDbGFzcyhgaXMtc3VibWVudS1pdGVtICR7c3ViSXRlbUNsYXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIEJ1cm4obWVudSwgdHlwZSkge1xuICAgIHZhciAvL2l0ZW1zID0gbWVudS5maW5kKCdsaScpLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51XG4gICAgICAuZmluZCgnPmxpLCAubWVudSwgLm1lbnUgPiBsaScpXG4gICAgICAucmVtb3ZlQ2xhc3MoYCR7c3ViTWVudUNsYXNzfSAke3N1Ykl0ZW1DbGFzc30gJHtoYXNTdWJDbGFzc30gaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlYClcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyggICAgICBtZW51LmZpbmQoJy4nICsgc3ViTWVudUNsYXNzICsgJywgLicgKyBzdWJJdGVtQ2xhc3MgKyAnLCAuaGFzLXN1Ym1lbnUsIC5pcy1zdWJtZW51LWl0ZW0sIC5zdWJtZW51LCBbZGF0YS1zdWJtZW51XScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnIGhhcy1zdWJtZW51IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51JylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpKTtcbiAgICAvLyBpdGVtcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgLy8gICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgIC8vICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcbiAgICAvLyAgIGlmKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xuICAgIC8vICAgfVxuICAgIC8vICAgaWYoJHN1Yi5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaGFzLXN1Ym1lbnUnKTtcbiAgICAvLyAgICAgJHN1Yi5yZW1vdmVDbGFzcygnc3VibWVudSAnICsgc3ViTWVudUNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk5lc3QgPSBOZXN0O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmZ1bmN0aW9uIFRpbWVyKGVsZW0sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBkdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24sLy9vcHRpb25zIGlzIGFuIG9iamVjdCBmb3IgZWFzaWx5IGFkZGluZyBmZWF0dXJlcyBsYXRlci5cbiAgICAgIG5hbWVTcGFjZSA9IE9iamVjdC5rZXlzKGVsZW0uZGF0YSgpKVswXSB8fCAndGltZXInLFxuICAgICAgcmVtYWluID0gLTEsXG4gICAgICBzdGFydCxcbiAgICAgIHRpbWVyO1xuXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcblxuICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZW1haW4gPSAtMTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgfVxuXG4gIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgLy8gaWYoIWVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICByZW1haW4gPSByZW1haW4gPD0gMCA/IGR1cmF0aW9uIDogcmVtYWluO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgZmFsc2UpO1xuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG9wdGlvbnMuaW5maW5pdGUpe1xuICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXG4gICAgICB9XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyBDaGVjayBpZiBpbWFnZSBpcyBsb2FkZWRcbiAgICBpZiAodGhpcy5jb21wbGV0ZSB8fCAodGhpcy5yZWFkeVN0YXRlID09PSA0KSB8fCAodGhpcy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgLy8gRm9yY2UgbG9hZCB0aGUgaW1hZ2VcbiAgICBlbHNlIHtcbiAgICAgIC8vIGZpeCBmb3IgSUUuIFNlZSBodHRwczovL2Nzcy10cmlja3MuY29tL3NuaXBwZXRzL2pxdWVyeS9maXhpbmctbG9hZC1pbi1pZS1mb3ItY2FjaGVkLWltYWdlcy9cbiAgICAgIHZhciBzcmMgPSAkKHRoaXMpLmF0dHIoJ3NyYycpO1xuICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBzcmMgKyAoc3JjLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSkpO1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IG5ldyB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG4gIH0gZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCd0b2dnbGUuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5vbignbG9hZCcsICgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgbXV0YXRlTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbXV0YXRlTGlzdGVuZXIoZGVib3VuY2UpIHtcbiAgICBsZXQgJG5vZGVzID0gJCgnW2RhdGEtbXV0YXRlXScpO1xuICAgIGlmICgkbm9kZXMubGVuZ3RoICYmIE11dGF0aW9uT2JzZXJ2ZXIpe1xuXHRcdFx0Ly90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0ZSBldmVudFxuICAgICAgLy9ubyBJRSA5IG9yIDEwXG5cdFx0XHQkbm9kZXMuZWFjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcblx0XHRcdH0pO1xuICAgIH1cbiB9XG5cbmZ1bmN0aW9uIGV2ZW50c0xpc3RlbmVyKCkge1xuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxuICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZXNpemVdLCBbZGF0YS1zY3JvbGxdLCBbZGF0YS1tdXRhdGVdJyk7XG5cbiAgLy9lbGVtZW50IGNhbGxiYWNrXG4gIHZhciBsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uID0gZnVuY3Rpb24gKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnRhcmdldCk7XG5cblx0ICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXG4gICAgICBzd2l0Y2ggKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udHlwZSkge1xuXG4gICAgICAgIGNhc2UgXCJhdHRyaWJ1dGVzXCI6XG4gICAgICAgICAgaWYgKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpID09PSBcInNjcm9sbFwiICYmIG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJkYXRhLWV2ZW50c1wiKSB7XG5cdFx0ICBcdCR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInLCBbJHRhcmdldCwgd2luZG93LnBhZ2VZT2Zmc2V0XSk7XG5cdFx0ICB9XG5cdFx0ICBpZiAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikgPT09IFwicmVzaXplXCIgJiYgbXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcImRhdGEtZXZlbnRzXCIpIHtcblx0XHQgIFx0JHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XG5cdFx0ICAgfVxuXHRcdCAgaWYgKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG5cdFx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikuYXR0cihcImRhdGEtZXZlbnRzXCIsXCJtdXRhdGVcIik7XG5cdFx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKV0pO1xuXHRcdCAgfVxuXHRcdCAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImNoaWxkTGlzdFwiOlxuXHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS5hdHRyKFwiZGF0YS1ldmVudHNcIixcIm11dGF0ZVwiKTtcblx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKV0pO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAvL25vdGhpbmdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgLy9mb3IgZWFjaCBlbGVtZW50IHRoYXQgbmVlZHMgdG8gbGlzdGVuIGZvciByZXNpemluZywgc2Nyb2xsaW5nLCBvciBtdXRhdGlvbiBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICB2YXIgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XG4gICAgICAgIGVsZW1lbnRPYnNlcnZlci5vYnNlcnZlKG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUsIGF0dHJpYnV0ZUZpbHRlcjogW1wiZGF0YS1ldmVudHNcIiwgXCJzdHlsZVwiXSB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFtQSF1cbi8vIEZvdW5kYXRpb24uQ2hlY2tXYXRjaGVycyA9IGNoZWNrV2F0Y2hlcnM7XG5Gb3VuZGF0aW9uLklIZWFyWW91ID0gY2hlY2tMaXN0ZW5lcnM7XG4vLyBGb3VuZGF0aW9uLklTZWVZb3UgPSBzY3JvbGxMaXN0ZW5lcjtcbi8vIEZvdW5kYXRpb24uSUZlZWxZb3UgPSBjbG9zZW1lTGlzdGVuZXI7XG5cbn0oalF1ZXJ5KTtcblxuLy8gZnVuY3Rpb24gZG9tTXV0YXRpb25PYnNlcnZlcihkZWJvdW5jZSkge1xuLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cbi8vICAgdmFyIHRpbWVyLFxuLy8gICBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW11dGF0ZV0nKTtcbi8vICAgLy9cbi8vICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuLy8gICAgIC8vIHZhciBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbi8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuLy8gICAgIC8vICAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAvLyAgICAgaWYgKHByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xuLy8gICAgIC8vICAgICB9XG4vLyAgICAgLy8gICB9XG4vLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XG4vLyAgICAgLy8gfSgpKTtcbi8vXG4vL1xuLy8gICAgIC8vZm9yIHRoZSBib2R5LCB3ZSBuZWVkIHRvIGxpc3RlbiBmb3IgYWxsIGNoYW5nZXMgZWZmZWN0aW5nIHRoZSBzdHlsZSBhbmQgY2xhc3MgYXR0cmlidXRlc1xuLy8gICAgIHZhciBib2R5T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihib2R5TXV0YXRpb24pO1xuLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xuLy9cbi8vXG4vLyAgICAgLy9ib2R5IGNhbGxiYWNrXG4vLyAgICAgZnVuY3Rpb24gYm9keU11dGF0aW9uKG11dGF0ZSkge1xuLy8gICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0aW9uIGV2ZW50XG4vLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuLy9cbi8vICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbi8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbi8vICAgICAgICAgJCgnW2RhdGEtbXV0YXRlXScpLmF0dHIoJ2RhdGEtZXZlbnRzJyxcIm11dGF0ZVwiKTtcbi8vICAgICAgIH0sIGRlYm91bmNlIHx8IDE1MCk7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBJblZpZXdwb3J0IGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9JblZpZXdwb3J0JztcbmltcG9ydCBDb21wb25lbnRNYXAgZnJvbSAnLi9Db21wb25lbnRNYXAnO1xuaW1wb3J0IFNlcnZpY2VzIGZyb20gJy4vY29tcG9uZW50cy9zZXJ2aWNlcyc7XG5cbi8qKlxuICogVGhlIHRvcC1sZXZlbCBjb250cm9sbGVyIGZvciB0aGUgd2hvbGUgcGFnZS4gVGhpcyBjb21wb25lbnQgaXMgcmVzcG9uc2libGVcbiAqIGZvciBsb2FkaW5nIG90aGVyIGNvbnRyb2xsZXJzIGFuZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwIHtcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYWxsIGdsb2JhbCBKUyBjb21wb25lbnRzIGFuZCBjYWxsIGBsb2FkY29tcG9uZW50c2BcbiAgICogdG8gaW5pdGlhbGl6ZSBhbGwgdW5pcXVlIEpTIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIFNlcnZpY2VzIGlzIHRoZSBvYmplY3Qgd2hpY2ggaG9sZHMgcmVmZXJlbmNlcyB0byBhbGwgc2VydmljZXNcbiAgICAgKiBjcmVhdGVkIGZvciBwYWdlcy4gU2VydmljZXMgc2hvdWxkIGJlIGluc3RhbnRpYXRlZCB0aGVyZSBhbmRcbiAgICAgKiB0aGVuIHdpbGwgYmUgaW5qZWN0ZWQgaW50byBlYWNoIGNvbXBvbmVudCBmb3Igb3B0aW9uYWwgdXNlIHZpYSB0aGVcbiAgICAgKiBgbG9hZGNvbXBvbmVudHNgIGZ1bmN0aW9uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7U2VydmljZXN9XG4gICAgICogQHByb3BlcnR5IHtTZXJ2aWNlc31cbiAgICAgKi9cbiAgICB0aGlzLlNlcnZpY2VzID0gbmV3IFNlcnZpY2VzKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgSW5WaWV3cG9ydCB2aWV3IGNvbXBvbmVudCB3aGljaCBuZWVkcyB0byBydW4gZ2xvYmFsbHkgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgICAqIEB0eXBlIHtJblZpZXdwb3J0fVxuICAgICAqIEBwcm9wZXJ0eSB7SW5WaWV3cG9ydH1cbiAgICAgKi9cbiAgICB0aGlzLmluVmlld3BvcnQgPSBuZXcgSW5WaWV3cG9ydCh0aGlzLlNlcnZpY2VzKTtcblxuICAgIC8vIExvYWQgZWFjaCBjb21wb25lbnRcbiAgICB0aGlzLmxvYWRQYWdlY29tcG9uZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgZnVuY3Rpb24gbG9vcHMgb3ZlciBhbGwgZWxlbWVudHMgaW4gdGhlIERPTSB3aXRoIHRoZVxuICAgKiBgZGF0YS1sb2FkY29tcG9uZW50YCBhdHRyaWJ1dGUgYW5kIGxvYWRzIHRoZSBzcGVjaWZpZWQgdmlld1xuICAgKiBvciBjb250cm9sbGVyLlxuICAgKlxuICAgKiBUbyBhdHRhY2ggYSBKUyBjb21wb25lbnQgdG8gYW4gSFRNTCBlbGVtZW50LCBpbiB5b3VyIG1hcmt1cCB5b3UnZFxuICAgKiBkbyBzb21ldGhpbmcgbGlrZTogPHNlY3Rpb24gY2xhc3M9XCJleGFtcGxlLWNvbXBvbmVudFwiIGRhdGEtbG9hZGNvbXBvbmVudD0nRXhhbXBsZWNvbXBvbmVudCc+XG4gICAqIHdoZXJlICdFeGFtcGxlY29tcG9uZW50JyBpcyB5b3VyIEpTIGNsYXNzIG5hbWUuIFlvdSdkIG5lZWQgdG8gYWRkIHRoYXQgY29tcG9uZW50IHRvIHRoZSAuL2NvbXBvbmVudE1hcC5qc1xuICAgKiBhbmQgbWFrZSBzdXJlIHRoZSBjb21wb25lbnQgZXhpc3RzIGFuZCBpcyBhIHByb3BlciBFUzYgY2xhc3MsIGFuZCB0aGVuIHlvdSdsbCBlbmQgdXAgd2l0aFxuICAgKiBhbiBFUzYgY2xhc3MgdGhhdCBpcyBwYXNzZWQgYSByZWZlcmVuY2UgdG8gc2VjdGlvbi5leGFtcGxlLWNvbXBvbmVudCBvbiBpbml0LlxuICAgKi9cbiAgbG9hZFBhZ2Vjb21wb25lbnRzKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9ICdkYXRhLWxvYWRjb21wb25lbnQnO1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnWycgKyBhdHRyaWJ1dGUgKyAnXScpLCAoZWxlbWVudCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ2xvYWRpbmcgY29tcG9uZW50ICcsIGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkpO1xuICAgICAgbmV3IENvbXBvbmVudE1hcFtlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpXShlbGVtZW50LCB0aGlzLlNlcnZpY2VzKTtcbiAgICB9KTtcbiAgfVxuXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEltcG9ydCBhbGwgcmVxdWlyZWQgbW9kdWxlc1xuLy8gaW1wb3J0IEhlYWRlciBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvSGVhZGVyJztcbmltcG9ydCBGaWxlIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9GaWxlJztcbmltcG9ydCBOYXYgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL05hdic7XG5pbXBvcnQgVmlkZW8gZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1ZpZGVvJztcbi8vIGltcG9ydCBGb3JtIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9Gb3JtJztcbi8vIGltcG9ydCBGaWx0ZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0ZpbHRlcic7XG4vLyBpbXBvcnQgVmlkZW8gZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1ZpZGVvJztcbi8vIGltcG9ydCBTbGlkZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1NsaWRlcic7XG4vLyBpbXBvcnQgQW5jaG9yIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9BbmNob3InO1xuLy8gaW1wb3J0IFNvY2lhbFNoYXJlIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9Tb2NpYWxTaGFyZSc7XG4vLyBpbXBvcnQgSW5WaWV3cG9ydCBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvSW5WaWV3cG9ydCc7XG4vLyBpbXBvcnQgQmFubmVyIGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9CYW5uZXInO1xuXG4vLyBFeHBvcnQgcmVmZXJlbmNlIHRvIGFsbCBtb2R1bGVzIGluIGFuIG9iamVjdFxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC8vIEhlYWRlcixcbiAgICBGaWxlLFxuICAgIE5hdixcbiAgICBWaWRlbyxcbiAgICAvLyBGb3JtLFxuICAgIC8vIEZpbHRlcixcbiAgICAvLyBWaWRlb1xuICAgIC8vIEFuY2hvcixcbiAgICAvLyBTbGlkZXIsXG4gICAgLy8gU29jaWFsU2hhcmUsXG4gICAgLy8gSW5WaWV3cG9ydCxcbiAgICAvLyBCYW5uZXIsXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEFSSUEgU1RSSU5HU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBBUklBID0ge1xuICBFWFBBTkRFRDogICAgICAgICAgICAgICAgICAgICAgJ2FyaWEtZXhwYW5kZWQnLFxuICBISURERU46ICAgICAgICAgICAgICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJyxcbiAgU0VMRUNURUQ6ICAgICAgICAgICAgICAgICAgICAgICdhcmlhLXNlbGVjdGVkJ1xufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRDTEFTUyBOQU1FUyAtIGZvciBjbGFzcyBuYW1lc1xuLy8gICAgICBub3QgQ1NTIHNlbGVjdG9yc1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBDTEFTU19OQU1FUyA9IHtcbiAgQUJPVkVfQk9UVE9NOiAgICAgICAgICAgICAgICAgICAnYWJvdmUtYm90dG9tJyxcbiAgQUJPVkVfSEFMRldBWTogICAgICAgICAgICAgICAgICAnYWJvdmUtaGFsZndheScsXG4gIEFCT1ZFX1ZJRVdQT1JUOiAgICAgICAgICAgICAgICAgJ2Fib3ZlLXZpZXdwb3J0JyxcbiAgQUNUSVZFOiAgICAgICAgICAgICAgICAgICAgICAgICAnYWN0aXZlJyxcbiAgQkFOTkVSX0FDVElWRTogICAgICAgICAgICAgICAgICAnYmFubmVyLWFjdGl2ZScsXG4gIEJVVFRPTl9TVUJNSVRUSU5HOiAgICAgICAgICAgICAgJ2J1dHRvbi0tc3VibWl0dGluZycsXG4gIEJVVFRPTl9TVUJNSVRURUQ6ICAgICAgICAgICAgICAgJ2J1dHRvbi0tc3VibWl0dGVkJyxcbiAgRVJST1I6ICAgICAgICAgICAgICAgICAgICAgICAgICAnZXJyb3InLFxuICBDTElDSzogICAgICAgICAgICAgICAgICAgICAgICAgICdjbGljaycsXG4gIENMT1NFRDogICAgICAgICAgICAgICAgICAgICAgICAgJ2Nsb3NlZCcsXG4gIEZJUlNUX0JBVENIOiAgICAgICAgICAgICAgICAgICAgJ2ZpcnN0LWJhdGNoJyxcbiAgRklYRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAnbmF2LWZpeGVkJyxcbiAgSElESU5HOiAgICAgICAgICAgICAgICAgICAgICAgICAnaGlkaW5nJyxcbiAgSElEREVOOiAgICAgICAgICAgICAgICAgICAgICAgICAnaGlkZGVuJyxcbiAgSE9WRVI6ICAgICAgICAgICAgICAgICAgICAgICAgICAnaG92ZXInLFxuICBJTlZBTElEOiAgICAgICAgICAgICAgICAgICAgICAgICdpbnZhbGlkJyxcbiAgSU5fVklFV1BPUlQ6ICAgICAgICAgICAgICAgICAgICAnaW4tdmlld3BvcnQnLFxuICBMT0FESU5HOiAgICAgICAgICAgICAgICAgICAgICAgICdsb2FkaW5nJyxcbiAgTUlOSTogICAgICAgICAgICAgICAgICAgICAgICAgICAnbWluaScsXG4gIE9QRU46ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ29wZW4nLFxuICBPUEVORUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICdvcGVuZWQnLFxuICBTQ1JPTExFRDogICAgICAgICAgICAgICAgICAgICAgICdzY3JvbGxlZCcsXG4gIFNFTEVDVEVEOiAgICAgICAgICAgICAgICAgICAgICAgJ3NlbGVjdGVkJyxcbiAgU1VCTUlUVEVEOiAgICAgICAgICAgICAgICAgICAgICAnc3VibWl0dGVkJyxcbiAgVklTVUFMTFlfSElEREVOOiAgICAgICAgICAgICAgICAndmlzdWFsbHktaGlkZGVuJyxcbiAgVkFMSUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsaWQnLFxufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRNSVNDIFNUUklOR1Ncbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBFTkRQT0lOVFMgPSB7XG4gIFNFQVJDSDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvd3AtanNvbi9yZWxldmFuc3NpL3YxL3NlYXJjaD8nLFxuICBXUEFQSTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnL3dwLWpzb24vd3AvdjIvJyxcbiAgV1BBUElUT1RBTDogICAgICAgICAgICAgICAgICAgICAgICAgJ1gtV1AtVG90YWwnXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEVSUk9SIE1lc3NhZ2VzXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEVSUk9SUyA9IHtcbiAgRkVBVFVSRURfSU1BR0U6ICAgICAgICAgICAgICAgICAnQSBmZWF0dXJlZCBpbWFnZSBpcyByZXF1aXJlZCcsXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEVWRU5UU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBFVkVOVFMgPSB7XG4gIEFOSU1BVElPTkVORDogICAgICAgICAgICAgICAgICAgJ2FuaW1hdGlvbmVuZCcsXG4gIEJFRk9SRVVOTE9BRDogICAgICAgICAgICAgICAgICAgJ2JlZm9yZXVubG9hZCcsXG4gIEJMVVI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JsdXInLFxuICBDSEFOR0U6ICAgICAgICAgICAgICAgICAgICAgICAgICdjaGFuZ2UnLFxuICBDTEVBUl9GSUxURVJTOiAgICAgICAgICAgICAgICAgICdjbGVhcmZpbHRlcnMnLFxuICBDTElDSzogICAgICAgICAgICAgICAgICAgICAgICAgICdjbGljaycsXG4gIENVU1RPTV9FVkVOVDogICAgICAgICAgICAgICAgICAgJ2N1c3RvbWV2ZW50JyxcbiAgRElTUExBWV9TVUJIRUFESU5HOiAgICAgICAgICAgICAnZGlzcGxheXN1YmhlYWRpbmcnLFxuICBEUk9QRE9XTl9DSEFOR0VEOiAgICAgICAgICAgICAgICdkcm9wZG93bmNoYW5nZWQnLFxuICBGT1JNX0VSUk9SOiAgICAgICAgICAgICAgICAgICAgICdmb3JtZXJyb3InLFxuICBGT1JNX1NVQ0NFU1M6ICAgICAgICAgICAgICAgICAgICdmb3Jtc3VjY2VzcycsXG4gIEZPQ1VTOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvY3VzJyxcbiAgSEVBREVSX0hJRElORzogICAgICAgICAgICAgICAgICAnaGVhZGVyLWhpZGluZycsXG4gIElOUFVUOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lucHV0JyxcbiAgS0VZX0RPV046ICAgICAgICAgICAgICAgICAgICAgICAna2V5ZG93bicsXG4gIE1PVVNFT1VUOiAgICAgICAgICAgICAgICAgICAgICAgJ21vdXNlb3V0JyxcbiAgTU9VU0VPVkVSOiAgICAgICAgICAgICAgICAgICAgICAnbW91c2VvdmVyJyxcbiAgUEFHRVNIT1c6ICAgICAgICAgICAgICAgICAgICAgICAncGFnZXNob3cnLFxuICBSRVFVRVNUX01BREU6ICAgICAgICAgICAgICAgICAgICdyZXF1ZXN0bWFkZScsXG4gIFJFU0laRTogICAgICAgICAgICAgICAgICAgICAgICAgJ3Jlc2l6ZScsXG4gIFJFU1VMVFNfUkVUVVJORUQ6ICAgICAgICAgICAgICAgJ3Jlc3VsdHNyZXR1cm5kJyxcbiAgU0NST0xMOiAgICAgICAgICAgICAgICAgICAgICAgICAnc2Nyb2xsJyxcbiAgU0lNVUxBVEVEX0NMSUNLOiAgICAgICAgICAgICAgICAnc2ltdWxhdGVkLWNsaWNrJyxcbiAgU0hPV19ISURFOiAgICAgICAgICAgICAgICAgICAgICAnc2hvd2hpZGUnLFxuICBTVUJNSVQ6ICAgICAgICAgICAgICAgICAgICAgICAgICdzdWJtaXQnLFxuICBUT1VDSF9FTkQ6ICAgICAgICAgICAgICAgICAgICAgICd0b3VjaGVuZCcsXG4gIFRPVUNIX1NUQVJUOiAgICAgICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQnLFxuICBUUkFOU0lUSU9ORU5EOiAgICAgICAgICAgICAgICAgICd0cmFuc2l0aW9uZW5kJyxcbiAgVVBEQVRFX1BPU1RfQ09VTlQ6ICAgICAgICAgICAgICAndXBkYXRlcG9zdGNvdW50JyxcbiAgVVBEQVRFX0lOX1ZJRVdQT1JUX01PRFVMRVM6ICAgICAndXBkYXRlaW52aWV3cG9ydG1vZHVsZXMnLFxuICBVUERBVEVfU0VBUkNIX1dJVEhfTkVXX0lURU1TOiAgICd1cGRhdGVzZWFyY2h3aXRobmV3aXRlbXMnLFxuICBVUERBVEVfU0VUVElOR1M6ICAgICAgICAgICAgICAgICd1cGRhdGVzZXR0aW5ncycsXG4gIFdIRUVMOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ3doZWVsJ1xufTtcbiIsImV4cG9ydCB7IEFSSUEgfSBmcm9tICcuL2FyaWEnO1xuZXhwb3J0IHsgQ0xBU1NfTkFNRVMgfSBmcm9tICcuL2NsYXNzLW5hbWVzJztcbmV4cG9ydCB7IEVORFBPSU5UUyB9IGZyb20gJy4vZW5kcG9pbnRzJztcbmV4cG9ydCB7IEVSUk9SUyB9IGZyb20gJy4vZXJyb3JzJztcbmV4cG9ydCB7IEVWRU5UUyB9IGZyb20gJy4vZXZlbnRzJztcbmV4cG9ydCB7IE1JU0MgfSBmcm9tICcuL21pc2MnO1xuZXhwb3J0IHsgS0VZX0NPREVTfSBmcm9tICcuL2tleS1jb2Rlcyc7XG5leHBvcnQgeyBTRUxFQ1RPUlMgfSBmcm9tICcuL3NlbGVjdG9ycyc7XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkS0VZIENPREVTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEtFWV9DT0RFUyA9IHtcbiAgRVNDQVBFOiAyNyxcbiAgRU5URVI6IDEzLFxuICBTUEFDRUJBUjogMzJcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkTUlTQyBTVFJJTkdTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgTUlTQyA9IHtcbiAgQkFOTkVSX0NPT0tJRTogICAgICAgICAgICAgICAgICAgICAgJ2Jhbm5lcl92aWV3ZWQnLFxuICBCQU5ORVJfQ09PS0lFX1ZJRVdFRDogICAgICAgICAgICAgICAndmlld2VkJyxcbiAgQlVUVE9OX1NVQk1JVFRFRDogICAgICAgICAgICAgICAgICAgJ1RoYW5rIFlvdScsXG4gIEJVVFRPTl9QUk9DRVNTSU5HOiAgICAgICAgICAgICAgICAgICdXb3JraW5nJyxcbiAgQkVGT1JFRU5EOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JlZm9yZWVuZCcsXG4gIENIQU5HRTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICdDaGFuZ2UgJyxcbiAgREFUQV9WSVNJQkxFOiAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtdmlzaWJsZScsXG4gIERJU0FCTEVEOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXNhYmxlZCcsXG4gIGZVUkwxOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyLnBocD91PScsXG4gIExBUkdFOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEwMjQsXG4gIE1FRElVTTogICAgICAgICAgICAgICAgICAgICAgICAgICAgIDY0MCxcbiAgbVVSTDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21haWx0bzonLFxuICBtVVJMMjogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnP3N1YmplY3Q9JyxcbiAgbVVSTDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyZib2R5PScsXG4gIHRVUkwxOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0nLFxuICB0VVJMVGV4dDogICAgICAgICAgICAgICAgICAgICAgICAgICAnJnRleHQ9JyxcbiAgdFVSTFZpYTogICAgICAgICAgICAgICAgICAgICAgICAgICAgJyZ2aWE9VGhlRGVtb2NyYXRzJyxcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRTRUxFQ1RPUlMgLSBDU1Mgc2VsZWN0b3JzIE9OTFlcbi8vIC0gIHRhZyBuYW1lcywgI2lkcywgLmNsYXNzbmFtZXMsIFthdHRyaWJ1dGVzXSwgZXRjXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgU0VMRUNUT1JTID0ge1xuICBBTEw6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICcjYWxsJyxcbiAgQU5DSE9SOiAgICAgICAgICAgICAgICAgICAgICAgICAnYScsXG4gIEFOQ0hPUl9XSVRIX0hSRUY6ICAgICAgICAgICAgICAgJ2FbaHJlZl0nLFxuICBBUElfUkVTVUxUUzogICAgICAgICAgICAgICAgICAgICdbZGF0YS1sb2FkY29tcG9uZW50PVwiQVBJUmVzdWx0c1wiXScsXG4gIEJBQ0tHUk9VTkQ6ICAgICAgICAgICAgICAgICAgICAgJy5iYWNrZ3JvdW5kJyxcbiAgQkFOTkVSX1RSSUdHRVI6ICAgICAgICAgICAgICAgICAnLmJhbm5lci1jbG9zZScsXG4gIEJVVFRPTjogICAgICAgICAgICAgICAgICAgICAgICAgJ2J1dHRvbicsXG4gIENIRUNLRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgJzpjaGVja2VkJyxcbiAgQ0hFQ0tFRF9MQUJFTDogICAgICAgICAgICAgICAgICAnOmNoZWNrZWQgKyBsYWJlbCcsXG4gIENIRUNLQk9YOiAgICAgICAgICAgICAgICAgICAgICAgJ2NoZWNrYm94JyxcbiAgQ0hFVlJPTl9TVFJJUEU6ICAgICAgICAgICAgICAgICAnLmNoZXZyb24tc3RyaXBlJyxcbiAgQ0xPU0U6ICAgICAgICAgICAgICAgICAgICAgICAgICAnLmNsb3NlJyxcbiAgQ0xPU0VfU0VBUkNIOiAgICAgICAgICAgICAgICAgICAnLmNsb3NlLXNlYXJjaCcsXG4gIERBVEFfQk9UVE9NOiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtYm90dG9tcG9zaXRpb24nLFxuICBEQVRBX0hBTEZXQVk6ICAgICAgICAgICAgICAgICAgICdkYXRhLWhhbGZ3YXknLFxuICBEQVRBX0hBU19BTklNQVRFRDogICAgICAgICAgICAgICdkYXRhLWhhcy1hbmltYXRlZCcsXG4gIERBVEFfTEFaWV9MT0FEOiAgICAgICAgICAgICAgICAgJ2RhdGEtbGF6eWxvYWQnLFxuICBEQVRBX1BPU0lUSU9OOiAgICAgICAgICAgICAgICAgICdkYXRhLXBvc2l0aW9uJyxcbiAgREFUQV9WSVNJQkxFOiAgICAgICAgICAgICAgICAgICAnW2RhdGEtdmlzaWJsZV0nLFxuICBESVY6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXYnLFxuICBEUk9QRE9XTjogICAgICAgICAgICAgICAgICAgICAgICcuZHJvcGRvd24nLFxuICBEUk9QRE9XTl9DT05URU5UOiAgICAgICAgICAgICAgICcuZHJvcGRvd25fX2NvbnRlbnQnLFxuICBEUk9QRE9XTl9UT0dHTEU6ICAgICAgICAgICAgICAgICcuZHJvcGRvd25fX3RvZ2dsZScsXG4gIERST1BET1dOX1RPR0dMRV9DTElDSzogICAgICAgICAgJy5kcm9wZG93bi5jbGljaycsXG4gIERST1BET1dOX1RPR0dMRV9IT1ZFUjogICAgICAgICAgJy5kcm9wZG93bi5ob3ZlcicsXG4gIEVNQUlMOiAgICAgICAgICAgICAgICAgICAgICAgICAgJy5zaGFyZS0tZW1haWwnLFxuICBGQUNFQk9PSzogICAgICAgICAgICAgICAgICAgICAgICcuc2hhcmUtLWZiJyxcbiAgRkVBVFVSRURWSURFTzogICAgICAgICAgICAgICAgICAnLmZlYXR1cmVkLXZpZGVvIHZpZGVvJyxcbiAgRklMRV9JTlBVVDogICAgICAgICAgICAgICAgICAgICAnaW5wdXRbdHlwZT1maWxlXScsXG4gIEZJTFRFUjogICAgICAgICAgICAgICAgICAgICAgICAgJy5maWx0ZXInLFxuICBGSUxURVJfQ0hPSUNFOiAgICAgICAgICAgICAgICAgICcuZmlsdGVyLWNob2ljZScsXG4gIEZJTFRFUl9PUFRJT046ICAgICAgICAgICAgICAgICAgJy5maWx0ZXItb3B0aW9uJyxcbiAgRklMVEVSX1RSSUdHRVI6ICAgICAgICAgICAgICAgICAnLmZpbHRlci10cmlnZ2VyJyxcbiAgRk9STTogICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9ybScsXG4gIEZPUk1fRklFTERTOiAgICAgICAgICAgICAgICAgICAgJ2lucHV0LCBzZWxlY3QsIHRleHRhcmVhJyxcbiAgSFRNTDogICAgICAgICAgICAgICAgICAgICAgICAgICAnaHRtbCcsXG4gIElOVkFMSUQ6ICAgICAgICAgICAgICAgICAgICAgICAgJzppbnZhbGlkJyxcbiAgTEFORElOR19QQUdFX1RJVExFOiAgICAgICAgICAgICAnLmxhbmRpbmctcGFnZS1oZWFkZXJfX3RpdGxlJyxcbiAgTElOS0VESU46ICAgICAgICAgICAgICAgICAgICAgICAnLnNoYXJlLS1saScsXG4gIExPQURJTkc6ICAgICAgICAgICAgICAgICAgICAgICAgJy5sb2FkaW5nJyxcbiAgTE9BRF9NT1JFOiAgICAgICAgICAgICAgICAgICAgICAnLmxvYWQtbW9yZScsXG4gIE5BVjogICAgICAgICAgICAgICAgICAgICAgICAgICAgJy5wcmltYXJ5LW5hdicsXG4gIE5BVl9UUklHR0VSOiAgICAgICAgICAgICAgICAgICAgJy5uYXYtdHJpZ2dlcicsXG4gIE5FU1RFRDogICAgICAgICAgICAgICAgICAgICAgICAgJy5uZXN0ZWQnLFxuICBPR0RFU0M6ICAgICAgICAgICAgICAgICAgICAgICAgICdtZXRhW3Byb3BlcnR5PVwib2c6ZGVzY3JpcHRpb25cIl0nLFxuICBPR1RJVExFOiAgICAgICAgICAgICAgICAgICAgICAgICdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nLFxuICBPR1VSTDogICAgICAgICAgICAgICAgICAgICAgICAgICdtZXRhW3Byb3BlcnR5PVwib2c6dXJsXCJdJyxcbiAgT1BFTl9TRUFSQ0g6ICAgICAgICAgICAgICAgICAgICAnLm9wZW4tc2VhcmNoJyxcbiAgT1BUR1JPVVA6ICAgICAgICAgICAgICAgICAgICAgICAnb3B0Z3JvdXAnLFxuICBQQVJBR1JBUEg6ICAgICAgICAgICAgICAgICAgICAgICdwJyxcbiAgUExBWUVSOiAgICAgICAgICAgICAgICAgICAgICAgICAnLnBsYXllcicsXG4gIFBMQVlfVFJJR0dFUjogICAgICAgICAgICAgICAgICAgJy52aWRlb19fcGxheS10cmlnZ2VyJyxcbiAgUE9TVF9DT1VOVDogICAgICAgICAgICAgICAgICAgICAnLnBvc3QtY291bnQgLmNvdW50JyxcbiAgUE9TVF9MSVNUSU5HOiAgICAgICAgICAgICAgICAgICAnLnBvc3QtbGlzdGluZycsXG4gIFJFU1VMVFNfQ09OVEFJTkVSOiAgICAgICAgICAgICAgJy5yZXN1bHRzLWNvbnRhaW5lcicsXG4gIFNFQ09OREFSWV9CTE9HX0xJU1RJTkc6ICAgICAgICAgJy5zZWNvbmRhcnktYmxvZy1saXN0aW5nJyxcbiAgU0VBUkNIX0lOUFVUOiAgICAgICAgICAgICAgICAgICAnLnNlYXJjaC1maWVsZF9faW5wdXQnLFxuICBTRUxFQ1RFRDogICAgICAgICAgICAgICAgICAgICAgICcuc2VsZWN0ZWQnLFxuICBTSVRFX05BVjogICAgICAgICAgICAgICAgICAgICAgICcubmF2aWdhdGlvbicsXG4gIFNUQVRJU1RJQ19WQUxVRTogICAgICAgICAgICAgICAgJy5zdGF0aXN0aWNfX3ZhbHVlJyxcbiAgU1VCTUlUOiAgICAgICAgICAgICAgICAgICAgICAgICAnW3R5cGU9XCJzdWJtaXRcIl0nLFxuICBTVkdfQkdfQ09OVEFJTkVSOiAgICAgICAgICAgICAgICcuc3ZnLWJhY2tncm91bmQnLFxuICBUQUI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICdbcm9sZT1cInRhYlwiXScsXG4gIFRBQlBBTkVMOiAgICAgICAgICAgICAgICAgICAgICAgJ1tyb2xlPVwidGFicGFuZWxcIl0nLFxuICBUV0lUVEVSOiAgICAgICAgICAgICAgICAgICAgICAgICcuc2hhcmUtLXR3Jyxcbn07XG4iLCIvKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAqIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAqIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICogbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZnVuYyBBIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgTiBtaWxsaXNlY29uZHNcbiAqIEBwYXJhbSAge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0XG4gKiBAcGFyYW0gIHtib29sZWFufSBpbW1lZGlhdGUgVHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlIGxlYWRpbmcgZWRnZSBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZ1xuICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90IGJlIHRyaWdnZXJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gIGxldCB0aW1lb3V0O1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gdGhpcztcbiAgICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBjb25zdCBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICBpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgfTtcbn1cblxuIiwiLyoqXG4gKiBSZXR1cm5zIHRoZSBjb29raWUgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBvZiB0aGUgY29va2llIHRvIGZpbmRcbiAqIEByZXR1cm4ge09iamVjdH0gY29va2llIGJhc2VkIG9uIG5hbWUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRjb29raWUobmFtZSkge1xuICBjb25zdCBjb29raWVzID0ge31cbiAgY29uc3QgY29va2llU2V0ID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7ICcpO1xuICBjb29raWVTZXQuZm9yRWFjaChjb29raWUgPT4gY29va2llc1tjb29raWUuc3BsaXQoJz0nKVswXV0gPSBjb29raWUuc3BsaXQoJz0nKVsxXSk7XG5cbiAgcmV0dXJuIGNvb2tpZXNbbmFtZV07XG59OyIsIi8vIGV4cG9ydCB7IGNsb3Nlc3QgfSBmcm9tICcuL2Nsb3Nlc3QuanMnO1xuLy8gZXhwb3J0IHsgY3JlYXRlbG9hZGVyIH0gZnJvbSAnLi9sb2FkZXInO1xuLy8gZXhwb3J0IHsgY29udmVydGRhdGUgfSBmcm9tICcuL2NvbnZlcnRkYXRlLmpzJztcbmV4cG9ydCB7IGRlYm91bmNlIH0gZnJvbSAnLi9kZWJvdW5jZSc7XG5leHBvcnQgeyBnZXRjb29raWUgfSBmcm9tICcuL2dldGNvb2tpZSc7XG4vLyBleHBvcnQgeyBoYXNob3ZlciB9IGZyb20gJy4vaGFzaG92ZXInO1xuLy8gZXhwb3J0IHsgaGV4dG9yZ2IgfSBmcm9tICcuL2hleHRvcmdiJztcbi8vIGV4cG9ydCB7IGludGVycG9sYXRlbnVtYmVycyB9IGZyb20gJy4vaW50ZXJwb2xhdGVudW1iZXJzJztcbi8vIGV4cG9ydCB7IGlzb2JqZWN0ZW1wdHkgfSBmcm9tICcuL2lzb2JqZWN0ZW1wdHknO1xuZXhwb3J0IHsgaXNzY3JvbGxlZGludG92aWV3IH0gZnJvbSAnLi9pc3Njcm9sbGVkaW50b3ZpZXcnO1xuLy8gZXhwb3J0IHsgTWVzc2FnZUJ1cyB9IGZyb20gJy4vbWVzc2FnZWJ1cyc7XG5leHBvcnQgeyBvcGVucG9wdXAgfSBmcm9tICcuL29wZW5wb3B1cCc7XG4vLyBleHBvcnQgeyByZW1vdmVsb2FkZXIgfSBmcm9tICcuL2xvYWRlcic7XG5leHBvcnQgeyByYW5kb21zZWN1cmVzdHJpbmcgfSBmcm9tICcuL3JhbmRvbXNlY3VyZXN0cmluZyc7XG5leHBvcnQgeyBzY3JvbGx0byB9IGZyb20gJy4vc2Nyb2xsdG8nO1xuIiwiLyoqXG4gKiBBIGZ1bmN0aW9uIHdoaWNoIG1lYXN1cmVzIHRoZSBlbGVtZW50cyBwb3NpdGlvbiBvbiB0aGUgcGFnZSBpblxuICogcmVsYXRpb24gdG8gdGhlIHdoYXQgdGhlIHVzZXIgY2FuIGN1cnJlbnRseSBzZWUgb24gdGhlaXIgc2NyZWVuXG4gKiBhbmQgcmV0dXJucyBhIGJvb2xlYW4gdmFsdWUgd2l0aCBgdHJ1ZWAgYmVpbmcgdGhhdCB0aGUgZWxlbWVudFxuICogaXMgdmlzaWJsZSBhbmQgYGZhbHNlYCBiZWluZyB0aGF0IGl0IGlzIG5vdCB2aXNpYmxlLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gIGVsZW0gQSBET00gZWxlbWVudFxuICogQHJldHVybiB7Qm9vbGVhbn0gaXNWaXNpYmxlIEEgYm9vbGVhbiB2YWx1ZSB3aXRoIGB0cnVlYCByZXByZXNlbnRpbmcgdGhhdCB0aGUgZWxlbWVudCBpcyB2aXNpYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc3Njcm9sbGVkaW50b3ZpZXcoZWxlbSkge1xuICBjb25zdCBlbGVtZW50Qm91bmRzID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIGVsZW1lbnRCb3VuZHMudG9wIDwgd2luZG93LmlubmVySGVpZ2h0ICYmIGVsZW1lbnRCb3VuZHMuYm90dG9tID49IDA7XG59XG5cbiIsIi8qKlxuICogQSBmdW5jdGlvbiB3aGljaCBvcGVucyBhIHBvcHVwIHdpbmRvd1xuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gdXJsIHRoZSB1cmwgdG8gb3BlbiBpbiB0aGUgcG9wdXBcbiAqIEBwYXJhbSAge1N0cmluZ30gd2luZG93TmFtZSBhIHVuaXF1ZSBuYW1lIGZvciB0aGUgcG9wdXBcbiAqIEBwYXJhbSAge0ludGVnZXJ9IHcgdGhlIGRlc2lyZWQgd2lkdGggb2YgdGhlIHBvcHVwXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSBoIHRoZSBkZXNpcmVkIGhlaWdodCBvZiB0aGUgcG9wdXBcbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHRoZSBwb3B1cCBmdW5jdGlvbiBpcyBib3VuZCB0b1xuICovXG5leHBvcnQgZnVuY3Rpb24gb3BlbnBvcHVwKHVybCwgd2luZG93TmFtZSwgdywgaCkge1xuICByZXR1cm4gd2luZG93Lm9wZW4odXJsLCB3aW5kb3dOYW1lLFxuICAgICdtZW51YmFyPW5vLHN0YXR1cz1ubyx0b29sYmFyPW5vLGxvY2F0aW9uPXllcyxyZXNpemFibGU9eWVzLHNjcm9sbGJhcnM9eWVzLHN0YXR1cz1ubyx3aWR0aD0nICsgdyArICcsaGVpZ2h0PScgKyBoICsgJydcbiAgKTtcbn1cbiIsIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgbGVuZ3RoIGFuZFxuICogcmV0dXJucyBhIHJhbmRvbSBzdHJpbmdcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGxlbmd0aCBvZiB0aGUgcmFuZG9tIHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSByYW5kb20gc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21zZWN1cmVzdHJpbmcobGVuZ3RoKSB7XG4gIGxldCB0ZXh0ID0gJyc7XG4gIGNvbnN0IHBvc3NpYmxlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5JztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuICB9XG4gIHJldHVybiB0ZXh0O1xufSIsIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHNjcm9sbHMgdG8gYSB0YXJnZXQgb24gcGFnZVxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gZXZlbnRcbiAqIEBwYXJhbSAge0hUTUxOb2RlfSBlbGVtZW50XG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSBvZmZzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjcm9sbHRvKGV2ZW50LCBlbGVtZW50LCBvZmZzZXQgPSAwKSB7XG4gIGNvbnN0IGhhc2ggPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpLmNoYXJBdCgwKSA9PT0gJyMnID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSA6IHVuZGVmaW5lZDtcblxuICBpZiAoaGFzaCAmJiB3aW5kb3cuc2Nyb2xsICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCAkdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihoYXNoKTtcbiAgICBjb25zdCB0YXJnZXRZID0gJHRhcmdldC5vZmZzZXRUb3AgLSBvZmZzZXQ7XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgd2luZG93LnNjcm9sbFRvKHtcbiAgICAgIHRvcDogdGFyZ2V0WSxcbiAgICAgIGJlaGF2aW9yOiAnc21vb3RoJ1xuICAgIH0pO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEVWRU5UUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5cbi8qKlxuICogSURcbiAqXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGlnbm9yZVxuICovXG5sZXQgaWQgPSAwO1xuXG4vKipcbiAqIEdldCBJRFxuICpcbiAqIEJlY2F1c2UgZmlsZSBpcyBsb2FkZWQgb25seSBvbmNlLCB0aGlzIGZ1bmN0aW9uXG4gKiBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBldmVyeSB0aW1lXG4gKiBpdCBpcyBjYWxsZWQuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBVbmlxdWUgSUQgdmFsdWVcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG4vKipcbiAqIENsaWNrIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpY2tTZXJ2aWNlIHtcbiAgLyoqXG4gICAqIENsaWNrIFNlcnZpY2UgY29uc3RydWN0b3IgaW4gd2hpY2ggdGhlIGBjYWxsYmFja3NgIGFycmF5IGlzIGNyZWF0ZWRcbiAgICogYXMgYSBwcm9wZXJ0eSBvZiB0aGUgY2xhc3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIC8qKlxuICAgICAgICogQW4gYXJyYXkgdG8gYmUgcG9wdWxhdGVkIHdpdGggY2FsbGJhY2sgZnVuY3Rpb25zIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgb24gQ2xpY2tcbiAgICAgICAqXG4gICAgICAgKiBAcHJvcGVydHkge0FycmF5fSBjYWxsYmFja3NcbiAgICAgICAqL1xuICAgICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcblxuICAgICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgKiBAZGVzYyBJbml0aWFsaXplIHRoZSBzaW5nbGV0b24gYnkgYXR0YWNoaW5nIHRoZSBldmVudCBsaXN0ZW5lciB0byB0aGUgd2luZG93XG4gICogQGxpc3RlbnMge0V2ZW50fSBsaXN0ZW5zIHRvIHRoZSB3aW5kb3cgQ2xpY2sgZXZlbnRcbiAgKi9cbiAgaW5pdCgpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5DTElDSywgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICogQGRlc2MgVGhlIGNsaWNrIGV2ZW50IGhhbmRsZXIuIEl0ZXJhdGVzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIGludm9rZXMgZWFjaCBjYWxsYmFjayBpbiB0aGUgQXJyYXlcbiAgKiBAcGFyYW0gIHtFdmVudH0gZXZlbnQgdGhlIGV2ZW50IG9iamVjdFxuICAqL1xuICBvbkNsaWNrKGV2ZW50KSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgICAgIGlmIChjYWxsYmFjay5pc0VsZW1lbnRNYXRjaCkge1xuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBjYWxsYmFjay50YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsYmFjayhldmVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsYmFjayhldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgQSBob29rIGZvciBwdXNoaW5nIGEgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogaW50byB0aGUgYGNhbGxiYWNrc2AgYXJyYXkuIEEgdW5pcXVlXG4gICAqIElEIHZhbHVlIGZvciB0aGUgY2FsbGJhY2sgaXMgZ2VuZXJhdGVkXG4gICAqIGFuZCBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGZvciByZW1vdmluZ1xuICAgKiB0aGUgY2FsbGJhY2sgaWYgbmVlZCBiZS5cbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHJlZmVyZW5jZSB0byB0aGUgRE9NIGVsZW1lbnQgdGhhdCB0cmlnZ2VycyB0aGUgZXZlbnRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBpbnZva2UgYnkgdGhlIENsaWNrU2VydmljZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzRWxlbWVudE1hdGNoIEEgZmxhZyB1c2VkIHRvIGludmVydCB0aGUgY29uZGl0aW9uYWwgY2hlY2sgZm9yIGZpcmluZyB0aGUgY2FsbGJhY2tcbiAgICogQHJldHVybiB7RnVuY3Rpb259IGByZW1vdmVDYWxsYmFja2AgQSBmdW5jdGlvbiB3aGljaCB3aWxsIHJlbW92ZSBhbiBlbnRyeSBmcm9tIHRoZSBgY2FsbGJhY2tzYCBhcnJheVxuICAgKi9cbiAgYWRkQ2FsbGJhY2soZWxlbWVudCwgY2FsbGJhY2ssIGlzRWxlbWVudE1hdGNoKSB7XG4gICAgLy8gR2VuZXJhdGUgYW4gaWQgZm9yIHRoZSBjYWxsYmFja1xuICAgIGNvbnN0IGlkID0gZ2V0SWQoKTtcbiAgICAvLyBtb2R1bGUgY2FuJ3QgYmUgdW5kZWZpbmVkIGJlY2F1c2UgaXQncyBhcyBpbiBpZGVudGlmaWVyIGZvciB0aGUgY2FsbGJhY2tzIGFycmF5LlxuICAgIGNvbnN0IG1vZHVsZSA9IGVsZW1lbnQuZGF0YXNldCAmJiBlbGVtZW50LmRhdGFzZXQubG9hZG1vZHVsZSA/IGVsZW1lbnQuZGF0YXNldC5sb2FkbW9kdWxlIDogZWxlbWVudDtcbiAgICBsZXQgZmxhZyA9IGZhbHNlO1xuICAgIGNvbnN0IHRhcmdldEVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuY2FsbGJhY2tzW2ldLm1vZHVsZSA9PT0gbW9kdWxlKSB7XG4gICAgICAgIGZsYWcgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghZmxhZykge1xuICAgICAgLy8gUHVzaCBmdW5jdGlvbiBpbnRvIGFycmF5IHdpdGggYSB1bmlxdWUgaWRcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goe1xuICAgICAgICBtb2R1bGUsXG4gICAgICAgIGlkLFxuICAgICAgICB0YXJnZXRFbGVtZW50LFxuICAgICAgICBpc0VsZW1lbnRNYXRjaCxcbiAgICAgICAgY2FsbGJhY2tcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgcmVtb3ZlIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2FsbGJhY2suYmluZCh0aGlzLCBpZCk7XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVycyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCByZW1vdmVzXG4gICAqIHRoZSBlbnRyeSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpZCBwYXNzZWRcbiAgICogaW4gYXMgYW4gYXJndW1lbnRcbiAgICpcbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBBbiBpZCB2YWx1ZSB0byBmaWx0ZXIgYnlcbiAgICovXG4gIHJlbW92ZUNhbGxiYWNrKGlkKSB7XG4gICAgdGhpcy5jYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrcy5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgIHJldHVybiBpdGVtLmlkICE9PSBpZDtcbiAgICB9KTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4uLy4uL1V0aWxzJztcbmltcG9ydCB7IEVWRU5UUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5cbi8qKlxuICogSURcbiAqXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGlnbm9yZVxuICovXG5sZXQgaWQgPSAwO1xuXG4vKipcbiAqIEdldCBJRFxuICpcbiAqIEJlY2F1c2UgZmlsZSBpcyBsb2FkZWQgb25seSBvbmNlLCB0aGlzIGZ1bmN0aW9uXG4gKiBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBldmVyeSB0aW1lXG4gKiBpdCBpcyBjYWxsZWQuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBVbmlxdWUgSUQgdmFsdWVcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG4vKipcbiAqIFJlc2l6ZSBTZXJ2aWNlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlc2l6ZVNlcnZpY2Uge1xuICAvKipcbiAgICogUmVzaXplU2VydmljZSBjb25zdHJ1Y3RvciBpbiB3aGljaCB0aGUgYGNhbGxiYWNrc2AgYXJyYXkgaXMgY3JlYXRlZFxuICAgKiBhcyBhIHByb3BlcnR5IG9mIHRoZSBjbGFzcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIG9uIHJlc2l6ZVxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtBcnJheX0gY2FsbGJhY2tzXG4gICAgICovXG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcblxuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEluaXRpYWxpemUgdGhlIHNpbmdsZXRvbiBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB3aW5kb3dcbiAgICogQGxpc3RlbnMge0V2ZW50fSBsaXN0ZW5zIHRvIHRoZSB3aW5kb3cgcmVzaXplIGV2ZW50XG4gICAqL1xuICBpbml0KCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5SRVNJWkUsIGRlYm91bmNlKHRoaXMub25SZXNpemUuYmluZCh0aGlzKSwgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBUaGUgcmVzaXplIGV2ZW50IGhhbmRsZXIuIEl0ZXJ0YXRlcyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCBpbnZva2VzIGVhY2ggY2FsbGJhY2sgaW4gdGhlIEFycmF5XG4gICAqL1xuICBvblJlc2l6ZSgpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgY2FsbGJhY2suY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBBIGhvb2sgZm9yIHB1c2hpbmcgYSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBpbnRvIHRoZSBgY2FsbGJhY2tzYCBhcnJheS4gQSB1bmlxdWVcbiAgICogSUQgdmFsdWUgZm9yIHRoZSBjYWxsYmFjayBpcyBnZW5lcmF0ZWRcbiAgICogYW5kIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgZm9yIHJlbW92aW5nXG4gICAqIHRoZSBjYWxsYmFjayBpZiBuZWVkIGJlLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGludm9rZSBieSB0aGUgUmVzaXplU2VydmljZVxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYHJlbW92ZUNhbGxiYWNrYCBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgcmVtb3ZlIGFuIGVudHJ5IGZyb20gdGhlIGBjYWxsYmFja3NgIGFycmF5XG4gICAqL1xuICBhZGRDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIC8vIEdlbmVyYXRlIGFuIGlkIGZvciB0aGUgY2FsbGJhY2tcbiAgICBjb25zdCBpZCA9IGdldElkKCk7XG5cbiAgICAvLyBQdXNoIGZ1bmN0aW9uIGludG8gYXJyYXkgd2l0aCBhIHVuaXF1ZSBpZFxuICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goe1xuICAgICAgaWQsXG4gICAgICBjYWxsYmFja1xuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIHRoZSByZW1vdmUgZnVuY3Rpb25cbiAgICByZXR1cm4gdGhpcy5yZW1vdmVDYWxsYmFjay5iaW5kKHRoaXMsIGlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIHJlbW92ZXNcbiAgICogdGhlIGVudHJ5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGlkIHBhc3NlZFxuICAgKiBpbiBhcyBhbiBhcmd1bWVudFxuICAgKlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIEFuIGlkIHZhbHVlIHRvIGZpbHRlciBieVxuICAgKi9cbiAgcmVtb3ZlQ2FsbGJhY2soaWQpIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0uaWQgIT09IGlkO1xuICAgIH0pO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGRlYm91bmNlIH0gZnJvbSAnLi4vLi4vVXRpbHMnO1xuaW1wb3J0IHsgRVZFTlRTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuLyoqXG4gKiBJRFxuICpcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAaWdub3JlXG4gKi9cbmxldCBpZCA9IDA7XG5cbi8qKlxuICogR2V0IElEXG4gKlxuICogQmVjYXVzZSBmaWxlIGlzIGxvYWRlZCBvbmx5IG9uY2UsIHRoaXMgZnVuY3Rpb25cbiAqIGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGV2ZXJ5IHRpbWVcbiAqIGl0IGlzIGNhbGxlZC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFVuaXF1ZSBJRCB2YWx1ZVxuICogQGlnbm9yZVxuICovXG5mdW5jdGlvbiBnZXRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbi8qKlxuICogU2Nyb2xsIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2Nyb2xsU2VydmljZSB7XG4gIC8qKlxuICAgKiBTY3JvbGwgU2VydmljZSBjb25zdHJ1Y3RvciBpbiB3aGljaCB0aGUgYGNhbGxiYWNrc2AgYXJyYXkgaXMgY3JlYXRlZFxuICAgKiBhcyBhIHByb3BlcnR5IG9mIHRoZSBjbGFzcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIG9uIHNjcm9sbFxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtBcnJheX0gY2FsbGJhY2tzXG4gICAgICovXG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB1c2VyIGJhc2VkIG9uIHNjcm9sbCwgdmVydGljYWxseVxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IHBvc2l0aW9uXG4gICAgICovXG4gICAgdGhpcy5zY3JvbGxZID0gMDtcblxuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEluaXRpYWxpemUgdGhlIHNpbmdsZXRvbiBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB3aW5kb3dcbiAgICogQGxpc3RlbnMge0V2ZW50fSBsaXN0ZW5zIHRvIHRoZSB3aW5kb3cgc2Nyb2xsIGV2ZW50XG4gICAqL1xuICBpbml0KCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5TQ1JPTEwsIGRlYm91bmNlKHRoaXMub25TY3JvbGwuYmluZCh0aGlzKSwgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBUaGUgc2Nyb2xsIGV2ZW50IGhhbmRsZXIuIEl0ZXJhdGVzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIGludm9rZXMgZWFjaCBjYWxsYmFjayBpbiB0aGUgQXJyYXlcbiAgICovXG4gIG9uU2Nyb2xsKCkge1xuICAgIHRoaXMuc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZO1xuICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICBjYWxsYmFjay5jYWxsYmFjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEEgaG9vayBmb3IgcHVzaGluZyBhIGNhbGxiYWNrIGZ1bmN0aW9uIGludG8gdGhlIGBjYWxsYmFja3NgIGFycmF5LiBBIHVuaXF1ZVxuICAgKiBJRCB2YWx1ZSBmb3IgdGhlIGNhbGxiYWNrIGlzIGdlbmVyYXRlZCBhbmQgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBmb3IgcmVtb3ZpbmdcbiAgICogdGhlIGNhbGxiYWNrIGlmIG5lZWQgYmUuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gaW52b2tlIGJ5IHRoZSBTY3JvbGxTZXJ2aWNlXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBgcmVtb3ZlQ2FsbGJhY2tgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCByZW1vdmUgYW4gZW50cnkgZnJvbSB0aGUgYGNhbGxiYWNrc2AgYXJyYXlcbiAgICovXG4gIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgLy8gR2VuZXJhdGUgYW4gaWQgZm9yIHRoZSBjYWxsYmFja1xuICAgIGNvbnN0IGlkID0gZ2V0SWQoKTtcblxuICAgIC8vIFB1c2ggZnVuY3Rpb24gaW50byBhcnJheSB3aXRoIGEgdW5pcXVlIGlkXG4gICAgdGhpcy5jYWxsYmFja3MucHVzaCh7XG4gICAgICBpZCxcbiAgICAgIGNhbGxiYWNrXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIHJlbW92ZSBmdW5jdGlvblxuICAgIHJldHVybiB0aGlzLnJlbW92ZUNhbGxiYWNrLmJpbmQodGhpcywgaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlcnMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgcmVtb3Zlc1xuICAgKiB0aGUgZW50cnkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaWQgcGFzc2VkXG4gICAqIGluIGFzIGFuIGFyZ3VtZW50XG4gICAqXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgQW4gaWQgdmFsdWUgdG8gZmlsdGVyIGJ5XG4gICAqL1xuICByZW1vdmVDYWxsYmFjayhpZCkge1xuICAgIHRoaXMuY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3MuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS5pZCAhPT0gaWQ7XG4gICAgfSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gSW1wb3J0IHNlcnZpY2VzXG5pbXBvcnQgQ2xpY2tTZXJ2aWNlIGZyb20gJy4vQ2xpY2tTZXJ2aWNlJztcbmltcG9ydCBSZXNpemVTZXJ2aWNlIGZyb20gJy4vUmVzaXplU2VydmljZSc7XG5pbXBvcnQgU2Nyb2xsU2VydmljZSBmcm9tICcuL1Njcm9sbFNlcnZpY2UnO1xuXG4vKipcbiAqIEEgc2luZ2xldG9uIHdob3NlIHByb3BlcnRpZXMgYXJlIGluZGl2aWR1YWwgc2VydmljZXMuXG4gKlxuICogQW55IHNlcnZpY2Ugc2luZ2xldG9uIHNlcnZpY2UgdGhhdCBuZWVkcyB0byBiZSBpbnN0YW50aWF0ZWRcbiAqIHNob3VsZCBiZSBkb25lIHNvIGluIHRoZSBTZXJ2aWNlcyBjbGFzcy5cbiAqXG4gKiBTZXJ2aWNlcyBzaG91bGQgbm90IGludGVyYWN0IHdpdGggdGhlIERPTSwgdGhhdCBzaG91bGQgYmVcbiAqIGxlZnQgdG8gdGhlIFZpZXdzLiBTZXJ2aWNlcyBjYW4gc2ltcGx5IGJlIHVzZWQgdG8gY29uc29saWRhdGVcbiAqIGFuIGV4cGVuc2l2ZSBldmVudCBsaXN0ZW5lciAoJ3Njcm9sbCcsICdyZXNpemUnLCBldGMpLiBvclxuICogdHJhY2sgc3RhdGUgKGxpa2Ugd2hpY2ggbW9kYWwgaXMgb3BlbiBhdCB3aGljaCB0aW1lKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VydmljZXMge1xuICAvKipcbiAgICogU2VydmljZXMgY29uc3RydWN0b3IgdGhhdCBpbnN0YW50aWF0ZXMgZWFjaCBzZXJ2aWNlIGluZGl2aWR1YWxseS5cbiAgICogVG8gYWRkIGFub3RoZXIgc2VydmljZXMgaW5zdGlhdGUgaXQgaGVyZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIEEgc2VydmljZSB3aGljaCBsaXN0ZW5zIHRvIHRoZSBgd2luZG93YCBjbGljayBldmVudCBhbmRcbiAgICAgKiBpbnZva2VzIGFuIGFycmF5IG9mIGNhbGxiYWNrc1xuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IENsaWNrU2VydmljZSBBIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgQ2xpY2tTZXJ2aWNlIGNsYXNzXG4gICAgICovXG4gICAgdGhpcy5DbGlja1NlcnZpY2UgPSBuZXcgQ2xpY2tTZXJ2aWNlKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHNlcnZpY2Ugd2hpY2ggbGlzdGVucyB0byB0aGUgYHdpbmRvd2AgcmVzaXplIGV2ZW50IGFuZFxuICAgICAqIGludm9rZXMgYW4gYXJyYXkgb2YgY2FsbGJhY2tzXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gUmVzaXplU2VydmljZSBBIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgUmVzaXplU2VydmljZSBjbGFzc1xuICAgICAqL1xuICAgIHRoaXMuUmVzaXplU2VydmljZSA9IG5ldyBSZXNpemVTZXJ2aWNlKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHNlcnZpY2Ugd2hpY2ggbGlzdGVucyB0byB0aGUgYHdpbmRvd2Agc2Nyb2xsIGV2ZW50IGFuZFxuICAgICAqIGludm9rZXMgYW4gYXJyYXkgb2YgY2FsbGJhY2tzXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gU2Nyb2xsU2VydmljZSBBIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgU2Nyb2xsU2VydmljZSBjbGFzc1xuICAgICAqL1xuICAgIHRoaXMuU2Nyb2xsU2VydmljZSA9IG5ldyBTY3JvbGxTZXJ2aWNlKCk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgRVZFTlRTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgc2hvd3MgdGhlIGZpcnN0IGZpbGUgdXBsb2FkZWQgdG8gZmlsZSBmaWVsZCBvbiBtYXRjaGluZyBsYWJlbFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBGaWxlXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBSRVFVSVJFRCAtIHRoZSBtb2R1bGUncyBjb250YWluZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICAvKipcbiAgICAgKiBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IGVsZW1lbnQgRE9NIG5vZGUgdGhhdCBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgdmlld1xuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB2aWV3IGJ5IGNhbGxpbmcgdGhlIGZ1bmN0aW9ucyB0b1xuICAgKiBjcmVhdGUgRE9NIHJlZmVyZW5jZXMsIHNldHVwIGV2ZW50IGhhbmRsZXJzIGFuZFxuICAgKiB0aGVuIGNyZWF0ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gSGVhZGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBpbml0KCkge1xuICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKClcbiAgICAgIC5zZXR1cEhhbmRsZXJzKClcbiAgICAgIC5lbmFibGUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENhY2hlIERPTSBSZWZlcmVuY2VzXG4gICAqXG4gICAqIEZpbmQgYWxsIG5lY2Vzc2FyeSBET00gZWxlbWVudHMgdXNlZCBpbiB0aGUgdmlldyBhbmQgY2FjaGUgdGhlbVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY2FjaGVEb21SZWZlcmVuY2VzKCkge1xuICAgIHRoaXMuZmlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2ZvcicpKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmQgZXZlbnQgaGFuZGxlcnMgd2l0aCB0aGUgcHJvcGVyIGNvbnRleHQgb2YgYHRoaXNgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IE5hdiBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0dXBIYW5kbGVycygpIHtcbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYHNjcm9sbFRvYCBmdW5jdGlvbiB3aXRoIHRoZSBwcm9wZXJcbiAgICAgKiBjb250ZXh0IGJvdW5kIHRvIHRoZSBTVkdTY3JvbGxBbmltYXRpb25zIGNsYXNzLlxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICB0aGlzLm9uQ2hhbmdlSGFuZGxlciA9IHRoaXMub25DaGFuZ2UuYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBldmVudCBoYW5kbGVycyB0byBlbmFibGUgaW50ZXJhY3Rpb24gd2l0aCB2aWV3XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gTmF2IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbmFibGUoKSB7XG4gICAgdGhpcy5maWxlLmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLkNIQU5HRSwgdGhpcy5vbkNoYW5nZUhhbmRsZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdpbmcgZmlsZSB1cGxvYWRlZCB3aWxsIHJlcGxhY2UgdGhlIG5hbWVcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uQ2hhbmdlKGV2ZW50KSB7XG4gICAgY29uc29sZS5sb2coJ2NoYW5nZWQnKTtcblxuICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSB0aGlzLmZpbGUuZmlsZXMubGVuZ3RoID4gMCA/IHRoaXMuZmlsZS5maWxlc1swXS5uYW1lIDogJ0FueSBBdHRhY2htZW50Pyc7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBpc3Njcm9sbGVkaW50b3ZpZXcgfSBmcm9tICcuLi8uLi9VdGlscyc7XG5pbXBvcnQgeyBDTEFTU19OQU1FUywgRVZFTlRTLCBNSVNDLCBTRUxFQ1RPUlMgfSBmcm9tICdDb25zdGFudHMnO1xuXG4vKipcbiAqIEluIFZpZXdwb3J0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluVmlld3BvcnQge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIGludmlld3BvcnQgd2hpY2ggc2ltcGx5IGFzc2lnbnMgdGhlIFNjcm9sbFNlcnZpY2VcbiAgICogdG8gYSBwcm9wZXJ0eSBvbiB0aGUgY29udHJ1Y3RvciBmb3IgcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gU2VydmljZXMgdmFyaW91cyBzZXJ2aWNlcywgcGFzc2VkIGluIGFzIHBhcmFtXG4gICAqL1xuICBjb25zdHJ1Y3RvcihTZXJ2aWNlcykge1xuICAgIC8qKlxuICAgICAqIFJlZmVyZW5jZSB0byB0aGUgU2Nyb2xsU2VydmljZSBzaW5nbGV0b25cbiAgICAgKiBAcHJvcGVydHkge09iamVjdH1cbiAgICAgKi9cbiAgICB0aGlzLlNjcm9sbFNlcnZpY2UgPSBTZXJ2aWNlcy5TY3JvbGxTZXJ2aWNlO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgdmlld1xuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB2aWV3IGJ5IGNhbGxpbmcgdGhlIGZ1bmN0aW9ucyB0b1xuICAgKiBjcmVhdGUgRE9NIHJlZmVyZW5jZXMsIHNldHVwIGV2ZW50IGhhbmRsZXJzIGFuZFxuICAgKiB0aGVuIGNyZWF0ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBpbml0KCkge1xuICAgIHRoaXMuY2FjaGVEb21SZWZlcmVuY2VzKClcbiAgICAgIC5zZXR1cEhhbmRsZXJzKClcbiAgICAgIC5lbmFibGUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgYWxsIG5lY2Vzc2FyeSBET00gZWxlbWVudHMgdXNlZCBpbiB0aGUgdmlldyBhbmQgY2FjaGUgdGhlbVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY2FjaGVEb21SZWZlcmVuY2VzKCkge1xuICAgIC8qKlxuICAgICAqIEFsbCBET00gZWxlbWVudHMgd2l0aCB0aGUgYGRhdGEtdmlzaWJsZWAgYXR0cmlidXRlXG4gICAgICogQHByb3BlcnR5IHtOb2RlTGlzdH1cbiAgICAgKi9cbiAgICB0aGlzLm1vZHVsZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFNFTEVDVE9SUy5EQVRBX1ZJU0lCTEUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQmluZCBldmVudCBoYW5kbGVycyB3aXRoIHRoZSBwcm9wZXIgY29udGV4dCBvZiBgdGhpc2AuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXR1cEhhbmRsZXJzKCkge1xuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgb25TY3JvbGxgIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlclxuICAgICAqIGNvbnRleHQgYm91bmQgdG8gdGhlIEluVmlld3BvcnQgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHRoaXMub25TY3JvbGxIYW5kbGVyID0gdGhpcy5vblNjcm9sbC5iaW5kKHRoaXMpO1xuXG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGB1cGRhdGVNb2R1bGVzYCBmdW5jdGlvbiB3aXRoIHRoZSBwcm9wZXJcbiAgICAgKiBjb250ZXh0IGJvdW5kIHRvIHRoZSBJblZpZXdwb3J0IGNsYXNzLlxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICB0aGlzLm9uTW9kdWxlVXBkYXRlSGFuZGxlciA9IHRoaXMudXBkYXRlTW9kdWxlcy5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGV2ZW50IGhhbmRsZXJzIHRvIGVuYWJsZSBpbnRlcmFjdGlvbiB3aXRoIHZpZXdcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGVuYWJsZSgpIHtcbiAgICAvLyBDYWxsIHNjcm9sbCBoYW5kbGVyIG9uIGxvYWQgdG8gZ2V0IGluaXRpYWwgdmlld2FibGUgZWxlbWVudHNcbiAgICB3aW5kb3cuc2V0VGltZW91dCh0aGlzLm9uU2Nyb2xsSGFuZGxlciwgMzAwKTtcblxuICAgIC8vIEFkZCB0byBTY3JvbGxTZXJpdmUgY2FsbGJhY2tzXG4gICAgdGhpcy5TY3JvbGxTZXJ2aWNlLmFkZENhbGxiYWNrKHRoaXMub25TY3JvbGxIYW5kbGVyKTtcblxuICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuVVBEQVRFX0lOX1ZJRVdQT1JUX01PRFVMRVMsIHRoaXMub25Nb2R1bGVVcGRhdGVIYW5kbGVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggbG9vcHMgb3ZlciB0aGUgY3VycmVudCBtb2R1bGVzIGFuZCBkZXRlcm1pbmVzXG4gICAqIHdoaWNoIGFyZSBjdXJyZW50bHkgaW4gdGhlIHZpZXdwb3J0LiBEZXBlbmRpbmcgb24gd2hldGhlciBvclxuICAgKiBub3QgdGhleSBhcmUgdmlzaWJsZSBhIGRhdGEgYXR0cmlidXRlIGJvb2xlYW4gaXMgdG9nZ2xlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25TY3JvbGwoKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0aGlzLm1vZHVsZXMsIChtb2R1bGUpID0+IHtcbiAgICAgIGlmIChpc3Njcm9sbGVkaW50b3ZpZXcobW9kdWxlKSkge1xuICAgICAgICBpZiAobW9kdWxlLmdldEF0dHJpYnV0ZShNSVNDLkRBVEFfVklTSUJMRSkgPT09ICdmYWxzZScpIHtcbiAgICAgICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKE1JU0MuREFUQV9WSVNJQkxFLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1vZHVsZS5oYXNBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfSEFTX0FOSU1BVEVEKSAmJiBtb2R1bGUuZ2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX0JPVFRPTSkgPT09ICdhYm92ZS1ib3R0b20nKSB7XG4gICAgICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9IQVNfQU5JTUFURUQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobW9kdWxlLmdldEF0dHJpYnV0ZShNSVNDLkRBVEFfVklTSUJMRSkgPT09ICd0cnVlJykge1xuICAgICAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoTUlTQy5EQVRBX1ZJU0lCTEUsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgcmVjdCA9IG1vZHVsZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IGN1cnJlbnREYXRhUG9zaXRpb24gPSBtb2R1bGUuZ2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX1BPU0lUSU9OKTtcbiAgICAgIGNvbnN0IGNhbGN1bGF0ZWREYXRhUG9zaXRpb24gPSByZWN0LmJvdHRvbSA8IDAgPyBDTEFTU19OQU1FUy5BQk9WRV9WSUVXUE9SVCA6IHJlY3QudG9wID49IHdpbmRvdy5pbm5lckhlaWdodCA/IENMQVNTX05BTUVTLkJFTE9XX1ZJRVdQT1JUIDogQ0xBU1NfTkFNRVMuSU5fVklFV1BPUlQ7XG4gICAgICBjb25zdCBjYWxjdWxhdGVkQm90dG9tUG9zaXRpb24gPSByZWN0LmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCA/IENMQVNTX05BTUVTLkJFTE9XX0JPVFRPTSA6IENMQVNTX05BTUVTLkFCT1ZFX0JPVFRPTTtcbiAgICAgIGNvbnN0IGhhbGZ3YXlQb3NpdGlvbiA9IHJlY3QuYm90dG9tIDw9ICh3aW5kb3cuaW5uZXJIZWlnaHQgLyAxLjI1KSA/IENMQVNTX05BTUVTLkFCT1ZFX0hBTEZXQVkgOiBDTEFTU19OQU1FUy5CRUxPV19IQUxGV0FZO1xuICAgICAgaWYgKGN1cnJlbnREYXRhUG9zaXRpb24gIT09IGNhbGN1bGF0ZWREYXRhUG9zaXRpb24pIHtcbiAgICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9QT1NJVElPTiwgY2FsY3VsYXRlZERhdGFQb3NpdGlvbik7XG4gICAgICB9XG4gICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX0JPVFRPTSwgY2FsY3VsYXRlZEJvdHRvbVBvc2l0aW9uKTtcbiAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfSEFMRldBWSwgaGFsZndheVBvc2l0aW9uKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggdXBkYXRlcyB0aGUgbGlzdCBvZiBkYXRhLXZpc2libGUgbW9kdWxlcyBieSBjYWxsaW5nIGBjYWNoZURvbVJlZmVyZW5jZXNgIGFuZCBjYWxscyBgb25TY3JvbGxgXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICB1cGRhdGVNb2R1bGVzKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKCdzY3JvbGwnKTtcbiAgICB0aGlzLmNhY2hlRG9tUmVmZXJlbmNlcygpLm9uU2Nyb2xsKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBUklBLCBTRUxFQ1RPUlMsIENMQVNTX05BTUVTLCBFVkVOVFMsIEtFWV9DT0RFUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5cblxuLyoqXG4gKiBBIGNsYXNzIHdoaWNoIGhpZGVzIGFuZCByZXZlYWxzIGhpZGRlbiBtZW51IGNvbnRlbnQgYmFzZWQgb24gdXNlciBjbGljayBvZiBhIGJ1dHRvbi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTmF2IHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBOYXYgd2hpY2ggc2ltcGx5IGFzc2lnbnMgdGhlIFNjcm9sbFNlcnZpY2VcbiAgICogdG8gYSBwcm9wZXJ0eSBvbiB0aGUgY29udHJ1Y3RvciBmb3IgcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gUkVRVUlSRUQgLSB0aGUgbW9kdWxlJ3MgY29udGFpbmVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTZXJ2aWNlcyB2YXJpb3VzIHNlcnZpY2VzLCBwYXNzZWQgaW4gYXMgcGFyYW1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIFNlcnZpY2VzICkge1xuICAgIC8qKlxuICAgICAqIERPTSBub2RlIHRoYXQgaXMgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gZWxlbWVudCBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cblxuICAgIC8vIEluaXRpYWxpemUgdGhlIHZpZXdcbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdmlldyBieSBjYWxsaW5nIHRoZSBmdW5jdGlvbnMgdG9cbiAgICogY3JlYXRlIERPTSByZWZlcmVuY2VzLCBzZXR1cCBldmVudCBoYW5kbGVycyBhbmRcbiAgICogdGhlbiBjcmVhdGUgdGhlIGV2ZW50IGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEhlYWRlciBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmNhY2hlRG9tUmVmZXJlbmNlcygpXG4gICAgICAuc2V0dXBIYW5kbGVycygpXG4gICAgICAuZW5hYmxlKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWNoZSBET00gUmVmZXJlbmNlc1xuICAgKlxuICAgKiBGaW5kIGFsbCBuZWNlc3NhcnkgRE9NIGVsZW1lbnRzIHVzZWQgaW4gdGhlIHZpZXcgYW5kIGNhY2hlIHRoZW1cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBIZWFkZXIgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGNhY2hlRG9tUmVmZXJlbmNlcygpIHtcbiAgICB0aGlzLm5hdlRyaWdnZXIgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihTRUxFQ1RPUlMuTkFWX1RSSUdHRVIpO1xuICAgIHRoaXMuc2l0ZU5hdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoU0VMRUNUT1JTLlNJVEVfTkFWKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmQgZXZlbnQgaGFuZGxlcnMgd2l0aCB0aGUgcHJvcGVyIGNvbnRleHQgb2YgYHRoaXNgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IE5hdiBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0dXBIYW5kbGVycygpIHtcbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYG9uQ2xpY2tgIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlclxuICAgICAqIGNvbnRleHQgYm91bmQgdG8gdGhlIFNWR1Njcm9sbEFuaW1hdGlvbnMgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHRoaXMub25DbGlja0hhbmRsZXIgPSB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBldmVudCBoYW5kbGVycyB0byBlbmFibGUgaW50ZXJhY3Rpb24gd2l0aCB2aWV3XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gTmF2IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbmFibGUoKSB7XG4gICAgLy8gaGFuZGxlIG5hdiB0cmlnZ2VyIGNsaWNrXG4gICAgdGhpcy5uYXZUcmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLkNMSUNLLCB0aGlzLm9uQ2xpY2tIYW5kbGVyKTtcbiAgICB0aGlzLm5hdlRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuS0VZX0RPV04sIHRoaXMub25DbGlja0hhbmRsZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xsaW5nIGJleW9uZCB0aGUgaGVpZ2h0IG9mIHRoZSBuYXYgd2lsbCB0cmlnZ2VyIGEgY2xhc3MgY2hhbmdlXG4gICAqIGFuZCB2aWNlIHZlcnNhLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25DbGljaygpIHtcbiAgICBjb25zdCBpc09wZW4gPSB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKENMQVNTX05BTUVTLk9QRU4pO1xuICAgIHRoaXMuaGVhZGVyT3BlbiA9ICFpc09wZW47XG4gICAgaWYgKGV2ZW50LnR5cGUgPT09IEVWRU5UUy5LRVlfRE9XTiAmJiAoXG4gICAgICBldmVudC50YXJnZXQubm9kZU5hbWUubWF0Y2goL2F8aW5wdXR8dGV4dGFyZWF8c2VsZWN0fGJ1dHRvbi9pKSB8fFxuICAgICAgKGlzT3BlbiAmJiBldmVudC5rZXlDb2RlICE9PSBLRVlfQ09ERVMuRVNDQVBFICYmIChldmVudC5rZXlDb2RlICE9PSBLRVlfQ09ERVMuU1BBQ0VCQVIgfHwgZXZlbnQuY3VycmVudFRhcmdldCA9PT0gd2luZG93KSkgfHxcbiAgICAgICghaXNPcGVuICYmIGV2ZW50LmtleUNvZGUgIT09IEtFWV9DT0RFUy5TUEFDRUJBUilcbiAgICApKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC50eXBlID09PSBFVkVOVFMuS0VZX0RPV04gJiYgZXZlbnQua2V5Q29kZSA9PT0gS0VZX0NPREVTLlNQQUNFQkFSKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5uYXZUcmlnZ2VyLmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5zaXRlTmF2LmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5uYXZUcmlnZ2VyLnNldEF0dHJpYnV0ZShBUklBLkVYUEFOREVELCBpc09wZW4pO1xuICAgIHRoaXMuc2l0ZU5hdi5zZXRBdHRyaWJ1dGUoQVJJQS5ISURERU4sIGlzT3Blbik7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKENMQVNTX05BTUVTLk9QRU5FRCk7XG4gIH1cblxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBUklBLCBTRUxFQ1RPUlMsIENMQVNTX05BTUVTLCBFVkVOVFMsIEtFWV9DT0RFUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5pbXBvcnQgeyBnZXRjb29raWUgfSBmcm9tICcuLi8uLi9VdGlscyc7XG5cblxuLyoqXG4gKiBBIGNsYXNzIHdoaWNoIGhpZGVzIGFuZCByZXZlYWxzIGhpZGRlbiBtZW51IGNvbnRlbnQgYmFzZWQgb24gdXNlciBjbGljayBvZiBhIGJ1dHRvbi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmlkZW8ge1xuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIFZpZGVvIHdoaWNoIHNpbXBseSBhc3NpZ25zIHRoZSBTY3JvbGxTZXJ2aWNlXG4gICAqIHRvIGEgcHJvcGVydHkgb24gdGhlIGNvbnRydWN0b3IgZm9yIHJlZmVyZW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFJFUVVJUkVEIC0gdGhlIG1vZHVsZSdzIGNvbnRhaW5lclxuICAgKiBAcGFyYW0ge09iamVjdH0gU2VydmljZXMgdmFyaW91cyBzZXJ2aWNlcywgcGFzc2VkIGluIGFzIHBhcmFtXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBTZXJ2aWNlcyApIHtcbiAgICAvKipcbiAgICAgKiBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IGVsZW1lbnQgRE9NIG5vZGUgdGhhdCBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSB2aWV3XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHZpZXcgYnkgY2FsbGluZyB0aGUgZnVuY3Rpb25zIHRvXG4gICAqIGNyZWF0ZSBET00gcmVmZXJlbmNlcywgc2V0dXAgZXZlbnQgaGFuZGxlcnMgYW5kXG4gICAqIHRoZW4gY3JlYXRlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBIZWFkZXIgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGluaXQoKSB7XG4gICAgY29uc29sZS5sb2coZ2V0Y29va2llKCd2aWRlbycpKVxuICAgIGlmKGdldGNvb2tpZSgndmlkZW8nKSAhPT0gJ3RydWUnKSB7XG4gICAgICB0aGlzLmNhY2hlRG9tUmVmZXJlbmNlcygpXG4gICAgICAgIC5zZXR1cEhhbmRsZXJzKClcbiAgICAgICAgLmVuYWJsZSgpO1xuXG4gICAgICAgIFxuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCd2aWRlby1vcGVuJyk7XG4gICAgICBkb2N1bWVudC5jb29raWUgPSAndmlkZW89dHJ1ZTttYXgtYWdlPTEyMDA7JztcbiAgICAgIHRoaXMuY29udGVudC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ZhZGUnKTtcbiAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWNoZSBET00gUmVmZXJlbmNlc1xuICAgKlxuICAgKiBGaW5kIGFsbCBuZWNlc3NhcnkgRE9NIGVsZW1lbnRzIHVzZWQgaW4gdGhlIHZpZXcgYW5kIGNhY2hlIHRoZW1cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBIZWFkZXIgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGNhY2hlRG9tUmVmZXJlbmNlcygpIHtcbiAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnZpZGVvX19jb250ZW50Jyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhlIHByb3BlciBjb250ZXh0IG9mIGB0aGlzYC5cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBWaWRlbyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0dXBIYW5kbGVycygpIHtcbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYG9uQ2xpY2tgIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlclxuICAgICAqIGNvbnRleHQgYm91bmRcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgdGhpcy5vbkNsaWNrSGFuZGxlciA9IHRoaXMub25DbGljay5iaW5kKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGV2ZW50IGhhbmRsZXJzIHRvIGVuYWJsZSBpbnRlcmFjdGlvbiB3aXRoIHZpZXdcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBWaWRlbyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW5hYmxlKCkge1xuICAgIC8vIGhhbmRsZSBWaWRlbyB0cmlnZ2VyIGNsaWNrXG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLkNMSUNLLCB0aGlzLm9uQ2xpY2tIYW5kbGVyKTtcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuS0VZX0RPV04sIHRoaXMub25DbGlja0hhbmRsZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2xpY2tpbmcgdGhlIGNvbnRlbnQgd2lsbCBjYXVzZSBpdCB0byBiZSByZW1vdmVkIGZyb20gc2lnaHRcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uQ2xpY2soKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZmFkZScpO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgndmlkZW8tb3BlbicpO1xuICB9XG59XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbid1c2Ugc3RyaWN0JztcblxuLy8gRm91bmRhdGlvbiBDb3JlXG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi5jb3JlLmpzJztcbi8vIEZvdW5kYXRpb24gVXRpbGl0aWVzXG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLmJveC5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLm1vdGlvbi5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLm5lc3QuanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwudG91Y2guanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyc7XG4vLyBGb3VuZGF0aW9uIFBsdWdpbnMuIEFkZCBvciByZW1vdmUgYXMgbmVlZGVkIGZvciB5b3VyIHNpdGVcbi8vIGltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmRyaWxsZG93bi5qcyc7XG4vLyBpbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi5kcm9wZG93bk1lbnUuanMnO1xuLy8gaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24ub2ZmY2FudmFzLmpzJztcblxuaW1wb3J0IGpxdWVyeSBmcm9tICdqcXVlcnknO1xuaW1wb3J0ICd2ZW5kb3IvX3JlbGxheC5qcyc7XG5pbXBvcnQgc29jaWFsU2hhcmUgZnJvbSAnbW9kdWxlcy9zb2NpYWxTaGFyZS5qcyc7XG4vLyBpbXBvcnQgY2Fyb3VzZWwgZnJvbSAnbW9kdWxlcy9jYXJvdXNlbC5qcyc7XG5cbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAnO1xuXG4oZnVuY3Rpb24oJCkge1xuICAvLyBJbml0aWFsaXplIEZvdW5kYXRpb25cbiAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xuXG4gIC8vIFByZXBhcmUgZm9ybSBpbnB1dHNcbiAgLy8gcHJlcElucHV0cygpO1xuICAvLyBJbml0aWFsaXplIHNvY2lhbCBzaGFyZSBmdW5jdGlvbmFsaXR5XG4gIC8vIFJlcGxhY2UgdGhlIGVtcHR5IHN0cmluZyBwYXJhbWV0ZXIgd2l0aCB5b3VyIEZhY2Vib29rIElEXG4gIHNvY2lhbFNoYXJlKCcnKTtcblxuICAvLyBBdHRhY2ggQXBwIHRvIHRoZSB3aW5kb3dcbiAgd2luZG93LkFwcCA9IG5ldyBBcHAoKTtcbn0pKGpxdWVyeSk7XG5cbnZhciByZWxsYXggPSBuZXcgUmVsbGF4KCcucmVsbGF4Jyk7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcblxuY29uc3Qgc29jaWFsU2hhcmUgPSBmdW5jdGlvbihmYklkKSB7XG4gIGNvbnN0ICRib2R5ID0gJCgnYm9keScpO1xuXG4gIC8vIEZhY2Vib29rIHNoYXJpbmcgd2l0aCB0aGUgU0RLXG4gICQuZ2V0U2NyaXB0KCcvL2Nvbm5lY3QuZmFjZWJvb2submV0L2VuX1VTL3Nkay5qcycpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgJGJvZHkub24oJ2NsaWNrLnNoYXJlci1mYicsICcuc2hhcmVyLWZiJywgZnVuY3Rpb24oZSkge1xuICAgICAgY29uc3QgJGxpbmsgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBtZXRob2Q6ICdmZWVkJyxcbiAgICAgICAgZGlzcGxheTogJ3BvcHVwJyxcbiAgICAgIH07XG4gICAgICBjb25zdCBuZXdVcmwgPSAkbGluay5kYXRhKCdyZWRpcmVjdC10bycpID9cbiAgICAgICAgICAkbGluay5kYXRhKCdyZWRpcmVjdC10bycpIDogbnVsbDtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB3aW5kb3cuRkIuaW5pdCh7XG4gICAgICAgIGFwcElkOiBmYklkLFxuICAgICAgICB4ZmJtbDogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICd2Mi4wJyxcbiAgICAgICAgc3RhdHVzOiBmYWxzZSxcbiAgICAgICAgY29va2llOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCd0aXRsZScpKSB7XG4gICAgICAgIG9wdGlvbnMubmFtZSA9ICRsaW5rLmRhdGEoJ3RpdGxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCd1cmwnKSkge1xuICAgICAgICBvcHRpb25zLmxpbmsgPSAkbGluay5kYXRhKCd1cmwnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRsaW5rLmRhdGEoJ3BpY3R1cmUnKSkge1xuICAgICAgICBvcHRpb25zLnBpY3R1cmUgPSAkbGluay5kYXRhKCdwaWN0dXJlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpKSB7XG4gICAgICAgIG9wdGlvbnMuZGVzY3JpcHRpb24gPSAkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cuRkIudWkob3B0aW9ucywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKG5ld1VybCkge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gVHdpdHRlciBzaGFyaW5nXG4gICRib2R5Lm9uKCdjbGljay5zaGFyZXItdHcnLCAnLnNoYXJlci10dycsIGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCAkbGluayA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICBjb25zdCB1cmwgPSAkbGluay5kYXRhKCd1cmwnKTtcbiAgICBjb25zdCB0ZXh0ID0gJGxpbmsuZGF0YSgnZGVzY3JpcHRpb24nKTtcbiAgICBjb25zdCB2aWEgPSAkbGluay5kYXRhKCdzb3VyY2UnKTtcbiAgICBsZXQgdHdpdHRlclVSTCA9IGBodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh1cmwpfWA7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAodGV4dCkge1xuICAgICAgdHdpdHRlclVSTCArPSBgJnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQodGV4dCl9YDtcbiAgICB9XG4gICAgaWYgKHZpYSkge1xuICAgICAgdHdpdHRlclVSTCArPSBgJnZpYT0ke2VuY29kZVVSSUNvbXBvbmVudCh2aWEpfWA7XG4gICAgfVxuICAgIHdpbmRvdy5vcGVuKHR3aXR0ZXJVUkwsICd0d2VldCcsXG4gICAgICAgICd3aWR0aD01MDAsaGVpZ2h0PTM4NCxtZW51YmFyPW5vLHN0YXR1cz1ubyx0b29sYmFyPW5vJyk7XG4gIH0pO1xuXG4gIC8vIExpbmtlZEluIHNoYXJpbmdcbiAgJGJvZHkub24oJ2NsaWNrLnNoYXJlci1saScsICcuc2hhcmVyLWxpJywgZnVuY3Rpb24oZSkge1xuICAgIGNvbnN0ICRsaW5rID0gJChlLnRhcmdldCk7XG4gICAgY29uc3QgdXJsID0gJGxpbmsuZGF0YSgndXJsJyk7XG4gICAgY29uc3QgdGl0bGUgPSAkbGluay5kYXRhKCd0aXRsZScpO1xuICAgIGNvbnN0IHN1bW1hcnkgPSAkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpO1xuICAgIGNvbnN0IHNvdXJjZSA9ICRsaW5rLmRhdGEoJ3NvdXJjZScpO1xuICAgIGxldCBsaW5rZWRpblVSTCA9ICdodHRwczovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlP21pbmk9dHJ1ZSZ1cmw9JyArXG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBsaW5rZWRpblVSTCArPSBgJnRpdGxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpdGxlKX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaW5rZWRpblVSTCArPSAnJnRpdGxlPSc7XG4gICAgfVxuXG4gICAgaWYgKHN1bW1hcnkpIHtcbiAgICAgIGxpbmtlZGluVVJMICs9XG4gICAgICAgICAgYCZzdW1tYXJ5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHN1bW1hcnkuc3Vic3RyaW5nKDAsIDI1NikpfWA7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgbGlua2VkaW5VUkwgKz0gYCZzb3VyY2U9JHtlbmNvZGVVUklDb21wb25lbnQoc291cmNlKX1gO1xuICAgIH1cblxuICAgIHdpbmRvdy5vcGVuKGxpbmtlZGluVVJMLCAnbGlua2VkaW4nLFxuICAgICAgICAnd2lkdGg9NTIwLGhlaWdodD01NzAsbWVudWJhcj1ubyxzdGF0dXM9bm8sdG9vbGJhcj1ubycpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNvY2lhbFNoYXJlO1xuIiwiXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJlbGxheC5qc1xuLy8gQnV0dGVyeSBzbW9vdGggcGFyYWxsYXggbGlicmFyeVxuLy8gQ29weXJpZ2h0IChjKSAyMDE2IE1vZSBBbWF5YSAoQG1vZWFtYXlhKVxuLy8gTUlUIGxpY2Vuc2Vcbi8vXG4vLyBUaGFua3MgdG8gUGFyYXhpZnkuanMgYW5kIEphaW1lIENhYmxsZXJvXG4vLyBmb3IgcGFyYWxsYXggY29uY2VwdHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUywgYnV0XG4gICAgLy8gb25seSBDb21tb25KUy1saWtlIGVudmlyb25tZW50cyB0aGF0IHN1cHBvcnQgbW9kdWxlLmV4cG9ydHMsXG4gICAgLy8gbGlrZSBOb2RlLlxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG4gICAgcm9vdC5SZWxsYXggPSBmYWN0b3J5KCk7XG4gIH1cbn0odHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IGdsb2JhbCwgZnVuY3Rpb24gKCkge1xuICB2YXIgUmVsbGF4ID0gZnVuY3Rpb24oZWwsIG9wdGlvbnMpe1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIHNlbGYgPSBPYmplY3QuY3JlYXRlKFJlbGxheC5wcm90b3R5cGUpO1xuXG4gICAgdmFyIHBvc1kgPSAwO1xuICAgIHZhciBzY3JlZW5ZID0gMDtcbiAgICB2YXIgcG9zWCA9IDA7XG4gICAgdmFyIHNjcmVlblggPSAwO1xuICAgIHZhciBibG9ja3MgPSBbXTtcbiAgICB2YXIgcGF1c2UgPSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgd2hhdCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgdG8gdXNlLCBhbmQgaWZcbiAgICAvLyBpdCdzIG5vdCBzdXBwb3J0ZWQsIHVzZSB0aGUgb25zY3JvbGwgZXZlbnRcbiAgICB2YXIgbG9vcCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIGZ1bmN0aW9uKGNhbGxiYWNrKXsgcmV0dXJuIHNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7IH07XG5cbiAgICAvLyBzdG9yZSB0aGUgaWQgZm9yIGxhdGVyIHVzZVxuICAgIHZhciBsb29wSWQgPSBudWxsO1xuXG4gICAgLy8gVGVzdCB2aWEgYSBnZXR0ZXIgaW4gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIHNlZSBpZiB0aGUgcGFzc2l2ZSBwcm9wZXJ0eSBpcyBhY2Nlc3NlZFxuICAgIHZhciBzdXBwb3J0c1Bhc3NpdmUgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgdmFyIG9wdHMgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICdwYXNzaXZlJywge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHN1cHBvcnRzUGFzc2l2ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ0ZXN0UGFzc2l2ZVwiLCBudWxsLCBvcHRzKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwidGVzdFBhc3NpdmVcIiwgbnVsbCwgb3B0cyk7XG4gICAgfSBjYXRjaCAoZSkge31cblxuICAgIC8vIGNoZWNrIHdoYXQgY2FuY2VsQW5pbWF0aW9uIG1ldGhvZCB0byB1c2VcbiAgICB2YXIgY2xlYXJMb29wID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fCBjbGVhclRpbWVvdXQ7XG5cbiAgICAvLyBjaGVjayB3aGljaCB0cmFuc2Zvcm0gcHJvcGVydHkgdG8gdXNlXG4gICAgdmFyIHRyYW5zZm9ybVByb3AgPSB3aW5kb3cudHJhbnNmb3JtUHJvcCB8fCAoZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHRlc3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBpZiAodGVzdEVsLnN0eWxlLnRyYW5zZm9ybSA9PT0gbnVsbCkge1xuICAgICAgICAgIHZhciB2ZW5kb3JzID0gWydXZWJraXQnLCAnTW96JywgJ21zJ107XG4gICAgICAgICAgZm9yICh2YXIgdmVuZG9yIGluIHZlbmRvcnMpIHtcbiAgICAgICAgICAgIGlmICh0ZXN0RWwuc3R5bGVbIHZlbmRvcnNbdmVuZG9yXSArICdUcmFuc2Zvcm0nIF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICByZXR1cm4gdmVuZG9yc1t2ZW5kb3JdICsgJ1RyYW5zZm9ybSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAndHJhbnNmb3JtJztcbiAgICAgIH0pKCk7XG5cbiAgICAvLyBEZWZhdWx0IFNldHRpbmdzXG4gICAgc2VsZi5vcHRpb25zID0ge1xuICAgICAgc3BlZWQ6IC0yLFxuXHQgICAgdmVydGljYWxTcGVlZDogbnVsbCxcblx0ICAgIGhvcml6b250YWxTcGVlZDogbnVsbCxcbiAgICAgIGJyZWFrcG9pbnRzOiBbNTc2LCA3NjgsIDEyMDFdLFxuICAgICAgY2VudGVyOiBmYWxzZSxcbiAgICAgIHdyYXBwZXI6IG51bGwsXG4gICAgICByZWxhdGl2ZVRvV3JhcHBlcjogZmFsc2UsXG4gICAgICByb3VuZDogdHJ1ZSxcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgICAgaG9yaXpvbnRhbDogZmFsc2UsXG4gICAgICB2ZXJ0aWNhbFNjcm9sbEF4aXM6IFwieVwiLFxuICAgICAgaG9yaXpvbnRhbFNjcm9sbEF4aXM6IFwieFwiLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge30sXG4gICAgfTtcblxuICAgIC8vIFVzZXIgZGVmaW5lZCBvcHRpb25zIChtaWdodCBoYXZlIG1vcmUgaW4gdGhlIGZ1dHVyZSlcbiAgICBpZiAob3B0aW9ucyl7XG4gICAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XG4gICAgICAgIHNlbGYub3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVDdXN0b21CcmVha3BvaW50cyAoKSB7XG4gICAgICBpZiAoc2VsZi5vcHRpb25zLmJyZWFrcG9pbnRzLmxlbmd0aCA9PT0gMyAmJiBBcnJheS5pc0FycmF5KHNlbGYub3B0aW9ucy5icmVha3BvaW50cykpIHtcbiAgICAgICAgdmFyIGlzQXNjZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgdmFyIGlzTnVtZXJpY2FsID0gdHJ1ZTtcbiAgICAgICAgdmFyIGxhc3RWYWw7XG4gICAgICAgIHNlbGYub3B0aW9ucy5icmVha3BvaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBpICE9PSAnbnVtYmVyJykgaXNOdW1lcmljYWwgPSBmYWxzZTtcbiAgICAgICAgICBpZiAobGFzdFZhbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGkgPCBsYXN0VmFsKSBpc0FzY2VuZGluZyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXN0VmFsID0gaTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpc0FzY2VuZGluZyAmJiBpc051bWVyaWNhbCkgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gcmV2ZXJ0IGRlZmF1bHRzIGlmIHNldCBpbmNvcnJlY3RseVxuICAgICAgc2VsZi5vcHRpb25zLmJyZWFrcG9pbnRzID0gWzU3NiwgNzY4LCAxMjAxXTtcbiAgICAgIGNvbnNvbGUud2FybihcIlJlbGxheDogWW91IG11c3QgcGFzcyBhbiBhcnJheSBvZiAzIG51bWJlcnMgaW4gYXNjZW5kaW5nIG9yZGVyIHRvIHRoZSBicmVha3BvaW50cyBvcHRpb24uIERlZmF1bHRzIHJldmVydGVkXCIpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYnJlYWtwb2ludHMpIHtcbiAgICAgIHZhbGlkYXRlQ3VzdG9tQnJlYWtwb2ludHMoKTtcbiAgICB9XG5cbiAgICAvLyBCeSBkZWZhdWx0LCByZWxsYXggY2xhc3NcbiAgICBpZiAoIWVsKSB7XG4gICAgICBlbCA9ICcucmVsbGF4JztcbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiBlbCBpcyBhIGNsYXNzTmFtZSBvciBhIG5vZGVcbiAgICB2YXIgZWxlbWVudHMgPSB0eXBlb2YgZWwgPT09ICdzdHJpbmcnID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbCkgOiBbZWxdO1xuXG4gICAgLy8gTm93IHF1ZXJ5IHNlbGVjdG9yXG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHNlbGYuZWxlbXMgPSBlbGVtZW50cztcbiAgICB9XG5cbiAgICAvLyBUaGUgZWxlbWVudHMgZG9uJ3QgZXhpc3RcbiAgICBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcIlJlbGxheDogVGhlIGVsZW1lbnRzIHlvdSdyZSB0cnlpbmcgdG8gc2VsZWN0IGRvbid0IGV4aXN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBIYXMgYSB3cmFwcGVyIGFuZCBpdCBleGlzdHNcbiAgICBpZiAoc2VsZi5vcHRpb25zLndyYXBwZXIpIHtcbiAgICAgIGlmICghc2VsZi5vcHRpb25zLndyYXBwZXIubm9kZVR5cGUpIHtcbiAgICAgICAgdmFyIHdyYXBwZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGYub3B0aW9ucy53cmFwcGVyKTtcblxuICAgICAgICBpZiAod3JhcHBlcikge1xuICAgICAgICAgIHNlbGYub3B0aW9ucy53cmFwcGVyID0gd3JhcHBlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJSZWxsYXg6IFRoZSB3cmFwcGVyIHlvdSdyZSB0cnlpbmcgdG8gdXNlIGRvZXNuJ3QgZXhpc3QuXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCBhIHBsYWNlaG9sZGVyIGZvciB0aGUgY3VycmVudCBicmVha3BvaW50XG4gICAgdmFyIGN1cnJlbnRCcmVha3BvaW50O1xuXG4gICAgLy8gaGVscGVyIHRvIGRldGVybWluZSBjdXJyZW50IGJyZWFrcG9pbnRcbiAgICB2YXIgZ2V0Q3VycmVudEJyZWFrcG9pbnQgPSBmdW5jdGlvbiAodykge1xuICAgICAgdmFyIGJwID0gc2VsZi5vcHRpb25zLmJyZWFrcG9pbnRzO1xuICAgICAgaWYgKHcgPCBicFswXSkgcmV0dXJuICd4cyc7XG4gICAgICBpZiAodyA+PSBicFswXSAmJiB3IDwgYnBbMV0pIHJldHVybiAnc20nO1xuICAgICAgaWYgKHcgPj0gYnBbMV0gJiYgdyA8IGJwWzJdKSByZXR1cm4gJ21kJztcbiAgICAgIHJldHVybiAnbGcnO1xuICAgIH07XG5cbiAgICAvLyBHZXQgYW5kIGNhY2hlIGluaXRpYWwgcG9zaXRpb24gb2YgYWxsIGVsZW1lbnRzXG4gICAgdmFyIGNhY2hlQmxvY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZWxlbXMubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgYmxvY2sgPSBjcmVhdGVCbG9jayhzZWxmLmVsZW1zW2ldKTtcbiAgICAgICAgYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgfVxuICAgIH07XG5cblxuICAgIC8vIExldCdzIGtpY2sgdGhpcyBzY3JpcHQgb2ZmXG4gICAgLy8gQnVpbGQgYXJyYXkgZm9yIGNhY2hlZCBlbGVtZW50IHZhbHVlc1xuICAgIHZhciBpbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgIHNlbGYuZWxlbXNbaV0uc3R5bGUuY3NzVGV4dCA9IGJsb2Nrc1tpXS5zdHlsZTtcbiAgICAgIH1cblxuICAgICAgYmxvY2tzID0gW107XG5cbiAgICAgIHNjcmVlblkgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICBzY3JlZW5YID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICBjdXJyZW50QnJlYWtwb2ludCA9IGdldEN1cnJlbnRCcmVha3BvaW50KHNjcmVlblgpO1xuXG4gICAgICBzZXRQb3NpdGlvbigpO1xuXG4gICAgICBjYWNoZUJsb2NrcygpO1xuXG4gICAgICBhbmltYXRlKCk7XG5cbiAgICAgIC8vIElmIHBhdXNlZCwgdW5wYXVzZSBhbmQgc2V0IGxpc3RlbmVyIGZvciB3aW5kb3cgcmVzaXppbmcgZXZlbnRzXG4gICAgICBpZiAocGF1c2UpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGluaXQpO1xuICAgICAgICBwYXVzZSA9IGZhbHNlO1xuICAgICAgICAvLyBTdGFydCB0aGUgbG9vcFxuICAgICAgICB1cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gV2Ugd2FudCB0byBjYWNoZSB0aGUgcGFyYWxsYXggYmxvY2tzJ1xuICAgIC8vIHZhbHVlczogYmFzZSwgdG9wLCBoZWlnaHQsIHNwZWVkXG4gICAgLy8gZWw6IGlzIGRvbSBvYmplY3QsIHJldHVybjogZWwgY2FjaGUgdmFsdWVzXG4gICAgdmFyIGNyZWF0ZUJsb2NrID0gZnVuY3Rpb24oZWwpIHtcbiAgICAgIHZhciBkYXRhUGVyY2VudGFnZSA9IGVsLmdldEF0dHJpYnV0ZSggJ2RhdGEtcmVsbGF4LXBlcmNlbnRhZ2UnICk7XG4gICAgICB2YXIgZGF0YVNwZWVkID0gZWwuZ2V0QXR0cmlidXRlKCAnZGF0YS1yZWxsYXgtc3BlZWQnICk7XG4gICAgICB2YXIgZGF0YVhzU3BlZWQgPSBlbC5nZXRBdHRyaWJ1dGUoICdkYXRhLXJlbGxheC14cy1zcGVlZCcgKTtcbiAgICAgIHZhciBkYXRhTW9iaWxlU3BlZWQgPSBlbC5nZXRBdHRyaWJ1dGUoICdkYXRhLXJlbGxheC1tb2JpbGUtc3BlZWQnICk7XG4gICAgICB2YXIgZGF0YVRhYmxldFNwZWVkID0gZWwuZ2V0QXR0cmlidXRlKCAnZGF0YS1yZWxsYXgtdGFibGV0LXNwZWVkJyApO1xuICAgICAgdmFyIGRhdGFEZXNrdG9wU3BlZWQgPSBlbC5nZXRBdHRyaWJ1dGUoICdkYXRhLXJlbGxheC1kZXNrdG9wLXNwZWVkJyApO1xuICAgICAgdmFyIGRhdGFWZXJ0aWNhbFNwZWVkID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXJlbGxheC12ZXJ0aWNhbC1zcGVlZCcpO1xuICAgICAgdmFyIGRhdGFIb3Jpem9udGFsU3BlZWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVsbGF4LWhvcml6b250YWwtc3BlZWQnKTtcbiAgICAgIHZhciBkYXRhVmVyaWNhbFNjcm9sbEF4aXMgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVsbGF4LXZlcnRpY2FsLXNjcm9sbC1heGlzJyk7XG4gICAgICB2YXIgZGF0YUhvcml6b250YWxTY3JvbGxBeGlzID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXJlbGxheC1ob3Jpem9udGFsLXNjcm9sbC1heGlzJyk7XG4gICAgICB2YXIgZGF0YVppbmRleCA9IGVsLmdldEF0dHJpYnV0ZSggJ2RhdGEtcmVsbGF4LXppbmRleCcgKSB8fCAwO1xuICAgICAgdmFyIGRhdGFNaW4gPSBlbC5nZXRBdHRyaWJ1dGUoICdkYXRhLXJlbGxheC1taW4nICk7XG4gICAgICB2YXIgZGF0YU1heCA9IGVsLmdldEF0dHJpYnV0ZSggJ2RhdGEtcmVsbGF4LW1heCcgKTtcbiAgICAgIHZhciBkYXRhTWluWCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtbWluLXgnKTtcbiAgICAgIHZhciBkYXRhTWF4WCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtbWF4LXgnKTtcbiAgICAgIHZhciBkYXRhTWluWSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtbWluLXknKTtcbiAgICAgIHZhciBkYXRhTWF4WSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtbWF4LXknKTtcbiAgICAgIHZhciBtYXBCcmVha3BvaW50cztcbiAgICAgIHZhciBicmVha3BvaW50cyA9IHRydWU7XG5cbiAgICAgIGlmICghZGF0YVhzU3BlZWQgJiYgIWRhdGFNb2JpbGVTcGVlZCAmJiAhZGF0YVRhYmxldFNwZWVkICYmICFkYXRhRGVza3RvcFNwZWVkKSB7XG4gICAgICAgIGJyZWFrcG9pbnRzID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXBCcmVha3BvaW50cyA9IHtcbiAgICAgICAgICAneHMnOiBkYXRhWHNTcGVlZCxcbiAgICAgICAgICAnc20nOiBkYXRhTW9iaWxlU3BlZWQsXG4gICAgICAgICAgJ21kJzogZGF0YVRhYmxldFNwZWVkLFxuICAgICAgICAgICdsZyc6IGRhdGFEZXNrdG9wU3BlZWRcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5pdGlhbGl6aW5nIGF0IHNjcm9sbFkgPSAwICh0b3Agb2YgYnJvd3NlciksIHNjcm9sbFggPSAwIChsZWZ0IG9mIGJyb3dzZXIpXG4gICAgICAvLyBlbnN1cmVzIGVsZW1lbnRzIGFyZSBwb3NpdGlvbmVkIGJhc2VkIG9uIEhUTUwgbGF5b3V0LlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyB0aGUgcGVyY2VudGFnZSBhdHRyaWJ1dGUsIHRoZSBwb3NZIGFuZCBwb3NYIG5lZWRzIHRvIGJlXG4gICAgICAvLyB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24ncyB2YWx1ZSwgc28gdGhhdCB0aGUgZWxlbWVudHMgYXJlIHN0aWxsIHBvc2l0aW9uZWQgYmFzZWQgb24gSFRNTCBsYXlvdXRcbiAgICAgIHZhciB3cmFwcGVyUG9zWSA9IHNlbGYub3B0aW9ucy53cmFwcGVyID8gc2VsZi5vcHRpb25zLndyYXBwZXIuc2Nyb2xsVG9wIDogKHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKTtcbiAgICAgIC8vIElmIHRoZSBvcHRpb24gcmVsYXRpdmVUb1dyYXBwZXIgaXMgdHJ1ZSwgdXNlIHRoZSB3cmFwcGVycyBvZmZzZXQgdG8gdG9wLCBzdWJ0cmFjdGVkIGZyb20gdGhlIGN1cnJlbnQgcGFnZSBzY3JvbGwuXG4gICAgICBpZiAoc2VsZi5vcHRpb25zLnJlbGF0aXZlVG9XcmFwcGVyKSB7XG4gICAgICAgIHZhciBzY3JvbGxQb3NZID0gKHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKTtcbiAgICAgICAgd3JhcHBlclBvc1kgPSBzY3JvbGxQb3NZIC0gc2VsZi5vcHRpb25zLndyYXBwZXIub2Zmc2V0VG9wO1xuICAgICAgfVxuICAgICAgdmFyIHBvc1kgPSBzZWxmLm9wdGlvbnMudmVydGljYWwgPyAoIGRhdGFQZXJjZW50YWdlIHx8IHNlbGYub3B0aW9ucy5jZW50ZXIgPyB3cmFwcGVyUG9zWSA6IDAgKSA6IDA7XG4gICAgICB2YXIgcG9zWCA9IHNlbGYub3B0aW9ucy5ob3Jpem9udGFsID8gKCBkYXRhUGVyY2VudGFnZSB8fCBzZWxmLm9wdGlvbnMuY2VudGVyID8gc2VsZi5vcHRpb25zLndyYXBwZXIgPyBzZWxmLm9wdGlvbnMud3JhcHBlci5zY3JvbGxMZWZ0IDogKHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQpIDogMCApIDogMDtcblxuICAgICAgdmFyIGJsb2NrVG9wID0gcG9zWSArIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgIHZhciBibG9ja0hlaWdodCA9IGVsLmNsaWVudEhlaWdodCB8fCBlbC5vZmZzZXRIZWlnaHQgfHwgZWwuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICB2YXIgYmxvY2tMZWZ0ID0gcG9zWCArIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQ7XG4gICAgICB2YXIgYmxvY2tXaWR0aCA9IGVsLmNsaWVudFdpZHRoIHx8IGVsLm9mZnNldFdpZHRoIHx8IGVsLnNjcm9sbFdpZHRoO1xuXG4gICAgICAvLyBhcHBhcmVudGx5IHBhcmFsbGF4IGVxdWF0aW9uIGV2ZXJ5b25lIHVzZXNcbiAgICAgIHZhciBwZXJjZW50YWdlWSA9IGRhdGFQZXJjZW50YWdlID8gZGF0YVBlcmNlbnRhZ2UgOiAocG9zWSAtIGJsb2NrVG9wICsgc2NyZWVuWSkgLyAoYmxvY2tIZWlnaHQgKyBzY3JlZW5ZKTtcbiAgICAgIHZhciBwZXJjZW50YWdlWCA9IGRhdGFQZXJjZW50YWdlID8gZGF0YVBlcmNlbnRhZ2UgOiAocG9zWCAtIGJsb2NrTGVmdCArIHNjcmVlblgpIC8gKGJsb2NrV2lkdGggKyBzY3JlZW5YKTtcbiAgICAgIGlmKHNlbGYub3B0aW9ucy5jZW50ZXIpeyBwZXJjZW50YWdlWCA9IDAuNTsgcGVyY2VudGFnZVkgPSAwLjU7IH1cblxuICAgICAgLy8gT3B0aW9uYWwgaW5kaXZpZHVhbCBibG9jayBzcGVlZCBhcyBkYXRhIGF0dHIsIG90aGVyd2lzZSBnbG9iYWwgc3BlZWRcbiAgICAgIHZhciBzcGVlZCA9IChicmVha3BvaW50cyAmJiBtYXBCcmVha3BvaW50c1tjdXJyZW50QnJlYWtwb2ludF0gIT09IG51bGwpID8gTnVtYmVyKG1hcEJyZWFrcG9pbnRzW2N1cnJlbnRCcmVha3BvaW50XSkgOiAoZGF0YVNwZWVkID8gZGF0YVNwZWVkIDogc2VsZi5vcHRpb25zLnNwZWVkKTtcbiAgICAgIHZhciB2ZXJ0aWNhbFNwZWVkID0gZGF0YVZlcnRpY2FsU3BlZWQgPyBkYXRhVmVydGljYWxTcGVlZCA6IHNlbGYub3B0aW9ucy52ZXJ0aWNhbFNwZWVkO1xuICAgICAgdmFyIGhvcml6b250YWxTcGVlZCA9IGRhdGFIb3Jpem9udGFsU3BlZWQgPyBkYXRhSG9yaXpvbnRhbFNwZWVkIDogc2VsZi5vcHRpb25zLmhvcml6b250YWxTcGVlZDtcblxuICAgICAgLy8gT3B0aW9uYWwgaW5kaXZpZHVhbCBibG9jayBtb3ZlbWVudCBheGlzIGRpcmVjdGlvbiBhcyBkYXRhIGF0dHIsIG90aGVyd2lzZSBnb2JhbCBtb3ZlbWVudCBkaXJlY3Rpb25cbiAgICAgIHZhciB2ZXJ0aWNhbFNjcm9sbEF4aXMgPSBkYXRhVmVyaWNhbFNjcm9sbEF4aXMgPyBkYXRhVmVyaWNhbFNjcm9sbEF4aXMgOiBzZWxmLm9wdGlvbnMudmVydGljYWxTY3JvbGxBeGlzO1xuICAgICAgdmFyIGhvcml6b250YWxTY3JvbGxBeGlzID0gZGF0YUhvcml6b250YWxTY3JvbGxBeGlzID8gZGF0YUhvcml6b250YWxTY3JvbGxBeGlzIDogc2VsZi5vcHRpb25zLmhvcml6b250YWxTY3JvbGxBeGlzO1xuXG4gICAgICB2YXIgYmFzZXMgPSB1cGRhdGVQb3NpdGlvbihwZXJjZW50YWdlWCwgcGVyY2VudGFnZVksIHNwZWVkLCB2ZXJ0aWNhbFNwZWVkLCBob3Jpem9udGFsU3BlZWQpO1xuXG4gICAgICAvLyB+flN0b3JlIG5vbi10cmFuc2xhdGUzZCB0cmFuc2Zvcm1zfn5cbiAgICAgIC8vIFN0b3JlIGlubGluZSBzdHlsZXMgYW5kIGV4dHJhY3QgdHJhbnNmb3Jtc1xuICAgICAgdmFyIHN0eWxlID0gZWwuc3R5bGUuY3NzVGV4dDtcbiAgICAgIHZhciB0cmFuc2Zvcm0gPSAnJztcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUncyBhbiBpbmxpbmUgc3R5bGVkIHRyYW5zZm9ybVxuICAgICAgdmFyIHNlYXJjaFJlc3VsdCA9IC90cmFuc2Zvcm1cXHMqOi9pLmV4ZWMoc3R5bGUpO1xuICAgICAgaWYgKHNlYXJjaFJlc3VsdCkge1xuICAgICAgICAvLyBHZXQgdGhlIGluZGV4IG9mIHRoZSB0cmFuc2Zvcm1cbiAgICAgICAgdmFyIGluZGV4ID0gc2VhcmNoUmVzdWx0LmluZGV4O1xuXG4gICAgICAgIC8vIFRyaW0gdGhlIHN0eWxlIHRvIHRoZSB0cmFuc2Zvcm0gcG9pbnQgYW5kIGdldCB0aGUgZm9sbG93aW5nIHNlbWktY29sb24gaW5kZXhcbiAgICAgICAgdmFyIHRyaW1tZWRTdHlsZSA9IHN0eWxlLnNsaWNlKGluZGV4KTtcbiAgICAgICAgdmFyIGRlbGltaXRlciA9IHRyaW1tZWRTdHlsZS5pbmRleE9mKCc7Jyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIFwidHJhbnNmb3JtXCIgc3RyaW5nIGFuZCBzYXZlIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgaWYgKGRlbGltaXRlcikge1xuICAgICAgICAgIHRyYW5zZm9ybSA9IFwiIFwiICsgdHJpbW1lZFN0eWxlLnNsaWNlKDExLCBkZWxpbWl0ZXIpLnJlcGxhY2UoL1xccy9nLCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cmFuc2Zvcm0gPSBcIiBcIiArIHRyaW1tZWRTdHlsZS5zbGljZSgxMSkucmVwbGFjZSgvXFxzL2csJycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJhc2VYOiBiYXNlcy54LFxuICAgICAgICBiYXNlWTogYmFzZXMueSxcbiAgICAgICAgdG9wOiBibG9ja1RvcCxcbiAgICAgICAgbGVmdDogYmxvY2tMZWZ0LFxuICAgICAgICBoZWlnaHQ6IGJsb2NrSGVpZ2h0LFxuICAgICAgICB3aWR0aDogYmxvY2tXaWR0aCxcbiAgICAgICAgc3BlZWQ6IHNwZWVkLFxuICAgICAgICB2ZXJ0aWNhbFNwZWVkOiB2ZXJ0aWNhbFNwZWVkLFxuICAgICAgICBob3Jpem9udGFsU3BlZWQ6IGhvcml6b250YWxTcGVlZCxcbiAgICAgICAgdmVydGljYWxTY3JvbGxBeGlzOiB2ZXJ0aWNhbFNjcm9sbEF4aXMsXG4gICAgICAgIGhvcml6b250YWxTY3JvbGxBeGlzOiBob3Jpem9udGFsU2Nyb2xsQXhpcyxcbiAgICAgICAgc3R5bGU6IHN0eWxlLFxuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybSxcbiAgICAgICAgemluZGV4OiBkYXRhWmluZGV4LFxuICAgICAgICBtaW46IGRhdGFNaW4sXG4gICAgICAgIG1heDogZGF0YU1heCxcbiAgICAgICAgbWluWDogZGF0YU1pblgsXG4gICAgICAgIG1heFg6IGRhdGFNYXhYLFxuICAgICAgICBtaW5ZOiBkYXRhTWluWSxcbiAgICAgICAgbWF4WTogZGF0YU1heFlcbiAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIHNldCBzY3JvbGwgcG9zaXRpb24gKHBvc1ksIHBvc1gpXG4gICAgLy8gc2lkZSBlZmZlY3QgbWV0aG9kIGlzIG5vdCBpZGVhbCwgYnV0IG9rYXkgZm9yIG5vd1xuICAgIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGUgc2Nyb2xsIGNoYW5nZWQsIGZhbHNlIGlmIG5vdGhpbmcgaGFwcGVuZWRcbiAgICB2YXIgc2V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvbGRZID0gcG9zWTtcbiAgICAgIHZhciBvbGRYID0gcG9zWDtcblxuICAgICAgcG9zWSA9IHNlbGYub3B0aW9ucy53cmFwcGVyID8gc2VsZi5vcHRpb25zLndyYXBwZXIuc2Nyb2xsVG9wIDogKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wIHx8IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgIHBvc1ggPSBzZWxmLm9wdGlvbnMud3JhcHBlciA/IHNlbGYub3B0aW9ucy53cmFwcGVyLnNjcm9sbExlZnQgOiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0IHx8IHdpbmRvdy5wYWdlWE9mZnNldDtcbiAgICAgIC8vIElmIG9wdGlvbiByZWxhdGl2ZVRvV3JhcHBlciBpcyB0cnVlLCB1c2UgcmVsYXRpdmUgd3JhcHBlciB2YWx1ZSBpbnN0ZWFkLlxuICAgICAgaWYgKHNlbGYub3B0aW9ucy5yZWxhdGl2ZVRvV3JhcHBlcikge1xuICAgICAgICB2YXIgc2Nyb2xsUG9zWSA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCB8fCB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgIHBvc1kgPSBzY3JvbGxQb3NZIC0gc2VsZi5vcHRpb25zLndyYXBwZXIub2Zmc2V0VG9wO1xuICAgICAgfVxuXG5cbiAgICAgIGlmIChvbGRZICE9IHBvc1kgJiYgc2VsZi5vcHRpb25zLnZlcnRpY2FsKSB7XG4gICAgICAgIC8vIHNjcm9sbCBjaGFuZ2VkLCByZXR1cm4gdHJ1ZVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9sZFggIT0gcG9zWCAmJiBzZWxmLm9wdGlvbnMuaG9yaXpvbnRhbCkge1xuICAgICAgICAvLyBzY3JvbGwgY2hhbmdlZCwgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIHNjcm9sbCBkaWQgbm90IGNoYW5nZVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvLyBBaGggYSBwdXJlIGZ1bmN0aW9uLCBnZXRzIG5ldyB0cmFuc2Zvcm0gdmFsdWVcbiAgICAvLyBiYXNlZCBvbiBzY3JvbGxQb3NpdGlvbiBhbmQgc3BlZWRcbiAgICAvLyBBbGxvdyBmb3IgZGVjaW1hbCBwaXhlbCB2YWx1ZXNcbiAgICB2YXIgdXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbihwZXJjZW50YWdlWCwgcGVyY2VudGFnZVksIHNwZWVkLCB2ZXJ0aWNhbFNwZWVkLCBob3Jpem9udGFsU3BlZWQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHZhciB2YWx1ZVggPSAoKGhvcml6b250YWxTcGVlZCA/IGhvcml6b250YWxTcGVlZCA6IHNwZWVkKSAqICgxMDAgKiAoMSAtIHBlcmNlbnRhZ2VYKSkpO1xuICAgICAgdmFyIHZhbHVlWSA9ICgodmVydGljYWxTcGVlZCA/IHZlcnRpY2FsU3BlZWQgOiBzcGVlZCkgKiAoMTAwICogKDEgLSBwZXJjZW50YWdlWSkpKTtcblxuICAgICAgcmVzdWx0LnggPSBzZWxmLm9wdGlvbnMucm91bmQgPyBNYXRoLnJvdW5kKHZhbHVlWCkgOiBNYXRoLnJvdW5kKHZhbHVlWCAqIDEwMCkgLyAxMDA7XG4gICAgICByZXN1bHQueSA9IHNlbGYub3B0aW9ucy5yb3VuZCA/IE1hdGgucm91bmQodmFsdWVZKSA6IE1hdGgucm91bmQodmFsdWVZICogMTAwKSAvIDEwMDtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLy8gUmVtb3ZlIGV2ZW50IGxpc3RlbmVycyBhbmQgbG9vcCBhZ2FpblxuICAgIHZhciBkZWZlcnJlZFVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGRlZmVycmVkVXBkYXRlKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIGRlZmVycmVkVXBkYXRlKTtcbiAgICAgIChzZWxmLm9wdGlvbnMud3JhcHBlciA/IHNlbGYub3B0aW9ucy53cmFwcGVyIDogd2luZG93KS5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBkZWZlcnJlZFVwZGF0ZSk7XG4gICAgICAoc2VsZi5vcHRpb25zLndyYXBwZXIgPyBzZWxmLm9wdGlvbnMud3JhcHBlciA6IGRvY3VtZW50KS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkZWZlcnJlZFVwZGF0ZSk7XG5cbiAgICAgIC8vIGxvb3AgYWdhaW5cbiAgICAgIGxvb3BJZCA9IGxvb3AodXBkYXRlKTtcbiAgICB9O1xuXG4gICAgLy8gTG9vcFxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZXRQb3NpdGlvbigpICYmIHBhdXNlID09PSBmYWxzZSkge1xuICAgICAgICBhbmltYXRlKCk7XG5cbiAgICAgICAgLy8gbG9vcCBhZ2FpblxuICAgICAgICBsb29wSWQgPSBsb29wKHVwZGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb29wSWQgPSBudWxsO1xuXG4gICAgICAgIC8vIERvbid0IGFuaW1hdGUgdW50aWwgd2UgZ2V0IGEgcG9zaXRpb24gdXBkYXRpbmcgZXZlbnRcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGRlZmVycmVkVXBkYXRlKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgZGVmZXJyZWRVcGRhdGUpO1xuICAgICAgICAoc2VsZi5vcHRpb25zLndyYXBwZXIgPyBzZWxmLm9wdGlvbnMud3JhcHBlciA6IHdpbmRvdykuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZGVmZXJyZWRVcGRhdGUsIHN1cHBvcnRzUGFzc2l2ZSA/IHsgcGFzc2l2ZTogdHJ1ZSB9IDogZmFsc2UpO1xuICAgICAgICAoc2VsZi5vcHRpb25zLndyYXBwZXIgPyBzZWxmLm9wdGlvbnMud3JhcHBlciA6IGRvY3VtZW50KS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkZWZlcnJlZFVwZGF0ZSwgc3VwcG9ydHNQYXNzaXZlID8geyBwYXNzaXZlOiB0cnVlIH0gOiBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFRyYW5zZm9ybTNkIG9uIHBhcmFsbGF4IGVsZW1lbnRcbiAgICB2YXIgYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvc2l0aW9ucztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5lbGVtcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgIC8vIERldGVybWluZSByZWxldmFudCBtb3ZlbWVudCBkaXJlY3Rpb25zXG4gICAgICAgIHZhciB2ZXJ0aWNhbFNjcm9sbEF4aXMgPSBibG9ja3NbaV0udmVydGljYWxTY3JvbGxBeGlzLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBob3Jpem9udGFsU2Nyb2xsQXhpcyA9IGJsb2Nrc1tpXS5ob3Jpem9udGFsU2Nyb2xsQXhpcy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgdmVydGljYWxTY3JvbGxYID0gdmVydGljYWxTY3JvbGxBeGlzLmluZGV4T2YoXCJ4XCIpICE9IC0xID8gcG9zWSA6IDA7XG4gICAgICAgIHZhciB2ZXJ0aWNhbFNjcm9sbFkgPSB2ZXJ0aWNhbFNjcm9sbEF4aXMuaW5kZXhPZihcInlcIikgIT0gLTEgPyBwb3NZIDogMDtcbiAgICAgICAgdmFyIGhvcml6b250YWxTY3JvbGxYID0gaG9yaXpvbnRhbFNjcm9sbEF4aXMuaW5kZXhPZihcInhcIikgIT0gLTEgPyBwb3NYIDogMDtcbiAgICAgICAgdmFyIGhvcml6b250YWxTY3JvbGxZID0gaG9yaXpvbnRhbFNjcm9sbEF4aXMuaW5kZXhPZihcInlcIikgIT0gLTEgPyBwb3NYIDogMDtcblxuICAgICAgICB2YXIgcGVyY2VudGFnZVkgPSAoKHZlcnRpY2FsU2Nyb2xsWSArIGhvcml6b250YWxTY3JvbGxZIC0gYmxvY2tzW2ldLnRvcCArIHNjcmVlblkpIC8gKGJsb2Nrc1tpXS5oZWlnaHQgKyBzY3JlZW5ZKSk7XG4gICAgICAgIHZhciBwZXJjZW50YWdlWCA9ICgodmVydGljYWxTY3JvbGxYICsgaG9yaXpvbnRhbFNjcm9sbFggLSBibG9ja3NbaV0ubGVmdCArIHNjcmVlblgpIC8gKGJsb2Nrc1tpXS53aWR0aCArIHNjcmVlblgpKTtcblxuICAgICAgICAvLyBTdWJ0cmFjdGluZyBpbml0aWFsaXplIHZhbHVlLCBzbyBlbGVtZW50IHN0YXlzIGluIHNhbWUgc3BvdCBhcyBIVE1MXG4gICAgICAgIHBvc2l0aW9ucyA9IHVwZGF0ZVBvc2l0aW9uKHBlcmNlbnRhZ2VYLCBwZXJjZW50YWdlWSwgYmxvY2tzW2ldLnNwZWVkLCBibG9ja3NbaV0udmVydGljYWxTcGVlZCwgYmxvY2tzW2ldLmhvcml6b250YWxTcGVlZCk7XG4gICAgICAgIHZhciBwb3NpdGlvblkgPSBwb3NpdGlvbnMueSAtIGJsb2Nrc1tpXS5iYXNlWTtcbiAgICAgICAgdmFyIHBvc2l0aW9uWCA9IHBvc2l0aW9ucy54IC0gYmxvY2tzW2ldLmJhc2VYO1xuXG4gICAgICAgIC8vIFRoZSBuZXh0IHR3byBcImlmXCIgYmxvY2tzIGdvIGxpa2UgdGhpczpcbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBsaW1pdCBpcyBkZWZpbmVkIChmaXJzdCBcIm1pblwiLCB0aGVuIFwibWF4XCIpO1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGNoYW5nZSB0aGUgWSBvciB0aGUgWFxuICAgICAgICAvLyAoQ3VycmVudGx5IHdvcmtpbmcgb25seSBpZiBqdXN0IG9uZSBvZiB0aGUgYXhlcyBpcyBlbmFibGVkKVxuICAgICAgICAvLyBUaGVuLCBjaGVjayBpZiB0aGUgbmV3IHBvc2l0aW9uIGlzIGluc2lkZSB0aGUgYWxsb3dlZCBsaW1pdFxuICAgICAgICAvLyBJZiBzbywgdXNlIG5ldyBwb3NpdGlvbi4gSWYgbm90LCBzZXQgcG9zaXRpb24gdG8gbGltaXQuXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBtaW4gbGltaXQgaXMgZGVmaW5lZFxuICAgICAgICBpZiAoYmxvY2tzW2ldLm1pbiAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmIChzZWxmLm9wdGlvbnMudmVydGljYWwgJiYgIXNlbGYub3B0aW9ucy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblkgPD0gYmxvY2tzW2ldLm1pbiA/IGJsb2Nrc1tpXS5taW4gOiBwb3NpdGlvblk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzZWxmLm9wdGlvbnMuaG9yaXpvbnRhbCAmJiAhc2VsZi5vcHRpb25zLnZlcnRpY2FsKSB7XG4gICAgICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblggPD0gYmxvY2tzW2ldLm1pbiA/IGJsb2Nrc1tpXS5taW4gOiBwb3NpdGlvblg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgZGlyZWN0aW9uYWwgbWluIGxpbWl0cyBhcmUgZGVmaW5lZFxuICAgICAgICBpZiAoYmxvY2tzW2ldLm1pblkgIT0gbnVsbCkge1xuICAgICAgICAgICAgcG9zaXRpb25ZID0gcG9zaXRpb25ZIDw9IGJsb2Nrc1tpXS5taW5ZID8gYmxvY2tzW2ldLm1pblkgOiBwb3NpdGlvblk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJsb2Nrc1tpXS5taW5YICE9IG51bGwpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWCA8PSBibG9ja3NbaV0ubWluWCA/IGJsb2Nrc1tpXS5taW5YIDogcG9zaXRpb25YO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBtYXggbGltaXQgaXMgZGVmaW5lZFxuICAgICAgICBpZiAoYmxvY2tzW2ldLm1heCAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmIChzZWxmLm9wdGlvbnMudmVydGljYWwgJiYgIXNlbGYub3B0aW9ucy5ob3Jpem9udGFsKSB7XG4gICAgICAgICAgICBwb3NpdGlvblkgPSBwb3NpdGlvblkgPj0gYmxvY2tzW2ldLm1heCA/IGJsb2Nrc1tpXS5tYXggOiBwb3NpdGlvblk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzZWxmLm9wdGlvbnMuaG9yaXpvbnRhbCAmJiAhc2VsZi5vcHRpb25zLnZlcnRpY2FsKSB7XG4gICAgICAgICAgICBwb3NpdGlvblggPSBwb3NpdGlvblggPj0gYmxvY2tzW2ldLm1heCA/IGJsb2Nrc1tpXS5tYXggOiBwb3NpdGlvblg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgZGlyZWN0aW9uYWwgbWF4IGxpbWl0cyBhcmUgZGVmaW5lZFxuICAgICAgICBpZiAoYmxvY2tzW2ldLm1heFkgIT0gbnVsbCkge1xuICAgICAgICAgICAgcG9zaXRpb25ZID0gcG9zaXRpb25ZID49IGJsb2Nrc1tpXS5tYXhZID8gYmxvY2tzW2ldLm1heFkgOiBwb3NpdGlvblk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJsb2Nrc1tpXS5tYXhYICE9IG51bGwpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uWCA9IHBvc2l0aW9uWCA+PSBibG9ja3NbaV0ubWF4WCA/IGJsb2Nrc1tpXS5tYXhYIDogcG9zaXRpb25YO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHppbmRleCA9IGJsb2Nrc1tpXS56aW5kZXg7XG5cbiAgICAgICAgLy8gTW92ZSB0aGF0IGVsZW1lbnRcbiAgICAgICAgLy8gKFNldCB0aGUgbmV3IHRyYW5zbGF0aW9uIGFuZCBhcHBlbmQgaW5pdGlhbCBpbmxpbmUgdHJhbnNmb3Jtcy4pXG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSAndHJhbnNsYXRlM2QoJyArIChzZWxmLm9wdGlvbnMuaG9yaXpvbnRhbCA/IHBvc2l0aW9uWCA6ICcwJykgKyAncHgsJyArIChzZWxmLm9wdGlvbnMudmVydGljYWwgPyBwb3NpdGlvblkgOiAnMCcpICsgJ3B4LCcgKyB6aW5kZXggKyAncHgpICcgKyBibG9ja3NbaV0udHJhbnNmb3JtO1xuICAgICAgICBzZWxmLmVsZW1zW2ldLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdHJhbnNsYXRlO1xuICAgICAgfVxuICAgICAgc2VsZi5vcHRpb25zLmNhbGxiYWNrKHBvc2l0aW9ucyk7XG4gICAgfTtcblxuICAgIHNlbGYuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmVsZW1zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgc2VsZi5lbGVtc1tpXS5zdHlsZS5jc3NUZXh0ID0gYmxvY2tzW2ldLnN0eWxlO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgcmVzaXplIGV2ZW50IGxpc3RlbmVyIGlmIG5vdCBwYXVzZSwgYW5kIHBhdXNlXG4gICAgICBpZiAoIXBhdXNlKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBpbml0KTtcbiAgICAgICAgcGF1c2UgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBDbGVhciB0aGUgYW5pbWF0aW9uIGxvb3AgdG8gcHJldmVudCBwb3NzaWJsZSBtZW1vcnkgbGVha1xuICAgICAgY2xlYXJMb29wKGxvb3BJZCk7XG4gICAgICBsb29wSWQgPSBudWxsO1xuICAgIH07XG5cbiAgICAvLyBJbml0XG4gICAgaW5pdCgpO1xuXG4gICAgLy8gQWxsb3cgdG8gcmVjYWxjdWxhdGUgdGhlIGluaXRpYWwgdmFsdWVzIHdoZW5ldmVyIHdlIHdhbnRcbiAgICBzZWxmLnJlZnJlc2ggPSBpbml0O1xuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG4gIHJldHVybiBSZWxsYXg7XG59KSk7Il19
