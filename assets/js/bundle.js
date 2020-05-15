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
Object.defineProperty(exports, "__esModule", { value: true });var _Nav = require('./components/views/Nav');var _Nav2 = _interopRequireDefault(_Nav);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}
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
    Nav: _Nav2.default
    // Form,
    // Filter,
    // Video
    // Anchor,
    // Slider,
    // SocialShare,
    // InViewport,
    // Banner,
};

},{"./components/views/Nav":34}],13:[function(require,module,exports){
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
      window.addEventListener(_Constants.EVENTS.KEY_DOWN, this.onClickHandler);

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

},{"./App":11,"foundation-sites/js/foundation.core.js":1,"foundation-sites/js/foundation.offcanvas.js":2,"foundation-sites/js/foundation.util.box.js":3,"foundation-sites/js/foundation.util.keyboard.js":4,"foundation-sites/js/foundation.util.mediaQuery.js":5,"foundation-sites/js/foundation.util.motion.js":6,"foundation-sites/js/foundation.util.nest.js":7,"foundation-sites/js/foundation.util.timerAndImageLoader.js":8,"foundation-sites/js/foundation.util.touch.js":9,"foundation-sites/js/foundation.util.triggers.js":10,"modules/socialShare.js":36}],36:[function(require,module,exports){
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

},{}]},{},[35])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLmNvcmUuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5ib3guanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJub2RlX21vZHVsZXMvZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9mb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwibm9kZV9tb2R1bGVzL2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwic3JjL2pzL0FwcC5qcyIsInNyYy9qcy9Db21wb25lbnRNYXAuanMiLCJzcmMvanMvQ29uc3RhbnRzL2FyaWEuanMiLCJzcmMvanMvQ29uc3RhbnRzL2NsYXNzLW5hbWVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9lbmRwb2ludHMuanMiLCJzcmMvanMvQ29uc3RhbnRzL2Vycm9ycy5qcyIsInNyYy9qcy9Db25zdGFudHMvZXZlbnRzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9pbmRleC5qcyIsInNyYy9qcy9Db25zdGFudHMva2V5LWNvZGVzLmpzIiwic3JjL2pzL0NvbnN0YW50cy9taXNjLmpzIiwic3JjL2pzL0NvbnN0YW50cy9zZWxlY3RvcnMuanMiLCJzcmMvanMvVXRpbHMvZGVib3VuY2UuanMiLCJzcmMvanMvVXRpbHMvZ2V0Y29va2llLmpzIiwic3JjL2pzL1V0aWxzL2luZGV4LmpzIiwic3JjL2pzL1V0aWxzL2lzc2Nyb2xsZWRpbnRvdmlldy5qcyIsInNyYy9qcy9VdGlscy9vcGVucG9wdXAuanMiLCJzcmMvanMvVXRpbHMvcmFuZG9tc2VjdXJlc3RyaW5nLmpzIiwic3JjL2pzL1V0aWxzL3Njcm9sbHRvLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvQ2xpY2tTZXJ2aWNlLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VydmljZXMvUmVzaXplU2VydmljZS5qcyIsInNyYy9qcy9jb21wb25lbnRzL3NlcnZpY2VzL1Njcm9sbFNlcnZpY2UuanMiLCJzcmMvanMvY29tcG9uZW50cy9zZXJ2aWNlcy9pbmRleC5qcyIsInNyYy9qcy9jb21wb25lbnRzL3ZpZXdzL0luVmlld3BvcnQuanMiLCJzcmMvanMvY29tcG9uZW50cy92aWV3cy9OYXYuanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9tb2R1bGVzL3NvY2lhbFNoYXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO3NSQ0FBLENBQUMsVUFBUyxDQUFULEVBQVk7O0FBRWI7O0FBRUEsTUFBSSxxQkFBcUIsT0FBekI7O0FBRUE7QUFDQTtBQUNBLE1BQUksYUFBYTtBQUNmLGFBQVMsa0JBRE07O0FBR2Y7OztBQUdBLGNBQVUsRUFOSzs7QUFRZjs7O0FBR0EsWUFBUSxFQVhPOztBQWFmOzs7QUFHQSxTQUFLLGVBQVU7QUFDYixhQUFPLEVBQUUsTUFBRixFQUFVLElBQVYsQ0FBZSxLQUFmLE1BQTBCLEtBQWpDO0FBQ0QsS0FsQmM7QUFtQmY7Ozs7QUFJQSxZQUFRLGdCQUFTLE9BQVQsRUFBaUIsSUFBakIsRUFB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QUUsTUFBSixDQUFkO0FBQ0EsUUFBTSxNQUFNLE1BQU0sSUFBTixDQUFXLEtBQVgsQ0FBWjtBQUNBLFFBQU0sUUFBUSxNQUFNLElBQU4sQ0FBVyxPQUFYLENBQWQ7QUFDQSxRQUFNLFVBQVUsTUFBTSxJQUFOLENBQVcsYUFBWCxDQUFoQjtBQUNBLFFBQU0sU0FBUyxNQUFNLElBQU4sQ0FBVyxRQUFYLENBQWY7QUFDQSxRQUFJLGNBQWM7QUFDZCx1QkFBbUIsR0FBbkIsQ0FESjs7QUFHQSxNQUFFLGNBQUY7O0FBRUEsUUFBSSxLQUFKLEVBQVc7QUFDVCxpQ0FBeUIsbUJBQW1CLEtBQW5CLENBQXpCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wscUJBQWUsU0FBZjtBQUNEOztBQUVELFFBQUksT0FBSixFQUFhO0FBQ1g7QUFDZ0IseUJBQW1CLFFBQVEsU0FBUixDQUFrQixDQUFsQixFQUFxQixHQUFyQixDQUFuQixDQURoQjtBQUVEOztBQUVELFFBQUksTUFBSixFQUFZO0FBQ1Ysa0NBQTBCLG1CQUFtQixNQUFuQixDQUExQjtBQUNEOztBQUVELFdBQU8sSUFBUCxDQUFZLFdBQVosRUFBeUIsVUFBekI7QUFDSSwwREFESjtBQUVELEdBNUJEO0FBNkJELENBbEdELEM7O0FBb0dlLFciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCQpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBGT1VOREFUSU9OX1ZFUlNJT04gPSAnNi4zLjEnO1xuXG4vLyBHbG9iYWwgRm91bmRhdGlvbiBvYmplY3Rcbi8vIFRoaXMgaXMgYXR0YWNoZWQgdG8gdGhlIHdpbmRvdywgb3IgdXNlZCBhcyBhIG1vZHVsZSBmb3IgQU1EL0Jyb3dzZXJpZnlcbnZhciBGb3VuZGF0aW9uID0ge1xuICB2ZXJzaW9uOiBGT1VOREFUSU9OX1ZFUlNJT04sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBpbml0aWFsaXplZCBwbHVnaW5zLlxuICAgKi9cbiAgX3BsdWdpbnM6IHt9LFxuXG4gIC8qKlxuICAgKiBTdG9yZXMgZ2VuZXJhdGVkIHVuaXF1ZSBpZHMgZm9yIHBsdWdpbiBpbnN0YW5jZXNcbiAgICovXG4gIF91dWlkczogW10sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBib29sZWFuIGZvciBSVEwgc3VwcG9ydFxuICAgKi9cbiAgcnRsOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiAkKCdodG1sJykuYXR0cignZGlyJykgPT09ICdydGwnO1xuICB9LFxuICAvKipcbiAgICogRGVmaW5lcyBhIEZvdW5kYXRpb24gcGx1Z2luLCBhZGRpbmcgaXQgdG8gdGhlIGBGb3VuZGF0aW9uYCBuYW1lc3BhY2UgYW5kIHRoZSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZSB3aGVuIHJlZmxvd2luZy5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIFRoZSBjb25zdHJ1Y3RvciBvZiB0aGUgcGx1Z2luLlxuICAgKi9cbiAgcGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpIHtcbiAgICAvLyBPYmplY3Qga2V5IHRvIHVzZSB3aGVuIGFkZGluZyB0byBnbG9iYWwgRm91bmRhdGlvbiBvYmplY3RcbiAgICAvLyBFeGFtcGxlczogRm91bmRhdGlvbi5SZXZlYWwsIEZvdW5kYXRpb24uT2ZmQ2FudmFzXG4gICAgdmFyIGNsYXNzTmFtZSA9IChuYW1lIHx8IGZ1bmN0aW9uTmFtZShwbHVnaW4pKTtcbiAgICAvLyBPYmplY3Qga2V5IHRvIHVzZSB3aGVuIHN0b3JpbmcgdGhlIHBsdWdpbiwgYWxzbyB1c2VkIHRvIGNyZWF0ZSB0aGUgaWRlbnRpZnlpbmcgZGF0YSBhdHRyaWJ1dGUgZm9yIHRoZSBwbHVnaW5cbiAgICAvLyBFeGFtcGxlczogZGF0YS1yZXZlYWwsIGRhdGEtb2ZmLWNhbnZhc1xuICAgIHZhciBhdHRyTmFtZSAgPSBoeXBoZW5hdGUoY2xhc3NOYW1lKTtcblxuICAgIC8vIEFkZCB0byB0aGUgRm91bmRhdGlvbiBvYmplY3QgYW5kIHRoZSBwbHVnaW5zIGxpc3QgKGZvciByZWZsb3dpbmcpXG4gICAgdGhpcy5fcGx1Z2luc1thdHRyTmFtZV0gPSB0aGlzW2NsYXNzTmFtZV0gPSBwbHVnaW47XG4gIH0sXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogUG9wdWxhdGVzIHRoZSBfdXVpZHMgYXJyYXkgd2l0aCBwb2ludGVycyB0byBlYWNoIGluZGl2aWR1YWwgcGx1Z2luIGluc3RhbmNlLlxuICAgKiBBZGRzIHRoZSBgemZQbHVnaW5gIGRhdGEtYXR0cmlidXRlIHRvIHByb2dyYW1tYXRpY2FsbHkgY3JlYXRlZCBwbHVnaW5zIHRvIGFsbG93IHVzZSBvZiAkKHNlbGVjdG9yKS5mb3VuZGF0aW9uKG1ldGhvZCkgY2FsbHMuXG4gICAqIEFsc28gZmlyZXMgdGhlIGluaXRpYWxpemF0aW9uIGV2ZW50IGZvciBlYWNoIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBldGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgcGx1Z2luLCBwYXNzZWQgYXMgYSBjYW1lbENhc2VkIHN0cmluZy5cbiAgICogQGZpcmVzIFBsdWdpbiNpbml0XG4gICAqL1xuICByZWdpc3RlclBsdWdpbjogZnVuY3Rpb24ocGx1Z2luLCBuYW1lKXtcbiAgICB2YXIgcGx1Z2luTmFtZSA9IG5hbWUgPyBoeXBoZW5hdGUobmFtZSkgOiBmdW5jdGlvbk5hbWUocGx1Z2luLmNvbnN0cnVjdG9yKS50b0xvd2VyQ2FzZSgpO1xuICAgIHBsdWdpbi51dWlkID0gdGhpcy5HZXRZb0RpZ2l0cyg2LCBwbHVnaW5OYW1lKTtcblxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuYXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCkpeyBwbHVnaW4uJGVsZW1lbnQuYXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCwgcGx1Z2luLnV1aWQpOyB9XG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpKXsgcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJywgcGx1Z2luKTsgfVxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgaW5pdGlhbGl6ZWQuXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNpbml0XG4gICAgICAgICAgICovXG4gICAgcGx1Z2luLiRlbGVtZW50LnRyaWdnZXIoYGluaXQuemYuJHtwbHVnaW5OYW1lfWApO1xuXG4gICAgdGhpcy5fdXVpZHMucHVzaChwbHVnaW4udXVpZCk7XG5cbiAgICByZXR1cm47XG4gIH0sXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogUmVtb3ZlcyB0aGUgcGx1Z2lucyB1dWlkIGZyb20gdGhlIF91dWlkcyBhcnJheS5cbiAgICogUmVtb3ZlcyB0aGUgemZQbHVnaW4gZGF0YSBhdHRyaWJ1dGUsIGFzIHdlbGwgYXMgdGhlIGRhdGEtcGx1Z2luLW5hbWUgYXR0cmlidXRlLlxuICAgKiBBbHNvIGZpcmVzIHRoZSBkZXN0cm95ZWQgZXZlbnQgZm9yIHRoZSBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZXRpdGl2ZSBjb2RlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXG4gICAqIEBmaXJlcyBQbHVnaW4jZGVzdHJveWVkXG4gICAqL1xuICB1bnJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4pe1xuICAgIHZhciBwbHVnaW5OYW1lID0gaHlwaGVuYXRlKGZ1bmN0aW9uTmFtZShwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKS5jb25zdHJ1Y3RvcikpO1xuXG4gICAgdGhpcy5fdXVpZHMuc3BsaWNlKHRoaXMuX3V1aWRzLmluZGV4T2YocGx1Z2luLnV1aWQpLCAxKTtcbiAgICBwbHVnaW4uJGVsZW1lbnQucmVtb3ZlQXR0cihgZGF0YS0ke3BsdWdpbk5hbWV9YCkucmVtb3ZlRGF0YSgnemZQbHVnaW4nKVxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgYmVlbiBkZXN0cm95ZWQuXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNkZXN0cm95ZWRcbiAgICAgICAgICAgKi9cbiAgICAgICAgICAudHJpZ2dlcihgZGVzdHJveWVkLnpmLiR7cGx1Z2luTmFtZX1gKTtcbiAgICBmb3IodmFyIHByb3AgaW4gcGx1Z2luKXtcbiAgICAgIHBsdWdpbltwcm9wXSA9IG51bGw7Ly9jbGVhbiB1cCBzY3JpcHQgdG8gcHJlcCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICAgIH1cbiAgICByZXR1cm47XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBDYXVzZXMgb25lIG9yIG1vcmUgYWN0aXZlIHBsdWdpbnMgdG8gcmUtaW5pdGlhbGl6ZSwgcmVzZXR0aW5nIGV2ZW50IGxpc3RlbmVycywgcmVjYWxjdWxhdGluZyBwb3NpdGlvbnMsIGV0Yy5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBsdWdpbnMgLSBvcHRpb25hbCBzdHJpbmcgb2YgYW4gaW5kaXZpZHVhbCBwbHVnaW4ga2V5LCBhdHRhaW5lZCBieSBjYWxsaW5nIGAkKGVsZW1lbnQpLmRhdGEoJ3BsdWdpbk5hbWUnKWAsIG9yIHN0cmluZyBvZiBhIHBsdWdpbiBjbGFzcyBpLmUuIGAnZHJvcGRvd24nYFxuICAgKiBAZGVmYXVsdCBJZiBubyBhcmd1bWVudCBpcyBwYXNzZWQsIHJlZmxvdyBhbGwgY3VycmVudGx5IGFjdGl2ZSBwbHVnaW5zLlxuICAgKi9cbiAgIHJlSW5pdDogZnVuY3Rpb24ocGx1Z2lucyl7XG4gICAgIHZhciBpc0pRID0gcGx1Z2lucyBpbnN0YW5jZW9mICQ7XG4gICAgIHRyeXtcbiAgICAgICBpZihpc0pRKXtcbiAgICAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAkKHRoaXMpLmRhdGEoJ3pmUGx1Z2luJykuX2luaXQoKTtcbiAgICAgICAgIH0pO1xuICAgICAgIH1lbHNle1xuICAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgcGx1Z2lucyxcbiAgICAgICAgIF90aGlzID0gdGhpcyxcbiAgICAgICAgIGZucyA9IHtcbiAgICAgICAgICAgJ29iamVjdCc6IGZ1bmN0aW9uKHBsZ3Mpe1xuICAgICAgICAgICAgIHBsZ3MuZm9yRWFjaChmdW5jdGlvbihwKXtcbiAgICAgICAgICAgICAgIHAgPSBoeXBoZW5hdGUocCk7XG4gICAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICdzdHJpbmcnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHBsdWdpbnMgPSBoeXBoZW5hdGUocGx1Z2lucyk7XG4gICAgICAgICAgICAgJCgnW2RhdGEtJysgcGx1Z2lucyArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xuICAgICAgICAgICB9LFxuICAgICAgICAgICAndW5kZWZpbmVkJzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICB0aGlzWydvYmplY3QnXShPYmplY3Qua2V5cyhfdGhpcy5fcGx1Z2lucykpO1xuICAgICAgICAgICB9XG4gICAgICAgICB9O1xuICAgICAgICAgZm5zW3R5cGVdKHBsdWdpbnMpO1xuICAgICAgIH1cbiAgICAgfWNhdGNoKGVycil7XG4gICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICB9ZmluYWxseXtcbiAgICAgICByZXR1cm4gcGx1Z2lucztcbiAgICAgfVxuICAgfSxcblxuICAvKipcbiAgICogcmV0dXJucyBhIHJhbmRvbSBiYXNlLTM2IHVpZCB3aXRoIG5hbWVzcGFjaW5nXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge051bWJlcn0gbGVuZ3RoIC0gbnVtYmVyIG9mIHJhbmRvbSBiYXNlLTM2IGRpZ2l0cyBkZXNpcmVkLiBJbmNyZWFzZSBmb3IgbW9yZSByYW5kb20gc3RyaW5ncy5cbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZSAtIG5hbWUgb2YgcGx1Z2luIHRvIGJlIGluY29ycG9yYXRlZCBpbiB1aWQsIG9wdGlvbmFsLlxuICAgKiBAZGVmYXVsdCB7U3RyaW5nfSAnJyAtIGlmIG5vIHBsdWdpbiBuYW1lIGlzIHByb3ZpZGVkLCBub3RoaW5nIGlzIGFwcGVuZGVkIHRvIHRoZSB1aWQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IC0gdW5pcXVlIGlkXG4gICAqL1xuICBHZXRZb0RpZ2l0czogZnVuY3Rpb24obGVuZ3RoLCBuYW1lc3BhY2Upe1xuICAgIGxlbmd0aCA9IGxlbmd0aCB8fCA2O1xuICAgIHJldHVybiBNYXRoLnJvdW5kKChNYXRoLnBvdygzNiwgbGVuZ3RoICsgMSkgLSBNYXRoLnJhbmRvbSgpICogTWF0aC5wb3coMzYsIGxlbmd0aCkpKS50b1N0cmluZygzNikuc2xpY2UoMSkgKyAobmFtZXNwYWNlID8gYC0ke25hbWVzcGFjZX1gIDogJycpO1xuICB9LFxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBwbHVnaW5zIG9uIGFueSBlbGVtZW50cyB3aXRoaW4gYGVsZW1gIChhbmQgYGVsZW1gIGl0c2VsZikgdGhhdCBhcmVuJ3QgYWxyZWFkeSBpbml0aWFsaXplZC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW0gLSBqUXVlcnkgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGVsZW1lbnQgdG8gY2hlY2sgaW5zaWRlLiBBbHNvIGNoZWNrcyB0aGUgZWxlbWVudCBpdHNlbGYsIHVubGVzcyBpdCdzIHRoZSBgZG9jdW1lbnRgIG9iamVjdC5cbiAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IHBsdWdpbnMgLSBBIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplLiBMZWF2ZSB0aGlzIG91dCB0byBpbml0aWFsaXplIGV2ZXJ5dGhpbmcuXG4gICAqL1xuICByZWZsb3c6IGZ1bmN0aW9uKGVsZW0sIHBsdWdpbnMpIHtcblxuICAgIC8vIElmIHBsdWdpbnMgaXMgdW5kZWZpbmVkLCBqdXN0IGdyYWIgZXZlcnl0aGluZ1xuICAgIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHBsdWdpbnMgPSBPYmplY3Qua2V5cyh0aGlzLl9wbHVnaW5zKTtcbiAgICB9XG4gICAgLy8gSWYgcGx1Z2lucyBpcyBhIHN0cmluZywgY29udmVydCBpdCB0byBhbiBhcnJheSB3aXRoIG9uZSBpdGVtXG4gICAgZWxzZSBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwbHVnaW5zID0gW3BsdWdpbnNdO1xuICAgIH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBwbHVnaW5cbiAgICAkLmVhY2gocGx1Z2lucywgZnVuY3Rpb24oaSwgbmFtZSkge1xuICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IHBsdWdpblxuICAgICAgdmFyIHBsdWdpbiA9IF90aGlzLl9wbHVnaW5zW25hbWVdO1xuXG4gICAgICAvLyBMb2NhbGl6ZSB0aGUgc2VhcmNoIHRvIGFsbCBlbGVtZW50cyBpbnNpZGUgZWxlbSwgYXMgd2VsbCBhcyBlbGVtIGl0c2VsZiwgdW5sZXNzIGVsZW0gPT09IGRvY3VtZW50XG4gICAgICB2YXIgJGVsZW0gPSAkKGVsZW0pLmZpbmQoJ1tkYXRhLScrbmFtZSsnXScpLmFkZEJhY2soJ1tkYXRhLScrbmFtZSsnXScpO1xuXG4gICAgICAvLyBGb3IgZWFjaCBwbHVnaW4gZm91bmQsIGluaXRpYWxpemUgaXRcbiAgICAgICRlbGVtLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkZWwgPSAkKHRoaXMpLFxuICAgICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICAvLyBEb24ndCBkb3VibGUtZGlwIG9uIHBsdWdpbnNcbiAgICAgICAgaWYgKCRlbC5kYXRhKCd6ZlBsdWdpbicpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiVHJpZWQgdG8gaW5pdGlhbGl6ZSBcIituYW1lK1wiIG9uIGFuIGVsZW1lbnQgdGhhdCBhbHJlYWR5IGhhcyBhIEZvdW5kYXRpb24gcGx1Z2luLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZigkZWwuYXR0cignZGF0YS1vcHRpb25zJykpe1xuICAgICAgICAgIHZhciB0aGluZyA9ICRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKS5zcGxpdCgnOycpLmZvckVhY2goZnVuY3Rpb24oZSwgaSl7XG4gICAgICAgICAgICB2YXIgb3B0ID0gZS5zcGxpdCgnOicpLm1hcChmdW5jdGlvbihlbCl7IHJldHVybiBlbC50cmltKCk7IH0pO1xuICAgICAgICAgICAgaWYob3B0WzBdKSBvcHRzW29wdFswXV0gPSBwYXJzZVZhbHVlKG9wdFsxXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5e1xuICAgICAgICAgICRlbC5kYXRhKCd6ZlBsdWdpbicsIG5ldyBwbHVnaW4oJCh0aGlzKSwgb3B0cykpO1xuICAgICAgICB9Y2F0Y2goZXIpe1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXIpO1xuICAgICAgICB9ZmluYWxseXtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuICBnZXRGbk5hbWU6IGZ1bmN0aW9uTmFtZSxcbiAgdHJhbnNpdGlvbmVuZDogZnVuY3Rpb24oJGVsZW0pe1xuICAgIHZhciB0cmFuc2l0aW9ucyA9IHtcbiAgICAgICd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ1dlYmtpdFRyYW5zaXRpb24nOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdPVHJhbnNpdGlvbic6ICdvdHJhbnNpdGlvbmVuZCdcbiAgICB9O1xuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgIGVuZDtcblxuICAgIGZvciAodmFyIHQgaW4gdHJhbnNpdGlvbnMpe1xuICAgICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3RdICE9PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIGVuZCA9IHRyYW5zaXRpb25zW3RdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZihlbmQpe1xuICAgICAgcmV0dXJuIGVuZDtcbiAgICB9ZWxzZXtcbiAgICAgIGVuZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgJGVsZW0udHJpZ2dlckhhbmRsZXIoJ3RyYW5zaXRpb25lbmQnLCBbJGVsZW1dKTtcbiAgICAgIH0sIDEpO1xuICAgICAgcmV0dXJuICd0cmFuc2l0aW9uZW5kJztcbiAgICB9XG4gIH1cbn07XG5cbkZvdW5kYXRpb24udXRpbCA9IHtcbiAgLyoqXG4gICAqIEZ1bmN0aW9uIGZvciBhcHBseWluZyBhIGRlYm91bmNlIGVmZmVjdCB0byBhIGZ1bmN0aW9uIGNhbGwuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIC0gRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGF0IGVuZCBvZiB0aW1lb3V0LlxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsYXkgLSBUaW1lIGluIG1zIHRvIGRlbGF5IHRoZSBjYWxsIG9mIGBmdW5jYC5cbiAgICogQHJldHVybnMgZnVuY3Rpb25cbiAgICovXG4gIHRocm90dGxlOiBmdW5jdGlvbiAoZnVuYywgZGVsYXkpIHtcbiAgICB2YXIgdGltZXIgPSBudWxsO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgaWYgKHRpbWVyID09PSBudWxsKSB7XG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59O1xuXG4vLyBUT0RPOiBjb25zaWRlciBub3QgbWFraW5nIHRoaXMgYSBqUXVlcnkgZnVuY3Rpb25cbi8vIFRPRE86IG5lZWQgd2F5IHRvIHJlZmxvdyB2cy4gcmUtaW5pdGlhbGl6ZVxuLyoqXG4gKiBUaGUgRm91bmRhdGlvbiBqUXVlcnkgbWV0aG9kLlxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IG1ldGhvZCAtIEFuIGFjdGlvbiB0byBwZXJmb3JtIG9uIHRoZSBjdXJyZW50IGpRdWVyeSBvYmplY3QuXG4gKi9cbnZhciBmb3VuZGF0aW9uID0gZnVuY3Rpb24obWV0aG9kKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIG1ldGhvZCxcbiAgICAgICRtZXRhID0gJCgnbWV0YS5mb3VuZGF0aW9uLW1xJyksXG4gICAgICAkbm9KUyA9ICQoJy5uby1qcycpO1xuXG4gIGlmKCEkbWV0YS5sZW5ndGgpe1xuICAgICQoJzxtZXRhIGNsYXNzPVwiZm91bmRhdGlvbi1tcVwiPicpLmFwcGVuZFRvKGRvY3VtZW50LmhlYWQpO1xuICB9XG4gIGlmKCRub0pTLmxlbmd0aCl7XG4gICAgJG5vSlMucmVtb3ZlQ2xhc3MoJ25vLWpzJyk7XG4gIH1cblxuICBpZih0eXBlID09PSAndW5kZWZpbmVkJyl7Ly9uZWVkcyB0byBpbml0aWFsaXplIHRoZSBGb3VuZGF0aW9uIG9iamVjdCwgb3IgYW4gaW5kaXZpZHVhbCBwbHVnaW4uXG4gICAgRm91bmRhdGlvbi5NZWRpYVF1ZXJ5Ll9pbml0KCk7XG4gICAgRm91bmRhdGlvbi5yZWZsb3codGhpcyk7XG4gIH1lbHNlIGlmKHR5cGUgPT09ICdzdHJpbmcnKXsvL2FuIGluZGl2aWR1YWwgbWV0aG9kIHRvIGludm9rZSBvbiBhIHBsdWdpbiBvciBncm91cCBvZiBwbHVnaW5zXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpOy8vY29sbGVjdCBhbGwgdGhlIGFyZ3VtZW50cywgaWYgbmVjZXNzYXJ5XG4gICAgdmFyIHBsdWdDbGFzcyA9IHRoaXMuZGF0YSgnemZQbHVnaW4nKTsvL2RldGVybWluZSB0aGUgY2xhc3Mgb2YgcGx1Z2luXG5cbiAgICBpZihwbHVnQ2xhc3MgIT09IHVuZGVmaW5lZCAmJiBwbHVnQ2xhc3NbbWV0aG9kXSAhPT0gdW5kZWZpbmVkKXsvL21ha2Ugc3VyZSBib3RoIHRoZSBjbGFzcyBhbmQgbWV0aG9kIGV4aXN0XG4gICAgICBpZih0aGlzLmxlbmd0aCA9PT0gMSl7Ly9pZiB0aGVyZSdzIG9ubHkgb25lLCBjYWxsIGl0IGRpcmVjdGx5LlxuICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KHBsdWdDbGFzcywgYXJncyk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGVsKXsvL290aGVyd2lzZSBsb29wIHRocm91Z2ggdGhlIGpRdWVyeSBjb2xsZWN0aW9uIGFuZCBpbnZva2UgdGhlIG1ldGhvZCBvbiBlYWNoXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkoJChlbCkuZGF0YSgnemZQbHVnaW4nKSwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1lbHNley8vZXJyb3IgZm9yIG5vIGNsYXNzIG9yIG5vIG1ldGhvZFxuICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwiV2UncmUgc29ycnksICdcIiArIG1ldGhvZCArIFwiJyBpcyBub3QgYW4gYXZhaWxhYmxlIG1ldGhvZCBmb3IgXCIgKyAocGx1Z0NsYXNzID8gZnVuY3Rpb25OYW1lKHBsdWdDbGFzcykgOiAndGhpcyBlbGVtZW50JykgKyAnLicpO1xuICAgIH1cbiAgfWVsc2V7Ly9lcnJvciBmb3IgaW52YWxpZCBhcmd1bWVudCB0eXBlXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgV2UncmUgc29ycnksICR7dHlwZX0gaXMgbm90IGEgdmFsaWQgcGFyYW1ldGVyLiBZb3UgbXVzdCB1c2UgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBtZXRob2QgeW91IHdpc2ggdG8gaW52b2tlLmApO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxud2luZG93LkZvdW5kYXRpb24gPSBGb3VuZGF0aW9uO1xuJC5mbi5mb3VuZGF0aW9uID0gZm91bmRhdGlvbjtcblxuLy8gUG9seWZpbGwgZm9yIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuKGZ1bmN0aW9uKCkge1xuICBpZiAoIURhdGUubm93IHx8ICF3aW5kb3cuRGF0ZS5ub3cpXG4gICAgd2luZG93LkRhdGUubm93ID0gRGF0ZS5ub3cgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG4gIHZhciB2ZW5kb3JzID0gWyd3ZWJraXQnLCAnbW96J107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsraSkge1xuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdnArJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gKHdpbmRvd1t2cCsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XG4gIH1cbiAgaWYgKC9pUChhZHxob25lfG9kKS4qT1MgNi8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudClcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgdmFyIGxhc3RUaW1lID0gMDtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhsYXN0VGltZSA9IG5leHRUaW1lKTsgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xuICAgIH07XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2xlYXJUaW1lb3V0O1xuICB9XG4gIC8qKlxuICAgKiBQb2x5ZmlsbCBmb3IgcGVyZm9ybWFuY2Uubm93LCByZXF1aXJlZCBieSByQUZcbiAgICovXG4gIGlmKCF3aW5kb3cucGVyZm9ybWFuY2UgfHwgIXdpbmRvdy5wZXJmb3JtYW5jZS5ub3cpe1xuICAgIHdpbmRvdy5wZXJmb3JtYW5jZSA9IHtcbiAgICAgIHN0YXJ0OiBEYXRlLm5vdygpLFxuICAgICAgbm93OiBmdW5jdGlvbigpeyByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnQ7IH1cbiAgICB9O1xuICB9XG59KSgpO1xuaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKG9UaGlzKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XG4gICAgfVxuXG4gICAgdmFyIGFBcmdzICAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuICAgICAgICBmVG9CaW5kID0gdGhpcyxcbiAgICAgICAgZk5PUCAgICA9IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIGZCb3VuZCAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUFxuICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgOiBvVGhpcyxcbiAgICAgICAgICAgICAgICAgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfTtcblxuICAgIGlmICh0aGlzLnByb3RvdHlwZSkge1xuICAgICAgLy8gbmF0aXZlIGZ1bmN0aW9ucyBkb24ndCBoYXZlIGEgcHJvdG90eXBlXG4gICAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgIH1cbiAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcblxuICAgIHJldHVybiBmQm91bmQ7XG4gIH07XG59XG4vLyBQb2x5ZmlsbCB0byBnZXQgdGhlIG5hbWUgb2YgYSBmdW5jdGlvbiBpbiBJRTlcbmZ1bmN0aW9uIGZ1bmN0aW9uTmFtZShmbikge1xuICBpZiAoRnVuY3Rpb24ucHJvdG90eXBlLm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBmdW5jTmFtZVJlZ2V4ID0gL2Z1bmN0aW9uXFxzKFteKF17MSx9KVxcKC87XG4gICAgdmFyIHJlc3VsdHMgPSAoZnVuY05hbWVSZWdleCkuZXhlYygoZm4pLnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDEpID8gcmVzdWx0c1sxXS50cmltKCkgOiBcIlwiO1xuICB9XG4gIGVsc2UgaWYgKGZuLnByb3RvdHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIGZuLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG59XG5mdW5jdGlvbiBwYXJzZVZhbHVlKHN0cil7XG4gIGlmICgndHJ1ZScgPT09IHN0cikgcmV0dXJuIHRydWU7XG4gIGVsc2UgaWYgKCdmYWxzZScgPT09IHN0cikgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmICghaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XG4gIHJldHVybiBzdHI7XG59XG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE9mZkNhbnZhcyBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ub2ZmY2FudmFzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKi9cblxuY2xhc3MgT2ZmQ2FudmFzIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gb2ZmLWNhbnZhcyB3cmFwcGVyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIE9mZkNhbnZhcyNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBpbml0aWFsaXplLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9mZkNhbnZhcy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gJCgpO1xuICAgIHRoaXMuJHRyaWdnZXJzID0gJCgpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnT2ZmQ2FudmFzJylcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdPZmZDYW52YXMnLCB7XG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xuICAgIH0pO1xuXG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG9mZi1jYW52YXMgd3JhcHBlciBieSBhZGRpbmcgdGhlIGV4aXQgb3ZlcmxheSAoaWYgbmVlZGVkKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoYGlzLXRyYW5zaXRpb24tJHt0aGlzLm9wdGlvbnMudHJhbnNpdGlvbn1gKTtcblxuICAgIC8vIEZpbmQgdHJpZ2dlcnMgdGhhdCBhZmZlY3QgdGhpcyBlbGVtZW50IGFuZCBhZGQgYXJpYS1leHBhbmRlZCB0byB0aGVtXG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKGRvY3VtZW50KVxuICAgICAgLmZpbmQoJ1tkYXRhLW9wZW49XCInK2lkKydcIl0sIFtkYXRhLWNsb3NlPVwiJytpZCsnXCJdLCBbZGF0YS10b2dnbGU9XCInK2lkKydcIl0nKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKVxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCBpZCk7XG5cbiAgICAvLyBBZGQgYW4gb3ZlcmxheSBvdmVyIHRoZSBjb250ZW50IGlmIG5lY2Vzc2FyeVxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPT09IHRydWUpIHtcbiAgICAgIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB2YXIgb3ZlcmxheVBvc2l0aW9uID0gJCh0aGlzLiRlbGVtZW50KS5jc3MoXCJwb3NpdGlvblwiKSA9PT0gJ2ZpeGVkJyA/ICdpcy1vdmVybGF5LWZpeGVkJyA6ICdpcy1vdmVybGF5LWFic29sdXRlJztcbiAgICAgIG92ZXJsYXkuc2V0QXR0cmlidXRlKCdjbGFzcycsICdqcy1vZmYtY2FudmFzLW92ZXJsYXkgJyArIG92ZXJsYXlQb3NpdGlvbik7XG4gICAgICB0aGlzLiRvdmVybGF5ID0gJChvdmVybGF5KTtcbiAgICAgIGlmKG92ZXJsYXlQb3NpdGlvbiA9PT0gJ2lzLW92ZXJsYXktZml4ZWQnKSB7XG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodGhpcy4kb3ZlcmxheSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXBwZW5kKHRoaXMuJG92ZXJsYXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucy5pc1JldmVhbGVkID0gdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgfHwgbmV3IFJlZ0V4cCh0aGlzLm9wdGlvbnMucmV2ZWFsQ2xhc3MsICdnJykudGVzdCh0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5yZXZlYWxPbiA9IHRoaXMub3B0aW9ucy5yZXZlYWxPbiB8fCB0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZS5tYXRjaCgvKHJldmVhbC1mb3ItbWVkaXVtfHJldmVhbC1mb3ItbGFyZ2UpL2cpWzBdLnNwbGl0KCctJylbMl07XG4gICAgICB0aGlzLl9zZXRNUUNoZWNrZXIoKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUgPT09IHRydWUpIHtcbiAgICAgIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9IHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoJCgnW2RhdGEtb2ZmLWNhbnZhc10nKVswXSkudHJhbnNpdGlvbkR1cmF0aW9uKSAqIDEwMDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIG9mZi1jYW52YXMgd3JhcHBlciBhbmQgdGhlIGV4aXQgb3ZlcmxheS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJykub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ2tleWRvd24uemYub2ZmY2FudmFzJzogdGhpcy5faGFuZGxlS2V5Ym9hcmQuYmluZCh0aGlzKVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgPT09IHRydWUpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gdGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID8gdGhpcy4kb3ZlcmxheSA6ICQoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKTtcbiAgICAgICR0YXJnZXQub24oeydjbGljay56Zi5vZmZjYW52YXMnOiB0aGlzLmNsb3NlLmJpbmQodGhpcyl9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBldmVudCBsaXN0ZW5lciBmb3IgZWxlbWVudHMgdGhhdCB3aWxsIHJldmVhbCBhdCBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldE1RQ2hlY2tlcigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xuICAgICAgICBfdGhpcy5yZXZlYWwodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfdGhpcy5yZXZlYWwoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pLm9uZSgnbG9hZC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xuICAgICAgICBfdGhpcy5yZXZlYWwodHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgcmV2ZWFsaW5nL2hpZGluZyB0aGUgb2ZmLWNhbnZhcyBhdCBicmVha3BvaW50cywgbm90IHRoZSBzYW1lIGFzIG9wZW4uXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNSZXZlYWxlZCAtIHRydWUgaWYgZWxlbWVudCBzaG91bGQgYmUgcmV2ZWFsZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgcmV2ZWFsKGlzUmV2ZWFsZWQpIHtcbiAgICB2YXIgJGNsb3NlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJyk7XG4gICAgaWYgKGlzUmV2ZWFsZWQpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IHRydWU7XG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZignb3Blbi56Zi50cmlnZ2VyIHRvZ2dsZS56Zi50cmlnZ2VyJyk7XG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHsgJGNsb3Nlci5oaWRlKCk7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gZmFsc2U7XG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcylcbiAgICAgIH0pO1xuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7XG4gICAgICAgICRjbG9zZXIuc2hvdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBzY3JvbGxpbmcgb2YgdGhlIGJvZHkgd2hlbiBvZmZjYW52YXMgaXMgb3BlbiBvbiBtb2JpbGUgU2FmYXJpIGFuZCBvdGhlciB0cm91Ymxlc29tZSBicm93c2Vycy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zdG9wU2Nyb2xsaW5nKGV2ZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gVGFrZW4gYW5kIGFkYXB0ZWQgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE2ODg5NDQ3L3ByZXZlbnQtZnVsbC1wYWdlLXNjcm9sbGluZy1pb3NcbiAgLy8gT25seSByZWFsbHkgd29ya3MgZm9yIHksIG5vdCBzdXJlIGhvdyB0byBleHRlbmQgdG8geCBvciBpZiB3ZSBuZWVkIHRvLlxuICBfcmVjb3JkU2Nyb2xsYWJsZShldmVudCkge1xuICAgIGxldCBlbGVtID0gdGhpczsgLy8gY2FsbGVkIGZyb20gZXZlbnQgaGFuZGxlciBjb250ZXh0IHdpdGggdGhpcyBhcyBlbGVtXG5cbiAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgc2Nyb2xsYWJsZSAoY29udGVudCBvdmVyZmxvd3MpLCB0aGVuLi4uXG4gICAgaWYgKGVsZW0uc2Nyb2xsSGVpZ2h0ICE9PSBlbGVtLmNsaWVudEhlaWdodCkge1xuICAgICAgLy8gSWYgd2UncmUgYXQgdGhlIHRvcCwgc2Nyb2xsIGRvd24gb25lIHBpeGVsIHRvIGFsbG93IHNjcm9sbGluZyB1cFxuICAgICAgaWYgKGVsZW0uc2Nyb2xsVG9wID09PSAwKSB7XG4gICAgICAgIGVsZW0uc2Nyb2xsVG9wID0gMTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlJ3JlIGF0IHRoZSBib3R0b20sIHNjcm9sbCB1cCBvbmUgcGl4ZWwgdG8gYWxsb3cgc2Nyb2xsaW5nIGRvd25cbiAgICAgIGlmIChlbGVtLnNjcm9sbFRvcCA9PT0gZWxlbS5zY3JvbGxIZWlnaHQgLSBlbGVtLmNsaWVudEhlaWdodCkge1xuICAgICAgICBlbGVtLnNjcm9sbFRvcCA9IGVsZW0uc2Nyb2xsSGVpZ2h0IC0gZWxlbS5jbGllbnRIZWlnaHQgLSAxO1xuICAgICAgfVxuICAgIH1cbiAgICBlbGVtLmFsbG93VXAgPSBlbGVtLnNjcm9sbFRvcCA+IDA7XG4gICAgZWxlbS5hbGxvd0Rvd24gPSBlbGVtLnNjcm9sbFRvcCA8IChlbGVtLnNjcm9sbEhlaWdodCAtIGVsZW0uY2xpZW50SGVpZ2h0KTtcbiAgICBlbGVtLmxhc3RZID0gZXZlbnQub3JpZ2luYWxFdmVudC5wYWdlWTtcbiAgfVxuXG4gIF9zdG9wU2Nyb2xsUHJvcGFnYXRpb24oZXZlbnQpIHtcbiAgICBsZXQgZWxlbSA9IHRoaXM7IC8vIGNhbGxlZCBmcm9tIGV2ZW50IGhhbmRsZXIgY29udGV4dCB3aXRoIHRoaXMgYXMgZWxlbVxuICAgIGxldCB1cCA9IGV2ZW50LnBhZ2VZIDwgZWxlbS5sYXN0WTtcbiAgICBsZXQgZG93biA9ICF1cDtcbiAgICBlbGVtLmxhc3RZID0gZXZlbnQucGFnZVk7XG5cbiAgICBpZigodXAgJiYgZWxlbS5hbGxvd1VwKSB8fCAoZG93biAmJiBlbGVtLmFsbG93RG93bikpIHtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cbiAgICogQGZpcmVzIE9mZkNhbnZhcyNvcGVuZWRcbiAgICovXG4gIG9wZW4oZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gdHJpZ2dlcjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlVG8gPT09ICd0b3AnKSB7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VUbyA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIHdpbmRvdy5zY3JvbGxUbygwLGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXG4gICAgICogQGV2ZW50IE9mZkNhbnZhcyNvcGVuZWRcbiAgICAgKi9cbiAgICBfdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtb3BlbicpXG5cbiAgICB0aGlzLiR0cmlnZ2Vycy5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJylcbiAgICAgICAgLnRyaWdnZXIoJ29wZW5lZC56Zi5vZmZjYW52YXMnKTtcblxuICAgIC8vIElmIGBjb250ZW50U2Nyb2xsYCBpcyBzZXQgdG8gZmFsc2UsIGFkZCBjbGFzcyBhbmQgZGlzYWJsZSBzY3JvbGxpbmcgb24gdG91Y2ggZGV2aWNlcy5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRTY3JvbGwgPT09IGZhbHNlKSB7XG4gICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2lzLW9mZi1jYW52YXMtb3BlbicpLm9uKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsaW5nKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3RvdWNoc3RhcnQnLCB0aGlzLl9yZWNvcmRTY3JvbGxhYmxlKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3RvdWNobW92ZScsIHRoaXMuX3N0b3BTY3JvbGxQcm9wYWdhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5hZGRDbGFzcygnaXMtdmlzaWJsZScpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrID09PSB0cnVlICYmIHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5hZGRDbGFzcygnaXMtY2xvc2FibGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9Gb2N1cyA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKHRoaXMuJGVsZW1lbnQpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQuZmluZCgnYSwgYnV0dG9uJykuZXEoMCkuZm9jdXMoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQudHJhcEZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2IgdG8gZmlyZSBhZnRlciBjbG9zdXJlLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgKi9cbiAgY2xvc2UoY2IpIHtcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgICAqIEBldmVudCBPZmZDYW52YXMjY2xvc2VkXG4gICAgICAgKi9cbiAgICAgICAgLnRyaWdnZXIoJ2Nsb3NlZC56Zi5vZmZjYW52YXMnKTtcblxuICAgIC8vIElmIGBjb250ZW50U2Nyb2xsYCBpcyBzZXQgdG8gZmFsc2UsIHJlbW92ZSBjbGFzcyBhbmQgcmUtZW5hYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnaXMtb2ZmLWNhbnZhcy1vcGVuJykub2ZmKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsaW5nKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b3VjaHN0YXJ0JywgdGhpcy5fcmVjb3JkU2Nyb2xsYWJsZSk7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbFByb3BhZ2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgPT09IHRydWUgJiYgdGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZUNsYXNzKCdpcy1jbG9zYWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVsZWFzZUZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbiBvciBjbG9zZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKi9cbiAgdG9nZ2xlKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgdGhpcy5jbG9zZShldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBpbnB1dCB3aGVuIGRldGVjdGVkLiBXaGVuIHRoZSBlc2NhcGUga2V5IGlzIHByZXNzZWQsIHRoZSBvZmYtY2FudmFzIG1lbnUgY2xvc2VzLCBhbmQgZm9jdXMgaXMgcmVzdG9yZWQgdG8gdGhlIGVsZW1lbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hhbmRsZUtleWJvYXJkKGUpIHtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnT2ZmQ2FudmFzJywge1xuICAgICAgY2xvc2U6ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBoYW5kbGVkOiAoKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgb2ZmY2FudmFzIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpO1xuICAgIHRoaXMuJG92ZXJsYXkub2ZmKCcuemYub2ZmY2FudmFzJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuT2ZmQ2FudmFzLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQWxsb3cgdGhlIHVzZXIgdG8gY2xpY2sgb3V0c2lkZSBvZiB0aGUgbWVudSB0byBjbG9zZSBpdC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIG92ZXJsYXkgb24gdG9wIG9mIGBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdYC5cbiAgICogQG9wdGlvblxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgY29udGVudE92ZXJsYXk6IHRydWUsXG5cbiAgLyoqXG4gICAqIEVuYWJsZS9kaXNhYmxlIHNjcm9sbGluZyBvZiB0aGUgbWFpbiBjb250ZW50IHdoZW4gYW4gb2ZmIGNhbnZhcyBwYW5lbCBpcyBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICBjb250ZW50U2Nyb2xsOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSBpbiBtcyB0aGUgb3BlbiBhbmQgY2xvc2UgdHJhbnNpdGlvbiByZXF1aXJlcy4gSWYgbm9uZSBzZWxlY3RlZCwgcHVsbHMgZnJvbSBib2R5IHN0eWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqIEBkZWZhdWx0IDBcbiAgICovXG4gIHRyYW5zaXRpb25UaW1lOiAwLFxuXG4gIC8qKlxuICAgKiBUeXBlIG9mIHRyYW5zaXRpb24gZm9yIHRoZSBvZmZjYW52YXMgbWVudS4gT3B0aW9ucyBhcmUgJ3B1c2gnLCAnZGV0YWNoZWQnIG9yICdzbGlkZScuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgcHVzaFxuICAgKi9cbiAgdHJhbnNpdGlvbjogJ3B1c2gnLFxuXG4gIC8qKlxuICAgKiBGb3JjZSB0aGUgcGFnZSB0byBzY3JvbGwgdG8gdG9wIG9yIGJvdHRvbSBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICBmb3JjZVRvOiBudWxsLFxuXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuIGZvciBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgaXNSZXZlYWxlZDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIHdpdGggdGhlIGByZXZlYWxDbGFzc2Agb3B0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgKiBAZGVmYXVsdCBudWxsXG4gICAqL1xuICByZXZlYWxPbjogbnVsbCxcblxuICAvKipcbiAgICogRm9yY2UgZm9jdXMgdG8gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLiBJZiB0cnVlLCB3aWxsIGZvY3VzIHRoZSBvcGVuaW5nIHRyaWdnZXIgb24gY2xvc2UuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIGF1dG9Gb2N1czogdHJ1ZSxcblxuICAvKipcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICogQGRlZmF1bHQgcmV2ZWFsLWZvci1cbiAgICogQHRvZG8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cbiAgICovXG4gIHJldmVhbENsYXNzOiAncmV2ZWFsLWZvci0nLFxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyBvcHRpb25hbCBmb2N1cyB0cmFwcGluZyB3aGVuIG9wZW5pbmcgYW4gb2ZmY2FudmFzLiBTZXRzIHRhYmluZGV4IG9mIFtkYXRhLW9mZi1jYW52YXMtY29udGVudF0gdG8gLTEgZm9yIGFjY2Vzc2liaWxpdHkgcHVycG9zZXMuXG4gICAqIEBvcHRpb25cbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihPZmZDYW52YXMsICdPZmZDYW52YXMnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5Gb3VuZGF0aW9uLkJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcbiAgR2V0T2Zmc2V0czogR2V0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0O1xuXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoICsgcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgKyBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0KTtcbiAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKTtcbiAgfVxuXG4gIHZhciBhbGxEaXJzID0gW2JvdHRvbSwgdG9wLCBsZWZ0LCByaWdodF07XG5cbiAgaWYgKGxyT25seSkge1xuICAgIHJldHVybiBsZWZ0ID09PSByaWdodCA9PT0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0Yk9ubHkpIHtcbiAgICByZXR1cm4gdG9wID09PSBib3R0b20gPT09IHRydWU7XG4gIH1cblxuICByZXR1cm4gYWxsRGlycy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XG59O1xuXG4vKipcbiAqIFVzZXMgbmF0aXZlIG1ldGhvZHMgdG8gcmV0dXJuIGFuIG9iamVjdCBvZiBkaW1lbnNpb24gdmFsdWVzLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeSB8fCBIVE1MfSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBvciBET00gZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBkaW1lbnNpb25zLiBDYW4gYmUgYW55IGVsZW1lbnQgb3RoZXIgdGhhdCBkb2N1bWVudCBvciB3aW5kb3cuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG5lc3RlZCBvYmplY3Qgb2YgaW50ZWdlciBwaXhlbCB2YWx1ZXNcbiAqIFRPRE8gLSBpZiBlbGVtZW50IGlzIHdpbmRvdywgcmV0dXJuIG9ubHkgdGhvc2UgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBHZXREaW1lbnNpb25zKGVsZW0sIHRlc3Qpe1xuICBlbGVtID0gZWxlbS5sZW5ndGggPyBlbGVtWzBdIDogZWxlbTtcblxuICBpZiAoZWxlbSA9PT0gd2luZG93IHx8IGVsZW0gPT09IGRvY3VtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSSdtIHNvcnJ5LCBEYXZlLiBJJ20gYWZyYWlkIEkgY2FuJ3QgZG8gdGhhdC5cIik7XG4gIH1cblxuICB2YXIgcmVjdCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICBwYXJSZWN0ID0gZWxlbS5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgd2luUmVjdCA9IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5ZID0gd2luZG93LnBhZ2VZT2Zmc2V0LFxuICAgICAgd2luWCA9IHdpbmRvdy5wYWdlWE9mZnNldDtcblxuICByZXR1cm4ge1xuICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXG4gICAgb2Zmc2V0OiB7XG4gICAgICB0b3A6IHJlY3QudG9wICsgd2luWSxcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHdpblhcbiAgICB9LFxuICAgIHBhcmVudERpbXM6IHtcbiAgICAgIHdpZHRoOiBwYXJSZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiBwYXJSZWN0LmhlaWdodCxcbiAgICAgIG9mZnNldDoge1xuICAgICAgICB0b3A6IHBhclJlY3QudG9wICsgd2luWSxcbiAgICAgICAgbGVmdDogcGFyUmVjdC5sZWZ0ICsgd2luWFxuICAgICAgfVxuICAgIH0sXG4gICAgd2luZG93RGltczoge1xuICAgICAgd2lkdGg6IHdpblJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHdpblJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogd2luWSxcbiAgICAgICAgbGVmdDogd2luWFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gb2JqZWN0IG9mIHRvcCBhbmQgbGVmdCBpbnRlZ2VyIHBpeGVsIHZhbHVlcyBmb3IgZHluYW1pY2FsbHkgcmVuZGVyZWQgZWxlbWVudHMsXG4gKiBzdWNoIGFzOiBUb29sdGlwLCBSZXZlYWwsIGFuZCBEcm9wZG93blxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHBvc2l0aW9uZWQuXG4gKiBAcGFyYW0ge2pRdWVyeX0gYW5jaG9yIC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQncyBhbmNob3IgcG9pbnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gcG9zaXRpb24gLSBhIHN0cmluZyByZWxhdGluZyB0byB0aGUgZGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCwgcmVsYXRpdmUgdG8gaXQncyBhbmNob3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB2T2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIHZlcnRpY2FsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0gaE9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCBob3Jpem9udGFsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzT3ZlcmZsb3cgLSBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZCwgc2V0cyB0byB0cnVlIHRvIGRlZmF1bHQgdGhlIGVsZW1lbnQgdG8gZnVsbCB3aWR0aCAtIGFueSBkZXNpcmVkIG9mZnNldC5cbiAqIFRPRE8gYWx0ZXIvcmV3cml0ZSB0byB3b3JrIHdpdGggYGVtYCB2YWx1ZXMgYXMgd2VsbC9pbnN0ZWFkIG9mIHBpeGVsc1xuICovXG5mdW5jdGlvbiBHZXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgcG9zaXRpb24sIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpIHtcbiAgdmFyICRlbGVEaW1zID0gR2V0RGltZW5zaW9ucyhlbGVtZW50KSxcbiAgICAgICRhbmNob3JEaW1zID0gYW5jaG9yID8gR2V0RGltZW5zaW9ucyhhbmNob3IpIDogbnVsbDtcblxuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgY2FzZSAndG9wJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgdG9wJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICgkYW5jaG9yRGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogaXNPdmVyZmxvdyA/IGhPZmZzZXQgOiAoKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMikpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIHJpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0ICsgMSxcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCArICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArICgkZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmV2ZWFsJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC0gJGVsZURpbXMud2lkdGgpIC8gMixcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyB2T2Zmc2V0XG4gICAgICB9XG4gICAgY2FzZSAncmV2ZWFsIGZ1bGwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCxcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmlnaHQgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0IC0gJGVsZURpbXMud2lkdGgsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gIH1cbn1cblxufShqUXVlcnkpO1xuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIHV0aWwgd2FzIGNyZWF0ZWQgYnkgTWFyaXVzIE9sYmVydHogKlxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcbiAqIG9yIHRoZSB3ZWIgaHR0cDovL3d3dy5tYXJpdXNvbGJlcnR6LmRlLyAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBrZXlDb2RlcyA9IHtcbiAgOTogJ1RBQicsXG4gIDEzOiAnRU5URVInLFxuICAyNzogJ0VTQ0FQRScsXG4gIDMyOiAnU1BBQ0UnLFxuICAzNzogJ0FSUk9XX0xFRlQnLFxuICAzODogJ0FSUk9XX1VQJyxcbiAgMzk6ICdBUlJPV19SSUdIVCcsXG4gIDQwOiAnQVJST1dfRE9XTidcbn1cblxudmFyIGNvbW1hbmRzID0ge31cblxudmFyIEtleWJvYXJkID0ge1xuICBrZXlzOiBnZXRLZXlDb2RlcyhrZXlDb2RlcyksXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgKGtleWJvYXJkKSBldmVudCBhbmQgcmV0dXJucyBhIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgaXRzIGtleVxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEByZXR1cm4gU3RyaW5nIGtleSAtIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgdGhlIGtleSBwcmVzc2VkXG4gICAqL1xuICBwYXJzZUtleShldmVudCkge1xuICAgIHZhciBrZXkgPSBrZXlDb2Rlc1tldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b1VwcGVyQ2FzZSgpO1xuXG4gICAgLy8gUmVtb3ZlIHVuLXByaW50YWJsZSBjaGFyYWN0ZXJzLCBlLmcuIGZvciBgZnJvbUNoYXJDb2RlYCBjYWxscyBmb3IgQ1RSTCBvbmx5IGV2ZW50c1xuICAgIGtleSA9IGtleS5yZXBsYWNlKC9cXFcrLywgJycpO1xuXG4gICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSBrZXkgPSBgU0hJRlRfJHtrZXl9YDtcbiAgICBpZiAoZXZlbnQuY3RybEtleSkga2V5ID0gYENUUkxfJHtrZXl9YDtcbiAgICBpZiAoZXZlbnQuYWx0S2V5KSBrZXkgPSBgQUxUXyR7a2V5fWA7XG5cbiAgICAvLyBSZW1vdmUgdHJhaWxpbmcgdW5kZXJzY29yZSwgaW4gY2FzZSBvbmx5IG1vZGlmaWVycyB3ZXJlIHVzZWQgKGUuZy4gb25seSBgQ1RSTF9BTFRgKVxuICAgIGtleSA9IGtleS5yZXBsYWNlKC9fJC8sICcnKTtcblxuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXG4gICAqL1xuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcbiAgICAgIGtleUNvZGUgPSB0aGlzLnBhcnNlS2V5KGV2ZW50KSxcbiAgICAgIGNtZHMsXG4gICAgICBjb21tYW5kLFxuICAgICAgZm47XG5cbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcbiAgICB9IGVsc2UgeyAvLyBtZXJnZSBsdHIgYW5kIHJ0bDogaWYgZG9jdW1lbnQgaXMgcnRsLCBydGwgb3ZlcndyaXRlcyBsdHIgYW5kIHZpY2UgdmVyc2FcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xuXG4gICAgICAgIGVsc2UgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5ydGwsIGNvbW1hbmRMaXN0Lmx0cik7XG4gICAgfVxuICAgIGNvbW1hbmQgPSBjbWRzW2tleUNvZGVdO1xuXG4gICAgZm4gPSBmdW5jdGlvbnNbY29tbWFuZF07XG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uICBpZiBleGlzdHNcbiAgICAgIHZhciByZXR1cm5WYWx1ZSA9IGZuLmFwcGx5KCk7XG4gICAgICBpZiAoZnVuY3Rpb25zLmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy5oYW5kbGVkKHJldHVyblZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZ1bmN0aW9ucy51bmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy51bmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBub3QgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy51bmhhbmRsZWQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpbmRzIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIHRoZSBnaXZlbiBgJGVsZW1lbnRgXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gc2VhcmNoIHdpdGhpblxuICAgKiBAcmV0dXJuIHtqUXVlcnl9ICRmb2N1c2FibGUgLSBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiBgJGVsZW1lbnRgXG4gICAqL1xuICBmaW5kRm9jdXNhYmxlKCRlbGVtZW50KSB7XG4gICAgaWYoISRlbGVtZW50KSB7cmV0dXJuIGZhbHNlOyB9XG4gICAgcmV0dXJuICRlbGVtZW50LmZpbmQoJ2FbaHJlZl0sIGFyZWFbaHJlZl0sIGlucHV0Om5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSwgdGV4dGFyZWE6bm90KFtkaXNhYmxlZF0pLCBidXR0b246bm90KFtkaXNhYmxlZF0pLCBpZnJhbWUsIG9iamVjdCwgZW1iZWQsICpbdGFiaW5kZXhdLCAqW2NvbnRlbnRlZGl0YWJsZV0nKS5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISQodGhpcykuaXMoJzp2aXNpYmxlJykgfHwgJCh0aGlzKS5hdHRyKCd0YWJpbmRleCcpIDwgMCkgeyByZXR1cm4gZmFsc2U7IH0gLy9vbmx5IGhhdmUgdmlzaWJsZSBlbGVtZW50cyBhbmQgdGhvc2UgdGhhdCBoYXZlIGEgdGFiaW5kZXggZ3JlYXRlciBvciBlcXVhbCAwXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IG5hbWUgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcmV0dXJuIFN0cmluZyBjb21wb25lbnROYW1lXG4gICAqL1xuXG4gIHJlZ2lzdGVyKGNvbXBvbmVudE5hbWUsIGNtZHMpIHtcbiAgICBjb21tYW5kc1tjb21wb25lbnROYW1lXSA9IGNtZHM7XG4gIH0sICBcblxuICAvKipcbiAgICogVHJhcHMgdGhlIGZvY3VzIGluIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgKiBAcGFyYW0gIHtqUXVlcnl9ICRlbGVtZW50ICBqUXVlcnkgb2JqZWN0IHRvIHRyYXAgdGhlIGZvdWNzIGludG8uXG4gICAqL1xuICB0cmFwRm9jdXMoJGVsZW1lbnQpIHtcbiAgICB2YXIgJGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSgkZWxlbWVudCksXG4gICAgICAgICRmaXJzdEZvY3VzYWJsZSA9ICRmb2N1c2FibGUuZXEoMCksXG4gICAgICAgICRsYXN0Rm9jdXNhYmxlID0gJGZvY3VzYWJsZS5lcSgtMSk7XG5cbiAgICAkZWxlbWVudC5vbigna2V5ZG93bi56Zi50cmFwZm9jdXMnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gJGxhc3RGb2N1c2FibGVbMF0gJiYgRm91bmRhdGlvbi5LZXlib2FyZC5wYXJzZUtleShldmVudCkgPT09ICdUQUInKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICRmaXJzdEZvY3VzYWJsZS5mb2N1cygpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZXZlbnQudGFyZ2V0ID09PSAkZmlyc3RGb2N1c2FibGVbMF0gJiYgRm91bmRhdGlvbi5LZXlib2FyZC5wYXJzZUtleShldmVudCkgPT09ICdTSElGVF9UQUInKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICRsYXN0Rm9jdXNhYmxlLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIC8qKlxuICAgKiBSZWxlYXNlcyB0aGUgdHJhcHBlZCBmb2N1cyBmcm9tIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgKiBAcGFyYW0gIHtqUXVlcnl9ICRlbGVtZW50ICBqUXVlcnkgb2JqZWN0IHRvIHJlbGVhc2UgdGhlIGZvY3VzIGZvci5cbiAgICovXG4gIHJlbGVhc2VGb2N1cygkZWxlbWVudCkge1xuICAgICRlbGVtZW50Lm9mZigna2V5ZG93bi56Zi50cmFwZm9jdXMnKTtcbiAgfVxufVxuXG4vKlxuICogQ29uc3RhbnRzIGZvciBlYXNpZXIgY29tcGFyaW5nLlxuICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gKi9cbmZ1bmN0aW9uIGdldEtleUNvZGVzKGtjcykge1xuICB2YXIgayA9IHt9O1xuICBmb3IgKHZhciBrYyBpbiBrY3MpIGtba2NzW2tjXV0gPSBrY3Nba2NdO1xuICByZXR1cm4gaztcbn1cblxuRm91bmRhdGlvbi5LZXlib2FyZCA9IEtleWJvYXJkO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8vIERlZmF1bHQgc2V0IG9mIG1lZGlhIHF1ZXJpZXNcbmNvbnN0IGRlZmF1bHRRdWVyaWVzID0ge1xuICAnZGVmYXVsdCcgOiAnb25seSBzY3JlZW4nLFxuICBsYW5kc2NhcGUgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogbGFuZHNjYXBlKScsXG4gIHBvcnRyYWl0IDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXG4gIHJldGluYSA6ICdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknXG59O1xuXG52YXIgTWVkaWFRdWVyeSA9IHtcbiAgcXVlcmllczogW10sXG5cbiAgY3VycmVudDogJycsXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBtZWRpYSBxdWVyeSBoZWxwZXIsIGJ5IGV4dHJhY3RpbmcgdGhlIGJyZWFrcG9pbnQgbGlzdCBmcm9tIHRoZSBDU1MgYW5kIGFjdGl2YXRpbmcgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGV4dHJhY3RlZFN0eWxlcyA9ICQoJy5mb3VuZGF0aW9uLW1xJykuY3NzKCdmb250LWZhbWlseScpO1xuICAgIHZhciBuYW1lZFF1ZXJpZXM7XG5cbiAgICBuYW1lZFF1ZXJpZXMgPSBwYXJzZVN0eWxlVG9PYmplY3QoZXh0cmFjdGVkU3R5bGVzKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBuYW1lZFF1ZXJpZXMpIHtcbiAgICAgIGlmKG5hbWVkUXVlcmllcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHNlbGYucXVlcmllcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBrZXksXG4gICAgICAgICAgdmFsdWU6IGBvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogJHtuYW1lZFF1ZXJpZXNba2V5XX0pYFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xuXG4gICAgdGhpcy5fd2F0Y2hlcigpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHNjcmVlbiBpcyBhdCBsZWFzdCBhcyB3aWRlIGFzIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgYnJlYWtwb2ludCBtYXRjaGVzLCBgZmFsc2VgIGlmIGl0J3Mgc21hbGxlci5cbiAgICovXG4gIGF0TGVhc3Qoc2l6ZSkge1xuICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0KHNpemUpO1xuXG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHNjcmVlbiBtYXRjaGVzIHRvIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBjaGVjaywgZWl0aGVyICdzbWFsbCBvbmx5JyBvciAnc21hbGwnLiBPbWl0dGluZyAnb25seScgZmFsbHMgYmFjayB0byB1c2luZyBhdExlYXN0KCkgbWV0aG9kLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQgZG9lcyBub3QuXG4gICAqL1xuICBpcyhzaXplKSB7XG4gICAgc2l6ZSA9IHNpemUudHJpbSgpLnNwbGl0KCcgJyk7XG4gICAgaWYoc2l6ZS5sZW5ndGggPiAxICYmIHNpemVbMV0gPT09ICdvbmx5Jykge1xuICAgICAgaWYoc2l6ZVswXSA9PT0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKSkgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmF0TGVhc3Qoc2l6ZVswXSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVkaWEgcXVlcnkgb2YgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGdldC5cbiAgICogQHJldHVybnMge1N0cmluZ3xudWxsfSAtIFRoZSBtZWRpYSBxdWVyeSBvZiB0aGUgYnJlYWtwb2ludCwgb3IgYG51bGxgIGlmIHRoZSBicmVha3BvaW50IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBnZXQoc2l6ZSkge1xuICAgIGZvciAodmFyIGkgaW4gdGhpcy5xdWVyaWVzKSB7XG4gICAgICBpZih0aGlzLnF1ZXJpZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuICAgICAgICBpZiAoc2l6ZSA9PT0gcXVlcnkubmFtZSkgcmV0dXJuIHF1ZXJ5LnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgbmFtZSBieSB0ZXN0aW5nIGV2ZXJ5IGJyZWFrcG9pbnQgYW5kIHJldHVybmluZyB0aGUgbGFzdCBvbmUgdG8gbWF0Y2ggKHRoZSBiaWdnZXN0IG9uZSkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBOYW1lIG9mIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQuXG4gICAqL1xuICBfZ2V0Q3VycmVudFNpemUoKSB7XG4gICAgdmFyIG1hdGNoZWQ7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuXG4gICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocXVlcnkudmFsdWUpLm1hdGNoZXMpIHtcbiAgICAgICAgbWF0Y2hlZCA9IHF1ZXJ5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWF0Y2hlZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQWN0aXZhdGVzIHRoZSBicmVha3BvaW50IHdhdGNoZXIsIHdoaWNoIGZpcmVzIGFuIGV2ZW50IG9uIHRoZSB3aW5kb3cgd2hlbmV2ZXIgdGhlIGJyZWFrcG9pbnQgY2hhbmdlcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfd2F0Y2hlcigpIHtcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5tZWRpYXF1ZXJ5JywgKCkgPT4ge1xuICAgICAgdmFyIG5ld1NpemUgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpLCBjdXJyZW50U2l6ZSA9IHRoaXMuY3VycmVudDtcblxuICAgICAgaWYgKG5ld1NpemUgIT09IGN1cnJlbnRTaXplKSB7XG4gICAgICAgIC8vIENoYW5nZSB0aGUgY3VycmVudCBtZWRpYSBxdWVyeVxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdTaXplO1xuXG4gICAgICAgIC8vIEJyb2FkY2FzdCB0aGUgbWVkaWEgcXVlcnkgY2hhbmdlIG9uIHRoZSB3aW5kb3dcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIFtuZXdTaXplLCBjdXJyZW50U2l6ZV0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG4vLyBtYXRjaE1lZGlhKCkgcG9seWZpbGwgLSBUZXN0IGEgQ1NTIG1lZGlhIHR5cGUvcXVlcnkgaW4gSlMuXG4vLyBBdXRob3JzICYgY29weXJpZ2h0IChjKSAyMDEyOiBTY290dCBKZWhsLCBQYXVsIElyaXNoLCBOaWNob2xhcyBaYWthcywgRGF2aWQgS25pZ2h0LiBEdWFsIE1JVC9CU0QgbGljZW5zZVxud2luZG93Lm1hdGNoTWVkaWEgfHwgKHdpbmRvdy5tYXRjaE1lZGlhID0gZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGb3IgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IG1hdGNoTWVkaXVtIGFwaSBzdWNoIGFzIElFIDkgYW5kIHdlYmtpdFxuICB2YXIgc3R5bGVNZWRpYSA9ICh3aW5kb3cuc3R5bGVNZWRpYSB8fCB3aW5kb3cubWVkaWEpO1xuXG4gIC8vIEZvciB0aG9zZSB0aGF0IGRvbid0IHN1cHBvcnQgbWF0Y2hNZWRpdW1cbiAgaWYgKCFzdHlsZU1lZGlhKSB7XG4gICAgdmFyIHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxuICAgIHNjcmlwdCAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdLFxuICAgIGluZm8gICAgICAgID0gbnVsbDtcblxuICAgIHN0eWxlLnR5cGUgID0gJ3RleHQvY3NzJztcbiAgICBzdHlsZS5pZCAgICA9ICdtYXRjaG1lZGlhanMtdGVzdCc7XG5cbiAgICBzY3JpcHQgJiYgc2NyaXB0LnBhcmVudE5vZGUgJiYgc2NyaXB0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHN0eWxlLCBzY3JpcHQpO1xuXG4gICAgLy8gJ3N0eWxlLmN1cnJlbnRTdHlsZScgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnd2luZG93LmdldENvbXB1dGVkU3R5bGUnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICBpbmZvID0gKCdnZXRDb21wdXRlZFN0eWxlJyBpbiB3aW5kb3cpICYmIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHN0eWxlLCBudWxsKSB8fCBzdHlsZS5jdXJyZW50U3R5bGU7XG5cbiAgICBzdHlsZU1lZGlhID0ge1xuICAgICAgbWF0Y2hNZWRpdW0obWVkaWEpIHtcbiAgICAgICAgdmFyIHRleHQgPSBgQG1lZGlhICR7bWVkaWF9eyAjbWF0Y2htZWRpYWpzLXRlc3QgeyB3aWR0aDogMXB4OyB9IH1gO1xuXG4gICAgICAgIC8vICdzdHlsZS5zdHlsZVNoZWV0JyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICdzdHlsZS50ZXh0Q29udGVudCcgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVzdCBpZiBtZWRpYSBxdWVyeSBpcyB0cnVlIG9yIGZhbHNlXG4gICAgICAgIHJldHVybiBpbmZvLndpZHRoID09PSAnMXB4JztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24obWVkaWEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hlczogc3R5bGVNZWRpYS5tYXRjaE1lZGl1bShtZWRpYSB8fCAnYWxsJyksXG4gICAgICBtZWRpYTogbWVkaWEgfHwgJ2FsbCdcbiAgICB9O1xuICB9XG59KCkpO1xuXG4vLyBUaGFuayB5b3U6IGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvcXVlcnktc3RyaW5nXG5mdW5jdGlvbiBwYXJzZVN0eWxlVG9PYmplY3Qoc3RyKSB7XG4gIHZhciBzdHlsZU9iamVjdCA9IHt9O1xuXG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0ciA9IHN0ci50cmltKCkuc2xpY2UoMSwgLTEpOyAvLyBicm93c2VycyByZS1xdW90ZSBzdHJpbmcgc3R5bGUgdmFsdWVzXG5cbiAgaWYgKCFzdHIpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHlsZU9iamVjdCA9IHN0ci5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbihyZXQsIHBhcmFtKSB7XG4gICAgdmFyIHBhcnRzID0gcGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJykuc3BsaXQoJz0nKTtcbiAgICB2YXIga2V5ID0gcGFydHNbMF07XG4gICAgdmFyIHZhbCA9IHBhcnRzWzFdO1xuICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpO1xuXG4gICAgLy8gbWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcbiAgICAvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXG4gICAgdmFsID0gdmFsID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlVVJJQ29tcG9uZW50KHZhbCk7XG5cbiAgICBpZiAoIXJldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXRba2V5XSA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmV0W2tleV0pKSB7XG4gICAgICByZXRba2V5XS5wdXNoKHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFtrZXldID0gW3JldFtrZXldLCB2YWxdO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIHN0eWxlT2JqZWN0O1xufVxuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogTW90aW9uIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tb3Rpb25cbiAqL1xuXG5jb25zdCBpbml0Q2xhc3NlcyAgID0gWydtdWktZW50ZXInLCAnbXVpLWxlYXZlJ107XG5jb25zdCBhY3RpdmVDbGFzc2VzID0gWydtdWktZW50ZXItYWN0aXZlJywgJ211aS1sZWF2ZS1hY3RpdmUnXTtcblxuY29uc3QgTW90aW9uID0ge1xuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKHRydWUsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9LFxuXG4gIGFuaW1hdGVPdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBNb3ZlKGR1cmF0aW9uLCBlbGVtLCBmbil7XG4gIHZhciBhbmltLCBwcm9nLCBzdGFydCA9IG51bGw7XG4gIC8vIGNvbnNvbGUubG9nKCdjYWxsZWQnKTtcblxuICBpZiAoZHVyYXRpb24gPT09IDApIHtcbiAgICBmbi5hcHBseShlbGVtKTtcbiAgICBlbGVtLnRyaWdnZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pLnRyaWdnZXJIYW5kbGVyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlKHRzKXtcbiAgICBpZighc3RhcnQpIHN0YXJ0ID0gdHM7XG4gICAgLy8gY29uc29sZS5sb2coc3RhcnQsIHRzKTtcbiAgICBwcm9nID0gdHMgLSBzdGFydDtcbiAgICBmbi5hcHBseShlbGVtKTtcblxuICAgIGlmKHByb2cgPCBkdXJhdGlvbil7IGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUsIGVsZW0pOyB9XG4gICAgZWxzZXtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShhbmltKTtcbiAgICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xuICAgIH1cbiAgfVxuICBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlKTtcbn1cblxuLyoqXG4gKiBBbmltYXRlcyBhbiBlbGVtZW50IGluIG9yIG91dCB1c2luZyBhIENTUyB0cmFuc2l0aW9uIGNsYXNzLlxuICogQGZ1bmN0aW9uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtCb29sZWFufSBpc0luIC0gRGVmaW5lcyBpZiB0aGUgYW5pbWF0aW9uIGlzIGluIG9yIG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9yIEhUTUwgb2JqZWN0IHRvIGFuaW1hdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gYW5pbWF0aW9uIC0gQ1NTIGNsYXNzIHRvIHVzZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQ2FsbGJhY2sgdG8gcnVuIHdoZW4gYW5pbWF0aW9uIGlzIGZpbmlzaGVkLlxuICovXG5mdW5jdGlvbiBhbmltYXRlKGlzSW4sIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgZWxlbWVudCA9ICQoZWxlbWVudCkuZXEoMCk7XG5cbiAgaWYgKCFlbGVtZW50Lmxlbmd0aCkgcmV0dXJuO1xuXG4gIHZhciBpbml0Q2xhc3MgPSBpc0luID8gaW5pdENsYXNzZXNbMF0gOiBpbml0Q2xhc3Nlc1sxXTtcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xuXG4gIC8vIFNldCB1cCB0aGUgYW5pbWF0aW9uXG4gIHJlc2V0KCk7XG5cbiAgZWxlbWVudFxuICAgIC5hZGRDbGFzcyhhbmltYXRpb24pXG4gICAgLmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50LmFkZENsYXNzKGluaXRDbGFzcyk7XG4gICAgaWYgKGlzSW4pIGVsZW1lbnQuc2hvdygpO1xuICB9KTtcblxuICAvLyBTdGFydCB0aGUgYW5pbWF0aW9uXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudFswXS5vZmZzZXRXaWR0aDtcbiAgICBlbGVtZW50XG4gICAgICAuY3NzKCd0cmFuc2l0aW9uJywgJycpXG4gICAgICAuYWRkQ2xhc3MoYWN0aXZlQ2xhc3MpO1xuICB9KTtcblxuICAvLyBDbGVhbiB1cCB0aGUgYW5pbWF0aW9uIHdoZW4gaXQgZmluaXNoZXNcbiAgZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKGVsZW1lbnQpLCBmaW5pc2gpO1xuXG4gIC8vIEhpZGVzIHRoZSBlbGVtZW50IChmb3Igb3V0IGFuaW1hdGlvbnMpLCByZXNldHMgdGhlIGVsZW1lbnQsIGFuZCBydW5zIGEgY2FsbGJhY2tcbiAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgIGlmICghaXNJbikgZWxlbWVudC5oaWRlKCk7XG4gICAgcmVzZXQoKTtcbiAgICBpZiAoY2IpIGNiLmFwcGx5KGVsZW1lbnQpO1xuICB9XG5cbiAgLy8gUmVzZXRzIHRyYW5zaXRpb25zIGFuZCByZW1vdmVzIG1vdGlvbi1zcGVjaWZpYyBjbGFzc2VzXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGVsZW1lbnRbMF0uc3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uID0gMDtcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKGAke2luaXRDbGFzc30gJHthY3RpdmVDbGFzc30gJHthbmltYXRpb259YCk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5Nb3ZlID0gTW92ZTtcbkZvdW5kYXRpb24uTW90aW9uID0gTW90aW9uO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE5lc3QgPSB7XG4gIEZlYXRoZXIobWVudSwgdHlwZSA9ICd6ZicpIHtcbiAgICBtZW51LmF0dHIoJ3JvbGUnLCAnbWVudWJhcicpO1xuXG4gICAgdmFyIGl0ZW1zID0gbWVudS5maW5kKCdsaScpLmF0dHIoeydyb2xlJzogJ21lbnVpdGVtJ30pLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBpdGVtcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG5cbiAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xuICAgICAgICAkaXRlbVxuICAgICAgICAgIC5hZGRDbGFzcyhoYXNTdWJDbGFzcylcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICAgICAnYXJpYS1sYWJlbCc6ICRpdGVtLmNoaWxkcmVuKCdhOmZpcnN0JykudGV4dCgpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLy8gTm90ZTogIERyaWxsZG93bnMgYmVoYXZlIGRpZmZlcmVudGx5IGluIGhvdyB0aGV5IGhpZGUsIGFuZCBzbyBuZWVkXG4gICAgICAgICAgLy8gYWRkaXRpb25hbCBhdHRyaWJ1dGVzLiAgV2Ugc2hvdWxkIGxvb2sgaWYgdGhpcyBwb3NzaWJseSBvdmVyLWdlbmVyYWxpemVkXG4gICAgICAgICAgLy8gdXRpbGl0eSAoTmVzdCkgaXMgYXBwcm9wcmlhdGUgd2hlbiB3ZSByZXdvcmsgbWVudXMgaW4gNi40XG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2RyaWxsZG93bicpIHtcbiAgICAgICAgICAgICRpdGVtLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogZmFsc2V9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgJHN1YlxuICAgICAgICAgIC5hZGRDbGFzcyhgc3VibWVudSAke3N1Yk1lbnVDbGFzc31gKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdkYXRhLXN1Ym1lbnUnOiAnJyxcbiAgICAgICAgICAgICdyb2xlJzogJ21lbnUnXG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmKHR5cGUgPT09ICdkcmlsbGRvd24nKSB7XG4gICAgICAgICAgJHN1Yi5hdHRyKHsnYXJpYS1oaWRkZW4nOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoYGlzLXN1Ym1lbnUtaXRlbSAke3N1Ykl0ZW1DbGFzc31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybjtcbiAgfSxcblxuICBCdXJuKG1lbnUsIHR5cGUpIHtcbiAgICB2YXIgLy9pdGVtcyA9IG1lbnUuZmluZCgnbGknKSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudVxuICAgICAgLmZpbmQoJz5saSwgLm1lbnUsIC5tZW51ID4gbGknKVxuICAgICAgLnJlbW92ZUNsYXNzKGAke3N1Yk1lbnVDbGFzc30gJHtzdWJJdGVtQ2xhc3N9ICR7aGFzU3ViQ2xhc3N9IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51IGlzLWFjdGl2ZWApXG4gICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykuY3NzKCdkaXNwbGF5JywgJycpO1xuXG4gICAgLy8gY29uc29sZS5sb2coICAgICAgbWVudS5maW5kKCcuJyArIHN1Yk1lbnVDbGFzcyArICcsIC4nICsgc3ViSXRlbUNsYXNzICsgJywgLmhhcy1zdWJtZW51LCAuaXMtc3VibWVudS1pdGVtLCAuc3VibWVudSwgW2RhdGEtc3VibWVudV0nKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKSk7XG4gICAgLy8gaXRlbXMuZWFjaChmdW5jdGlvbigpe1xuICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAvLyAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG4gICAgLy8gICBpZigkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGlmKCRzdWIubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XG4gICAgLy8gICAgICRzdWIucmVtb3ZlQ2xhc3MoJ3N1Ym1lbnUgJyArIHN1Yk1lbnVDbGFzcykucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51Jyk7XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5OZXN0ID0gTmVzdDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5mdW5jdGlvbiBUaW1lcihlbGVtLCBvcHRpb25zLCBjYikge1xuICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZHVyYXRpb24gPSBvcHRpb25zLmR1cmF0aW9uLC8vb3B0aW9ucyBpcyBhbiBvYmplY3QgZm9yIGVhc2lseSBhZGRpbmcgZmVhdHVyZXMgbGF0ZXIuXG4gICAgICBuYW1lU3BhY2UgPSBPYmplY3Qua2V5cyhlbGVtLmRhdGEoKSlbMF0gfHwgJ3RpbWVyJyxcbiAgICAgIHJlbWFpbiA9IC0xLFxuICAgICAgc3RhcnQsXG4gICAgICB0aW1lcjtcblxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG5cbiAgdGhpcy5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmVtYWluID0gLTE7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLnN0YXJ0KCk7XG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIC8vIGlmKCFlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgcmVtYWluID0gcmVtYWluIDw9IDAgPyBkdXJhdGlvbiA6IHJlbWFpbjtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIGZhbHNlKTtcbiAgICBzdGFydCA9IERhdGUubm93KCk7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihvcHRpb25zLmluZmluaXRlKXtcbiAgICAgICAgX3RoaXMucmVzdGFydCgpOy8vcmVydW4gdGhlIHRpbWVyLlxuICAgICAgfVxuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgeyBjYigpOyB9XG4gICAgfSwgcmVtYWluKTtcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVyc3RhcnQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cblxuICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgLy9pZihlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCB0cnVlKTtcbiAgICB2YXIgZW5kID0gRGF0ZS5ub3coKTtcbiAgICByZW1haW4gPSByZW1haW4gLSAoZW5kIC0gc3RhcnQpO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJwYXVzZWQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBpbWFnZXMgYXJlIGZ1bGx5IGxvYWRlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbWFnZXMgLSBJbWFnZShzKSB0byBjaGVjayBpZiBsb2FkZWQuXG4gKiBAcGFyYW0ge0Z1bmN9IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGltYWdlIGlzIGZ1bGx5IGxvYWRlZC5cbiAqL1xuZnVuY3Rpb24gb25JbWFnZXNMb2FkZWQoaW1hZ2VzLCBjYWxsYmFjayl7XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIHVubG9hZGVkID0gaW1hZ2VzLmxlbmd0aDtcblxuICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICBjYWxsYmFjaygpO1xuICB9XG5cbiAgaW1hZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgLy8gQ2hlY2sgaWYgaW1hZ2UgaXMgbG9hZGVkXG4gICAgaWYgKHRoaXMuY29tcGxldGUgfHwgKHRoaXMucmVhZHlTdGF0ZSA9PT0gNCkgfHwgKHRoaXMucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykpIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIC8vIEZvcmNlIGxvYWQgdGhlIGltYWdlXG4gICAgZWxzZSB7XG4gICAgICAvLyBmaXggZm9yIElFLiBTZWUgaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9zbmlwcGV0cy9qcXVlcnkvZml4aW5nLWxvYWQtaW4taWUtZm9yLWNhY2hlZC1pbWFnZXMvXG4gICAgICB2YXIgc3JjID0gJCh0aGlzKS5hdHRyKCdzcmMnKTtcbiAgICAgICQodGhpcykuYXR0cignc3JjJywgc3JjICsgKHNyYy5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkpKTtcbiAgICAgICQodGhpcykub25lKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNpbmdsZUltYWdlTG9hZGVkKCkge1xuICAgIHVubG9hZGVkLS07XG4gICAgaWYgKHVubG9hZGVkID09PSAwKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxufVxuXG5Gb3VuZGF0aW9uLlRpbWVyID0gVGltZXI7XG5Gb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkID0gb25JbWFnZXNMb2FkZWQ7XG5cbn0oalF1ZXJ5KTtcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipXb3JrIGluc3BpcmVkIGJ5IG11bHRpcGxlIGpxdWVyeSBzd2lwZSBwbHVnaW5zKipcbi8vKipEb25lIGJ5IFlvaGFpIEFyYXJhdCAqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbihmdW5jdGlvbigkKSB7XG5cbiAgJC5zcG90U3dpcGUgPSB7XG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBlbmFibGVkOiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgcHJldmVudERlZmF1bHQ6IGZhbHNlLFxuICAgIG1vdmVUaHJlc2hvbGQ6IDc1LFxuICAgIHRpbWVUaHJlc2hvbGQ6IDIwMFxuICB9O1xuXG4gIHZhciAgIHN0YXJ0UG9zWCxcbiAgICAgICAgc3RhcnRQb3NZLFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVsYXBzZWRUaW1lLFxuICAgICAgICBpc01vdmluZyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XG4gICAgLy8gIGFsZXJ0KHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcbiAgICBpc01vdmluZyA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgIGlmICgkLnNwb3RTd2lwZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cbiAgICBpZihpc01vdmluZykge1xuICAgICAgdmFyIHggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICB2YXIgeSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIHZhciBkeCA9IHN0YXJ0UG9zWCAtIHg7XG4gICAgICB2YXIgZHkgPSBzdGFydFBvc1kgLSB5O1xuICAgICAgdmFyIGRpcjtcbiAgICAgIGVsYXBzZWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XG4gICAgICBpZihNYXRoLmFicyhkeCkgPj0gJC5zcG90U3dpcGUubW92ZVRocmVzaG9sZCAmJiBlbGFwc2VkVGltZSA8PSAkLnNwb3RTd2lwZS50aW1lVGhyZXNob2xkKSB7XG4gICAgICAgIGRpciA9IGR4ID4gMCA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGlmKE1hdGguYWJzKGR5KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgIC8vICAgZGlyID0gZHkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgIC8vIH1cbiAgICAgIGlmKGRpcikge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG9uVG91Y2hFbmQuY2FsbCh0aGlzKTtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdzd2lwZScsIGRpcikudHJpZ2dlcihgc3dpcGUke2Rpcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoU3RhcnQoZSkge1xuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHN0YXJ0UG9zWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHN0YXJ0UG9zWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIGlzTW92aW5nID0gdHJ1ZTtcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciAmJiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCk7XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7IHNldHVwOiBpbml0IH07XG5cbiAgJC5lYWNoKFsnbGVmdCcsICd1cCcsICdkb3duJywgJ3JpZ2h0J10sIGZ1bmN0aW9uICgpIHtcbiAgICAkLmV2ZW50LnNwZWNpYWxbYHN3aXBlJHt0aGlzfWBdID0geyBzZXR1cDogZnVuY3Rpb24oKXtcbiAgICAgICQodGhpcykub24oJ3N3aXBlJywgJC5ub29wKTtcbiAgICB9IH07XG4gIH0pO1xufSkoalF1ZXJ5KTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNZXRob2QgZm9yIGFkZGluZyBwc3VlZG8gZHJhZyBldmVudHMgdG8gZWxlbWVudHMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbiFmdW5jdGlvbigkKXtcbiAgJC5mbi5hZGRUb3VjaCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksZWwpe1xuICAgICAgJChlbCkuYmluZCgndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnLGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vd2UgcGFzcyB0aGUgb3JpZ2luYWwgZXZlbnQgb2JqZWN0IGJlY2F1c2UgdGhlIGpRdWVyeSBldmVudFxuICAgICAgICAvL29iamVjdCBpcyBub3JtYWxpemVkIHRvIHczYyBzcGVjcyBhbmQgZG9lcyBub3QgcHJvdmlkZSB0aGUgVG91Y2hMaXN0XG4gICAgICAgIGhhbmRsZVRvdWNoKGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhbmRsZVRvdWNoID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyxcbiAgICAgICAgICBmaXJzdCA9IHRvdWNoZXNbMF0sXG4gICAgICAgICAgZXZlbnRUeXBlcyA9IHtcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6ICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgdG91Y2htb3ZlOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgIHRvdWNoZW5kOiAnbW91c2V1cCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR5cGUgPSBldmVudFR5cGVzW2V2ZW50LnR5cGVdLFxuICAgICAgICAgIHNpbXVsYXRlZEV2ZW50XG4gICAgICAgIDtcblxuICAgICAgaWYoJ01vdXNlRXZlbnQnIGluIHdpbmRvdyAmJiB0eXBlb2Ygd2luZG93Lk1vdXNlRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBuZXcgd2luZG93Lk1vdXNlRXZlbnQodHlwZSwge1xuICAgICAgICAgICdidWJibGVzJzogdHJ1ZSxcbiAgICAgICAgICAnY2FuY2VsYWJsZSc6IHRydWUsXG4gICAgICAgICAgJ3NjcmVlblgnOiBmaXJzdC5zY3JlZW5YLFxuICAgICAgICAgICdzY3JlZW5ZJzogZmlyc3Quc2NyZWVuWSxcbiAgICAgICAgICAnY2xpZW50WCc6IGZpcnN0LmNsaWVudFgsXG4gICAgICAgICAgJ2NsaWVudFknOiBmaXJzdC5jbGllbnRZXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xuICAgICAgICBzaW11bGF0ZWRFdmVudC5pbml0TW91c2VFdmVudCh0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIGZpcnN0LnNjcmVlblgsIGZpcnN0LnNjcmVlblksIGZpcnN0LmNsaWVudFgsIGZpcnN0LmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLypsZWZ0Ki8sIG51bGwpO1xuICAgICAgfVxuICAgICAgZmlyc3QudGFyZ2V0LmRpc3BhdGNoRXZlbnQoc2ltdWxhdGVkRXZlbnQpO1xuICAgIH07XG4gIH07XG59KGpRdWVyeSk7XG5cblxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vLyoqRnJvbSB0aGUgalF1ZXJ5IE1vYmlsZSBMaWJyYXJ5Kipcbi8vKipuZWVkIHRvIHJlY3JlYXRlIGZ1bmN0aW9uYWxpdHkqKlxuLy8qKmFuZCB0cnkgdG8gaW1wcm92ZSBpZiBwb3NzaWJsZSoqXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuLyogUmVtb3ZpbmcgdGhlIGpRdWVyeSBmdW5jdGlvbiAqKioqXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuKGZ1bmN0aW9uKCAkLCB3aW5kb3csIHVuZGVmaW5lZCApIHtcblxuXHR2YXIgJGRvY3VtZW50ID0gJCggZG9jdW1lbnQgKSxcblx0XHQvLyBzdXBwb3J0VG91Y2ggPSAkLm1vYmlsZS5zdXBwb3J0LnRvdWNoLFxuXHRcdHRvdWNoU3RhcnRFdmVudCA9ICd0b3VjaHN0YXJ0Jy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaHN0YXJ0XCIgOiBcIm1vdXNlZG93blwiLFxuXHRcdHRvdWNoU3RvcEV2ZW50ID0gJ3RvdWNoZW5kJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaGVuZFwiIDogXCJtb3VzZXVwXCIsXG5cdFx0dG91Y2hNb3ZlRXZlbnQgPSAndG91Y2htb3ZlJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaG1vdmVcIiA6IFwibW91c2Vtb3ZlXCI7XG5cblx0Ly8gc2V0dXAgbmV3IGV2ZW50IHNob3J0Y3V0c1xuXHQkLmVhY2goICggXCJ0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCBcIiArXG5cdFx0XCJzd2lwZSBzd2lwZWxlZnQgc3dpcGVyaWdodFwiICkuc3BsaXQoIFwiIFwiICksIGZ1bmN0aW9uKCBpLCBuYW1lICkge1xuXG5cdFx0JC5mblsgbmFtZSBdID0gZnVuY3Rpb24oIGZuICkge1xuXHRcdFx0cmV0dXJuIGZuID8gdGhpcy5iaW5kKCBuYW1lLCBmbiApIDogdGhpcy50cmlnZ2VyKCBuYW1lICk7XG5cdFx0fTtcblxuXHRcdC8vIGpRdWVyeSA8IDEuOFxuXHRcdGlmICggJC5hdHRyRm4gKSB7XG5cdFx0XHQkLmF0dHJGblsgbmFtZSBdID0gdHJ1ZTtcblx0XHR9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIHRyaWdnZXJDdXN0b21FdmVudCggb2JqLCBldmVudFR5cGUsIGV2ZW50LCBidWJibGUgKSB7XG5cdFx0dmFyIG9yaWdpbmFsVHlwZSA9IGV2ZW50LnR5cGU7XG5cdFx0ZXZlbnQudHlwZSA9IGV2ZW50VHlwZTtcblx0XHRpZiAoIGJ1YmJsZSApIHtcblx0XHRcdCQuZXZlbnQudHJpZ2dlciggZXZlbnQsIHVuZGVmaW5lZCwgb2JqICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQuZXZlbnQuZGlzcGF0Y2guY2FsbCggb2JqLCBldmVudCApO1xuXHRcdH1cblx0XHRldmVudC50eXBlID0gb3JpZ2luYWxUeXBlO1xuXHR9XG5cblx0Ly8gYWxzbyBoYW5kbGVzIHRhcGhvbGRcblxuXHQvLyBBbHNvIGhhbmRsZXMgc3dpcGVsZWZ0LCBzd2lwZXJpZ2h0XG5cdCQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHtcblxuXHRcdC8vIE1vcmUgdGhhbiB0aGlzIGhvcml6b250YWwgZGlzcGxhY2VtZW50LCBhbmQgd2Ugd2lsbCBzdXBwcmVzcyBzY3JvbGxpbmcuXG5cdFx0c2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZDogMzAsXG5cblx0XHQvLyBNb3JlIHRpbWUgdGhhbiB0aGlzLCBhbmQgaXQgaXNuJ3QgYSBzd2lwZS5cblx0XHRkdXJhdGlvblRocmVzaG9sZDogMTAwMCxcblxuXHRcdC8vIFN3aXBlIGhvcml6b250YWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbW9yZSB0aGFuIHRoaXMuXG5cdFx0aG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcblxuXHRcdC8vIFN3aXBlIHZlcnRpY2FsIGRpc3BsYWNlbWVudCBtdXN0IGJlIGxlc3MgdGhhbiB0aGlzLlxuXHRcdHZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Z2V0TG9jYXRpb246IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0XHR2YXIgd2luUGFnZVggPSB3aW5kb3cucGFnZVhPZmZzZXQsXG5cdFx0XHRcdHdpblBhZ2VZID0gd2luZG93LnBhZ2VZT2Zmc2V0LFxuXHRcdFx0XHR4ID0gZXZlbnQuY2xpZW50WCxcblx0XHRcdFx0eSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdGlmICggZXZlbnQucGFnZVkgPT09IDAgJiYgTWF0aC5mbG9vciggeSApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVkgKSB8fFxuXHRcdFx0XHRldmVudC5wYWdlWCA9PT0gMCAmJiBNYXRoLmZsb29yKCB4ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWCApICkge1xuXG5cdFx0XHRcdC8vIGlPUzQgY2xpZW50WC9jbGllbnRZIGhhdmUgdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGhhdmUgYmVlblxuXHRcdFx0XHQvLyBpbiBwYWdlWC9wYWdlWS4gV2hpbGUgcGFnZVgvcGFnZS8gaGF2ZSB0aGUgdmFsdWUgMFxuXHRcdFx0XHR4ID0geCAtIHdpblBhZ2VYO1xuXHRcdFx0XHR5ID0geSAtIHdpblBhZ2VZO1xuXHRcdFx0fSBlbHNlIGlmICggeSA8ICggZXZlbnQucGFnZVkgLSB3aW5QYWdlWSkgfHwgeCA8ICggZXZlbnQucGFnZVggLSB3aW5QYWdlWCApICkge1xuXG5cdFx0XHRcdC8vIFNvbWUgQW5kcm9pZCBicm93c2VycyBoYXZlIHRvdGFsbHkgYm9ndXMgdmFsdWVzIGZvciBjbGllbnRYL1lcblx0XHRcdFx0Ly8gd2hlbiBzY3JvbGxpbmcvem9vbWluZyBhIHBhZ2UuIERldGVjdGFibGUgc2luY2UgY2xpZW50WC9jbGllbnRZXG5cdFx0XHRcdC8vIHNob3VsZCBuZXZlciBiZSBzbWFsbGVyIHRoYW4gcGFnZVgvcGFnZVkgbWludXMgcGFnZSBzY3JvbGxcblx0XHRcdFx0eCA9IGV2ZW50LnBhZ2VYIC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSBldmVudC5wYWdlWSAtIHdpblBhZ2VZO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRzdGFydDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGRhdGEgPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgP1xuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXSxcblx0XHRcdFx0XHRcdG9yaWdpbjogJCggZXZlbnQudGFyZ2V0IClcblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRzdG9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdXG5cdFx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0aGFuZGxlU3dpcGU6IGZ1bmN0aW9uKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApIHtcblx0XHRcdGlmICggc3RvcC50aW1lIC0gc3RhcnQudGltZSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5kdXJhdGlvblRocmVzaG9sZCAmJlxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDEgXSAtIHN0b3AuY29vcmRzWyAxIF0gKSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS52ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkICkge1xuXHRcdFx0XHR2YXIgZGlyZWN0aW9uID0gc3RhcnQuY29vcmRzWzBdID4gc3RvcC5jb29yZHNbIDAgXSA/IFwic3dpcGVsZWZ0XCIgOiBcInN3aXBlcmlnaHRcIjtcblxuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIFwic3dpcGVcIiwgJC5FdmVudCggXCJzd2lwZVwiLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9KSwgdHJ1ZSApO1xuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIGRpcmVjdGlvbiwkLkV2ZW50KCBkaXJlY3Rpb24sIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0gKSwgdHJ1ZSApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdH0sXG5cblx0XHQvLyBUaGlzIHNlcnZlcyBhcyBhIGZsYWcgdG8gZW5zdXJlIHRoYXQgYXQgbW9zdCBvbmUgc3dpcGUgZXZlbnQgZXZlbnQgaXNcblx0XHQvLyBpbiB3b3JrIGF0IGFueSBnaXZlbiB0aW1lXG5cdFx0ZXZlbnRJblByb2dyZXNzOiBmYWxzZSxcblxuXHRcdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsXG5cdFx0XHRcdHRoaXNPYmplY3QgPSB0aGlzLFxuXHRcdFx0XHQkdGhpcyA9ICQoIHRoaXNPYmplY3QgKSxcblx0XHRcdFx0Y29udGV4dCA9IHt9O1xuXG5cdFx0XHQvLyBSZXRyaWV2ZSB0aGUgZXZlbnRzIGRhdGEgZm9yIHRoaXMgZWxlbWVudCBhbmQgYWRkIHRoZSBzd2lwZSBjb250ZXh0XG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRpZiAoICFldmVudHMgKSB7XG5cdFx0XHRcdGV2ZW50cyA9IHsgbGVuZ3RoOiAwIH07XG5cdFx0XHRcdCQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIsIGV2ZW50cyApO1xuXHRcdFx0fVxuXHRcdFx0ZXZlbnRzLmxlbmd0aCsrO1xuXHRcdFx0ZXZlbnRzLnN3aXBlID0gY29udGV4dDtcblxuXHRcdFx0Y29udGV4dC5zdGFydCA9IGZ1bmN0aW9uKCBldmVudCApIHtcblxuXHRcdFx0XHQvLyBCYWlsIGlmIHdlJ3JlIGFscmVhZHkgd29ya2luZyBvbiBhIHN3aXBlIGV2ZW50XG5cdFx0XHRcdGlmICggJC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IHRydWU7XG5cblx0XHRcdFx0dmFyIHN0b3AsXG5cdFx0XHRcdFx0c3RhcnQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RhcnQoIGV2ZW50ICksXG5cdFx0XHRcdFx0b3JpZ1RhcmdldCA9IGV2ZW50LnRhcmdldCxcblx0XHRcdFx0XHRlbWl0dGVkID0gZmFsc2U7XG5cblx0XHRcdFx0Y29udGV4dC5tb3ZlID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRcdGlmICggIXN0YXJ0IHx8IGV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0b3AgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RvcCggZXZlbnQgKTtcblx0XHRcdFx0XHRpZiAoICFlbWl0dGVkICkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5oYW5kbGVTd2lwZSggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKTtcblx0XHRcdFx0XHRcdGlmICggZW1pdHRlZCApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcblx0XHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBwcmV2ZW50IHNjcm9sbGluZ1xuXHRcdFx0XHRcdGlmICggTWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnNjcm9sbFN1cHJlc3Npb25UaHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRjb250ZXh0LnN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcblx0XHRcdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcblx0XHRcdFx0XHRcdGNvbnRleHQubW92ZSA9IG51bGw7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JGRvY3VtZW50Lm9uKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlIClcblx0XHRcdFx0XHQub25lKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XG5cdFx0XHR9O1xuXHRcdFx0JHRoaXMub24oIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xuXHRcdH0sXG5cblx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXZlbnRzLCBjb250ZXh0O1xuXG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRpZiAoIGV2ZW50cyApIHtcblx0XHRcdFx0Y29udGV4dCA9IGV2ZW50cy5zd2lwZTtcblx0XHRcdFx0ZGVsZXRlIGV2ZW50cy5zd2lwZTtcblx0XHRcdFx0ZXZlbnRzLmxlbmd0aC0tO1xuXHRcdFx0XHRpZiAoIGV2ZW50cy5sZW5ndGggPT09IDAgKSB7XG5cdFx0XHRcdFx0JC5yZW1vdmVEYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggY29udGV4dCApIHtcblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0YXJ0ICkge1xuXHRcdFx0XHRcdCQoIHRoaXMgKS5vZmYoIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5tb3ZlICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RvcCApIHtcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdCQuZWFjaCh7XG5cdFx0c3dpcGVsZWZ0OiBcInN3aXBlLmxlZnRcIixcblx0XHRzd2lwZXJpZ2h0OiBcInN3aXBlLnJpZ2h0XCJcblx0fSwgZnVuY3Rpb24oIGV2ZW50LCBzb3VyY2VFdmVudCApIHtcblxuXHRcdCQuZXZlbnQuc3BlY2lhbFsgZXZlbnQgXSA9IHtcblx0XHRcdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLmJpbmQoIHNvdXJjZUV2ZW50LCAkLm5vb3AgKTtcblx0XHRcdH0sXG5cdFx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQoIHRoaXMgKS51bmJpbmQoIHNvdXJjZUV2ZW50ICk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSk7XG59KSggalF1ZXJ5LCB0aGlzICk7XG4qL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XG4gIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGAke3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgIGluIHdpbmRvdykge1xuICAgICAgcmV0dXJuIHdpbmRvd1tgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYF07XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn0oKSk7XG5cbmNvbnN0IHRyaWdnZXJzID0gKGVsLCB0eXBlKSA9PiB7XG4gIGVsLmRhdGEodHlwZSkuc3BsaXQoJyAnKS5mb3JFYWNoKGlkID0+IHtcbiAgICAkKGAjJHtpZH1gKVsgdHlwZSA9PT0gJ2Nsb3NlJyA/ICd0cmlnZ2VyJyA6ICd0cmlnZ2VySGFuZGxlciddKGAke3R5cGV9LnpmLnRyaWdnZXJgLCBbZWxdKTtcbiAgfSk7XG59O1xuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1vcGVuXSB3aWxsIHJldmVhbCBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLW9wZW5dJywgZnVuY3Rpb24oKSB7XG4gIHRyaWdnZXJzKCQodGhpcyksICdvcGVuJyk7XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zZV0gd2lsbCBjbG9zZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbi8vIElmIHVzZWQgd2l0aG91dCBhIHZhbHVlIG9uIFtkYXRhLWNsb3NlXSwgdGhlIGV2ZW50IHdpbGwgYnViYmxlLCBhbGxvd2luZyBpdCB0byBjbG9zZSBhIHBhcmVudCBjb21wb25lbnQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1jbG9zZV0nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCdjbG9zZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAnY2xvc2UnKTtcbiAgfVxuICBlbHNlIHtcbiAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlLnpmLnRyaWdnZXInKTtcbiAgfVxufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtdG9nZ2xlXSB3aWxsIHRvZ2dsZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZV0nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUnKTtcbiAgaWYgKGlkKSB7XG4gICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ3RvZ2dsZScpO1xuICB9IGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcigndG9nZ2xlLnpmLnRyaWdnZXInKTtcbiAgfVxufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2FibGVdIHdpbGwgcmVzcG9uZCB0byBjbG9zZS56Zi50cmlnZ2VyIGV2ZW50cy5cbiQoZG9jdW1lbnQpLm9uKCdjbG9zZS56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NhYmxlXScsIGZ1bmN0aW9uKGUpe1xuICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBsZXQgYW5pbWF0aW9uID0gJCh0aGlzKS5kYXRhKCdjbG9zYWJsZScpO1xuXG4gIGlmKGFuaW1hdGlvbiAhPT0gJycpe1xuICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoJCh0aGlzKSwgYW5pbWF0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gICAgfSk7XG4gIH1lbHNle1xuICAgICQodGhpcykuZmFkZU91dCgpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICB9XG59KTtcblxuJChkb2N1bWVudCkub24oJ2ZvY3VzLnpmLnRyaWdnZXIgYmx1ci56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZS1mb2N1c10nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUtZm9jdXMnKTtcbiAgJChgIyR7aWR9YCkudHJpZ2dlckhhbmRsZXIoJ3RvZ2dsZS56Zi50cmlnZ2VyJywgWyQodGhpcyldKTtcbn0pO1xuXG4vKipcbiogRmlyZXMgb25jZSBhZnRlciBhbGwgb3RoZXIgc2NyaXB0cyBoYXZlIGxvYWRlZFxuKiBAZnVuY3Rpb25cbiogQHByaXZhdGVcbiovXG4kKHdpbmRvdykub24oJ2xvYWQnLCAoKSA9PiB7XG4gIGNoZWNrTGlzdGVuZXJzKCk7XG59KTtcblxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcnMoKSB7XG4gIGV2ZW50c0xpc3RlbmVyKCk7XG4gIHJlc2l6ZUxpc3RlbmVyKCk7XG4gIHNjcm9sbExpc3RlbmVyKCk7XG4gIG11dGF0ZUxpc3RlbmVyKCk7XG4gIGNsb3NlbWVMaXN0ZW5lcigpO1xufVxuXG4vLyoqKioqKioqIG9ubHkgZmlyZXMgdGhpcyBmdW5jdGlvbiBvbmNlIG9uIGxvYWQsIGlmIHRoZXJlJ3Mgc29tZXRoaW5nIHRvIHdhdGNoICoqKioqKioqXG5mdW5jdGlvbiBjbG9zZW1lTGlzdGVuZXIocGx1Z2luTmFtZSkge1xuICB2YXIgeWV0aUJveGVzID0gJCgnW2RhdGEteWV0aS1ib3hdJyksXG4gICAgICBwbHVnTmFtZXMgPSBbJ2Ryb3Bkb3duJywgJ3Rvb2x0aXAnLCAncmV2ZWFsJ107XG5cbiAgaWYocGx1Z2luTmFtZSl7XG4gICAgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5wdXNoKHBsdWdpbk5hbWUpO1xuICAgIH1lbHNlIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcGx1Z2luTmFtZVswXSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLmNvbmNhdChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZXtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsdWdpbiBuYW1lcyBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gIH1cbiAgaWYoeWV0aUJveGVzLmxlbmd0aCl7XG4gICAgbGV0IGxpc3RlbmVycyA9IHBsdWdOYW1lcy5tYXAoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBgY2xvc2VtZS56Zi4ke25hbWV9YDtcbiAgICB9KS5qb2luKCcgJyk7XG5cbiAgICAkKHdpbmRvdykub2ZmKGxpc3RlbmVycykub24obGlzdGVuZXJzLCBmdW5jdGlvbihlLCBwbHVnaW5JZCl7XG4gICAgICBsZXQgcGx1Z2luID0gZS5uYW1lc3BhY2Uuc3BsaXQoJy4nKVswXTtcbiAgICAgIGxldCBwbHVnaW5zID0gJChgW2RhdGEtJHtwbHVnaW59XWApLm5vdChgW2RhdGEteWV0aS1ib3g9XCIke3BsdWdpbklkfVwiXWApO1xuXG4gICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IF90aGlzID0gJCh0aGlzKTtcblxuICAgICAgICBfdGhpcy50cmlnZ2VySGFuZGxlcignY2xvc2UuemYudHJpZ2dlcicsIFtfdGhpc10pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzaXplTGlzdGVuZXIoZGVib3VuY2Upe1xuICBsZXQgdGltZXIsXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1yZXNpemVdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS56Zi50cmlnZ2VyJylcbiAgICAub24oJ3Jlc2l6ZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cblxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSByZXNpemUgZXZlbnRcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJyZXNpemVcIik7XG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCByZXNpemUgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLnRyaWdnZXInKVxuICAgIC5vbignc2Nyb2xsLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKXtcbiAgICAgIGlmKHRpbWVyKXsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHNjcm9sbCBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInNjcm9sbFwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHNjcm9sbCBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG11dGF0ZUxpc3RlbmVyKGRlYm91bmNlKSB7XG4gICAgbGV0ICRub2RlcyA9ICQoJ1tkYXRhLW11dGF0ZV0nKTtcbiAgICBpZiAoJG5vZGVzLmxlbmd0aCAmJiBNdXRhdGlvbk9ic2VydmVyKXtcblx0XHRcdC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBtdXRhdGUgZXZlbnRcbiAgICAgIC8vbm8gSUUgOSBvciAxMFxuXHRcdFx0JG5vZGVzLmVhY2goZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG5cdFx0XHR9KTtcbiAgICB9XG4gfVxuXG5mdW5jdGlvbiBldmVudHNMaXN0ZW5lcigpIHtcbiAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpeyByZXR1cm4gZmFsc2U7IH1cbiAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtcmVzaXplXSwgW2RhdGEtc2Nyb2xsXSwgW2RhdGEtbXV0YXRlXScpO1xuXG4gIC8vZWxlbWVudCBjYWxsYmFja1xuICB2YXIgbGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiA9IGZ1bmN0aW9uIChtdXRhdGlvblJlY29yZHNMaXN0KSB7XG4gICAgICB2YXIgJHRhcmdldCA9ICQobXV0YXRpb25SZWNvcmRzTGlzdFswXS50YXJnZXQpO1xuXG5cdCAgLy90cmlnZ2VyIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdHlwZVxuICAgICAgc3dpdGNoIChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnR5cGUpIHtcblxuICAgICAgICBjYXNlIFwiYXR0cmlidXRlc1wiOlxuICAgICAgICAgIGlmICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSA9PT0gXCJzY3JvbGxcIiAmJiBtdXRhdGlvblJlY29yZHNMaXN0WzBdLmF0dHJpYnV0ZU5hbWUgPT09IFwiZGF0YS1ldmVudHNcIikge1xuXHRcdCAgXHQkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQsIHdpbmRvdy5wYWdlWU9mZnNldF0pO1xuXHRcdCAgfVxuXHRcdCAgaWYgKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpID09PSBcInJlc2l6ZVwiICYmIG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJkYXRhLWV2ZW50c1wiKSB7XG5cdFx0ICBcdCR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldF0pO1xuXHRcdCAgIH1cblx0XHQgIGlmIChtdXRhdGlvblJlY29yZHNMaXN0WzBdLmF0dHJpYnV0ZU5hbWUgPT09IFwic3R5bGVcIikge1xuXHRcdFx0ICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLmF0dHIoXCJkYXRhLWV2ZW50c1wiLFwibXV0YXRlXCIpO1xuXHRcdFx0ICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIildKTtcblx0XHQgIH1cblx0XHQgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgXCJjaGlsZExpc3RcIjpcblx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikuYXR0cihcImRhdGEtZXZlbnRzXCIsXCJtdXRhdGVcIik7XG5cdFx0ICAkdGFyZ2V0LmNsb3Nlc3QoXCJbZGF0YS1tdXRhdGVdXCIpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIildKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgLy9ub3RoaW5nXG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChub2Rlcy5sZW5ndGgpIHtcbiAgICAgIC8vZm9yIGVhY2ggZWxlbWVudCB0aGF0IG5lZWRzIHRvIGxpc3RlbiBmb3IgcmVzaXppbmcsIHNjcm9sbGluZywgb3IgbXV0YXRpb24gYWRkIGEgc2luZ2xlIG9ic2VydmVyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBub2Rlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgdmFyIGVsZW1lbnRPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24pO1xuICAgICAgICBlbGVtZW50T2JzZXJ2ZXIub2JzZXJ2ZShub2Rlc1tpXSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6IFtcImRhdGEtZXZlbnRzXCIsIFwic3R5bGVcIl0gfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBbUEhdXG4vLyBGb3VuZGF0aW9uLkNoZWNrV2F0Y2hlcnMgPSBjaGVja1dhdGNoZXJzO1xuRm91bmRhdGlvbi5JSGVhcllvdSA9IGNoZWNrTGlzdGVuZXJzO1xuLy8gRm91bmRhdGlvbi5JU2VlWW91ID0gc2Nyb2xsTGlzdGVuZXI7XG4vLyBGb3VuZGF0aW9uLklGZWVsWW91ID0gY2xvc2VtZUxpc3RlbmVyO1xuXG59KGpRdWVyeSk7XG5cbi8vIGZ1bmN0aW9uIGRvbU11dGF0aW9uT2JzZXJ2ZXIoZGVib3VuY2UpIHtcbi8vICAgLy8gISEhIFRoaXMgaXMgY29taW5nIHNvb24gYW5kIG5lZWRzIG1vcmUgd29yazsgbm90IGFjdGl2ZSAgISEhIC8vXG4vLyAgIHZhciB0aW1lcixcbi8vICAgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tdXRhdGVdJyk7XG4vLyAgIC8vXG4vLyAgIGlmIChub2Rlcy5sZW5ndGgpIHtcbi8vICAgICAvLyB2YXIgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4vLyAgICAgLy8gICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbi8vICAgICAvLyAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgLy8gICAgIGlmIChwcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcbi8vICAgICAvLyAgICAgICByZXR1cm4gd2luZG93W3ByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInXTtcbi8vICAgICAvLyAgICAgfVxuLy8gICAgIC8vICAgfVxuLy8gICAgIC8vICAgcmV0dXJuIGZhbHNlO1xuLy8gICAgIC8vIH0oKSk7XG4vL1xuLy9cbi8vICAgICAvL2ZvciB0aGUgYm9keSwgd2UgbmVlZCB0byBsaXN0ZW4gZm9yIGFsbCBjaGFuZ2VzIGVmZmVjdGluZyB0aGUgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXNcbi8vICAgICB2YXIgYm9keU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoYm9keU11dGF0aW9uKTtcbi8vICAgICBib2R5T2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6dHJ1ZSwgYXR0cmlidXRlRmlsdGVyOltcInN0eWxlXCIsIFwiY2xhc3NcIl19KTtcbi8vXG4vL1xuLy8gICAgIC8vYm9keSBjYWxsYmFja1xuLy8gICAgIGZ1bmN0aW9uIGJvZHlNdXRhdGlvbihtdXRhdGUpIHtcbi8vICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBtdXRhdGlvbiBldmVudFxuLy8gICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cbi8vXG4vLyAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIGJvZHlPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4vLyAgICAgICAgICQoJ1tkYXRhLW11dGF0ZV0nKS5hdHRyKCdkYXRhLWV2ZW50cycsXCJtdXRhdGVcIik7XG4vLyAgICAgICB9LCBkZWJvdW5jZSB8fCAxNTApO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgSW5WaWV3cG9ydCBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvSW5WaWV3cG9ydCc7XG5pbXBvcnQgQ29tcG9uZW50TWFwIGZyb20gJy4vQ29tcG9uZW50TWFwJztcbmltcG9ydCBTZXJ2aWNlcyBmcm9tICcuL2NvbXBvbmVudHMvc2VydmljZXMnO1xuXG4vKipcbiAqIFRoZSB0b3AtbGV2ZWwgY29udHJvbGxlciBmb3IgdGhlIHdob2xlIHBhZ2UuIFRoaXMgY29tcG9uZW50IGlzIHJlc3BvbnNpYmxlXG4gKiBmb3IgbG9hZGluZyBvdGhlciBjb250cm9sbGVycyBhbmQgdmlld3MuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcCB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGFsbCBnbG9iYWwgSlMgY29tcG9uZW50cyBhbmQgY2FsbCBgbG9hZGNvbXBvbmVudHNgXG4gICAqIHRvIGluaXRpYWxpemUgYWxsIHVuaXF1ZSBKUyBjb21wb25lbnRzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvKipcbiAgICAgKiBTZXJ2aWNlcyBpcyB0aGUgb2JqZWN0IHdoaWNoIGhvbGRzIHJlZmVyZW5jZXMgdG8gYWxsIHNlcnZpY2VzXG4gICAgICogY3JlYXRlZCBmb3IgcGFnZXMuIFNlcnZpY2VzIHNob3VsZCBiZSBpbnN0YW50aWF0ZWQgdGhlcmUgYW5kXG4gICAgICogdGhlbiB3aWxsIGJlIGluamVjdGVkIGludG8gZWFjaCBjb21wb25lbnQgZm9yIG9wdGlvbmFsIHVzZSB2aWEgdGhlXG4gICAgICogYGxvYWRjb21wb25lbnRzYCBmdW5jdGlvblxuICAgICAqXG4gICAgICogQHR5cGUge1NlcnZpY2VzfVxuICAgICAqIEBwcm9wZXJ0eSB7U2VydmljZXN9XG4gICAgICovXG4gICAgdGhpcy5TZXJ2aWNlcyA9IG5ldyBTZXJ2aWNlcygpO1xuXG4gICAgLyoqXG4gICAgICogVGhlIEluVmlld3BvcnQgdmlldyBjb21wb25lbnQgd2hpY2ggbmVlZHMgdG8gcnVuIGdsb2JhbGx5IGZvciBhbGwgY29tcG9uZW50cy5cbiAgICAgKiBAdHlwZSB7SW5WaWV3cG9ydH1cbiAgICAgKiBAcHJvcGVydHkge0luVmlld3BvcnR9XG4gICAgICovXG4gICAgdGhpcy5pblZpZXdwb3J0ID0gbmV3IEluVmlld3BvcnQodGhpcy5TZXJ2aWNlcyk7XG5cbiAgICAvLyBMb2FkIGVhY2ggY29tcG9uZW50XG4gICAgdGhpcy5sb2FkUGFnZWNvbXBvbmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGxvb3BzIG92ZXIgYWxsIGVsZW1lbnRzIGluIHRoZSBET00gd2l0aCB0aGVcbiAgICogYGRhdGEtbG9hZGNvbXBvbmVudGAgYXR0cmlidXRlIGFuZCBsb2FkcyB0aGUgc3BlY2lmaWVkIHZpZXdcbiAgICogb3IgY29udHJvbGxlci5cbiAgICpcbiAgICogVG8gYXR0YWNoIGEgSlMgY29tcG9uZW50IHRvIGFuIEhUTUwgZWxlbWVudCwgaW4geW91ciBtYXJrdXAgeW91J2RcbiAgICogZG8gc29tZXRoaW5nIGxpa2U6IDxzZWN0aW9uIGNsYXNzPVwiZXhhbXBsZS1jb21wb25lbnRcIiBkYXRhLWxvYWRjb21wb25lbnQ9J0V4YW1wbGVjb21wb25lbnQnPlxuICAgKiB3aGVyZSAnRXhhbXBsZWNvbXBvbmVudCcgaXMgeW91ciBKUyBjbGFzcyBuYW1lLiBZb3UnZCBuZWVkIHRvIGFkZCB0aGF0IGNvbXBvbmVudCB0byB0aGUgLi9jb21wb25lbnRNYXAuanNcbiAgICogYW5kIG1ha2Ugc3VyZSB0aGUgY29tcG9uZW50IGV4aXN0cyBhbmQgaXMgYSBwcm9wZXIgRVM2IGNsYXNzLCBhbmQgdGhlbiB5b3UnbGwgZW5kIHVwIHdpdGhcbiAgICogYW4gRVM2IGNsYXNzIHRoYXQgaXMgcGFzc2VkIGEgcmVmZXJlbmNlIHRvIHNlY3Rpb24uZXhhbXBsZS1jb21wb25lbnQgb24gaW5pdC5cbiAgICovXG4gIGxvYWRQYWdlY29tcG9uZW50cygpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSAnZGF0YS1sb2FkY29tcG9uZW50JztcbiAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1snICsgYXR0cmlidXRlICsgJ10nKSwgKGVsZW1lbnQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkaW5nIGNvbXBvbmVudCAnLCBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpKTtcbiAgICAgIG5ldyBDb21wb25lbnRNYXBbZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKV0oZWxlbWVudCwgdGhpcy5TZXJ2aWNlcyk7XG4gICAgfSk7XG4gIH1cblxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBJbXBvcnQgYWxsIHJlcXVpcmVkIG1vZHVsZXNcbi8vIGltcG9ydCBIZWFkZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0hlYWRlcic7XG5pbXBvcnQgTmF2IGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9OYXYnO1xuLy8gaW1wb3J0IEZvcm0gZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0Zvcm0nO1xuLy8gaW1wb3J0IEZpbHRlciBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvRmlsdGVyJztcbi8vIGltcG9ydCBWaWRlbyBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvVmlkZW8nO1xuLy8gaW1wb3J0IFNsaWRlciBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MvU2xpZGVyJztcbi8vIGltcG9ydCBBbmNob3IgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0FuY2hvcic7XG4vLyBpbXBvcnQgU29jaWFsU2hhcmUgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL1NvY2lhbFNoYXJlJztcbi8vIGltcG9ydCBJblZpZXdwb3J0IGZyb20gJy4vY29tcG9uZW50cy92aWV3cy9JblZpZXdwb3J0Jztcbi8vIGltcG9ydCBCYW5uZXIgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXdzL0Jhbm5lcic7XG5cbi8vIEV4cG9ydCByZWZlcmVuY2UgdG8gYWxsIG1vZHVsZXMgaW4gYW4gb2JqZWN0XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLy8gSGVhZGVyLFxuICAgIE5hdixcbiAgICAvLyBGb3JtLFxuICAgIC8vIEZpbHRlcixcbiAgICAvLyBWaWRlb1xuICAgIC8vIEFuY2hvcixcbiAgICAvLyBTbGlkZXIsXG4gICAgLy8gU29jaWFsU2hhcmUsXG4gICAgLy8gSW5WaWV3cG9ydCxcbiAgICAvLyBCYW5uZXIsXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEFSSUEgU1RSSU5HU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBBUklBID0ge1xuICBFWFBBTkRFRDogICAgICAgICAgICAgICAgICAgICAgJ2FyaWEtZXhwYW5kZWQnLFxuICBISURERU46ICAgICAgICAgICAgICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJyxcbiAgU0VMRUNURUQ6ICAgICAgICAgICAgICAgICAgICAgICdhcmlhLXNlbGVjdGVkJ1xufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRDTEFTUyBOQU1FUyAtIGZvciBjbGFzcyBuYW1lc1xuLy8gICAgICBub3QgQ1NTIHNlbGVjdG9yc1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBDTEFTU19OQU1FUyA9IHtcbiAgQUJPVkVfQk9UVE9NOiAgICAgICAgICAgICAgICAgICAnYWJvdmUtYm90dG9tJyxcbiAgQUJPVkVfSEFMRldBWTogICAgICAgICAgICAgICAgICAnYWJvdmUtaGFsZndheScsXG4gIEFCT1ZFX1ZJRVdQT1JUOiAgICAgICAgICAgICAgICAgJ2Fib3ZlLXZpZXdwb3J0JyxcbiAgQUNUSVZFOiAgICAgICAgICAgICAgICAgICAgICAgICAnYWN0aXZlJyxcbiAgQkFOTkVSX0FDVElWRTogICAgICAgICAgICAgICAgICAnYmFubmVyLWFjdGl2ZScsXG4gIEJVVFRPTl9TVUJNSVRUSU5HOiAgICAgICAgICAgICAgJ2J1dHRvbi0tc3VibWl0dGluZycsXG4gIEJVVFRPTl9TVUJNSVRURUQ6ICAgICAgICAgICAgICAgJ2J1dHRvbi0tc3VibWl0dGVkJyxcbiAgRVJST1I6ICAgICAgICAgICAgICAgICAgICAgICAgICAnZXJyb3InLFxuICBDTElDSzogICAgICAgICAgICAgICAgICAgICAgICAgICdjbGljaycsXG4gIENMT1NFRDogICAgICAgICAgICAgICAgICAgICAgICAgJ2Nsb3NlZCcsXG4gIEZJUlNUX0JBVENIOiAgICAgICAgICAgICAgICAgICAgJ2ZpcnN0LWJhdGNoJyxcbiAgRklYRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAnbmF2LWZpeGVkJyxcbiAgSElESU5HOiAgICAgICAgICAgICAgICAgICAgICAgICAnaGlkaW5nJyxcbiAgSElEREVOOiAgICAgICAgICAgICAgICAgICAgICAgICAnaGlkZGVuJyxcbiAgSE9WRVI6ICAgICAgICAgICAgICAgICAgICAgICAgICAnaG92ZXInLFxuICBJTlZBTElEOiAgICAgICAgICAgICAgICAgICAgICAgICdpbnZhbGlkJyxcbiAgSU5fVklFV1BPUlQ6ICAgICAgICAgICAgICAgICAgICAnaW4tdmlld3BvcnQnLFxuICBMT0FESU5HOiAgICAgICAgICAgICAgICAgICAgICAgICdsb2FkaW5nJyxcbiAgTUlOSTogICAgICAgICAgICAgICAgICAgICAgICAgICAnbWluaScsXG4gIE9QRU46ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ29wZW4nLFxuICBPUEVORUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICdvcGVuZWQnLFxuICBTQ1JPTExFRDogICAgICAgICAgICAgICAgICAgICAgICdzY3JvbGxlZCcsXG4gIFNFTEVDVEVEOiAgICAgICAgICAgICAgICAgICAgICAgJ3NlbGVjdGVkJyxcbiAgU1VCTUlUVEVEOiAgICAgICAgICAgICAgICAgICAgICAnc3VibWl0dGVkJyxcbiAgVklTVUFMTFlfSElEREVOOiAgICAgICAgICAgICAgICAndmlzdWFsbHktaGlkZGVuJyxcbiAgVkFMSUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAndmFsaWQnLFxufTtcbiIsIi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRNSVNDIFNUUklOR1Ncbi8vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBFTkRQT0lOVFMgPSB7XG4gIFNFQVJDSDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvd3AtanNvbi9yZWxldmFuc3NpL3YxL3NlYXJjaD8nLFxuICBXUEFQSTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnL3dwLWpzb24vd3AvdjIvJyxcbiAgV1BBUElUT1RBTDogICAgICAgICAgICAgICAgICAgICAgICAgJ1gtV1AtVG90YWwnXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEVSUk9SIE1lc3NhZ2VzXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEVSUk9SUyA9IHtcbiAgRkVBVFVSRURfSU1BR0U6ICAgICAgICAgICAgICAgICAnQSBmZWF0dXJlZCBpbWFnZSBpcyByZXF1aXJlZCcsXG59O1xuIiwiLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcXFxuLy8gICAgJEVWRU5UU1xuLy8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmV4cG9ydCBjb25zdCBFVkVOVFMgPSB7XG4gIEFOSU1BVElPTkVORDogICAgICAgICAgICAgICAgICAgJ2FuaW1hdGlvbmVuZCcsXG4gIEJFRk9SRVVOTE9BRDogICAgICAgICAgICAgICAgICAgJ2JlZm9yZXVubG9hZCcsXG4gIEJMVVI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JsdXInLFxuICBDSEFOR0U6ICAgICAgICAgICAgICAgICAgICAgICAgICdjaGFuZ2UnLFxuICBDTEVBUl9GSUxURVJTOiAgICAgICAgICAgICAgICAgICdjbGVhcmZpbHRlcnMnLFxuICBDTElDSzogICAgICAgICAgICAgICAgICAgICAgICAgICdjbGljaycsXG4gIENVU1RPTV9FVkVOVDogICAgICAgICAgICAgICAgICAgJ2N1c3RvbWV2ZW50JyxcbiAgRElTUExBWV9TVUJIRUFESU5HOiAgICAgICAgICAgICAnZGlzcGxheXN1YmhlYWRpbmcnLFxuICBEUk9QRE9XTl9DSEFOR0VEOiAgICAgICAgICAgICAgICdkcm9wZG93bmNoYW5nZWQnLFxuICBGT1JNX0VSUk9SOiAgICAgICAgICAgICAgICAgICAgICdmb3JtZXJyb3InLFxuICBGT1JNX1NVQ0NFU1M6ICAgICAgICAgICAgICAgICAgICdmb3Jtc3VjY2VzcycsXG4gIEZPQ1VTOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvY3VzJyxcbiAgSEVBREVSX0hJRElORzogICAgICAgICAgICAgICAgICAnaGVhZGVyLWhpZGluZycsXG4gIElOUFVUOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lucHV0JyxcbiAgS0VZX0RPV046ICAgICAgICAgICAgICAgICAgICAgICAna2V5ZG93bicsXG4gIE1PVVNFT1VUOiAgICAgICAgICAgICAgICAgICAgICAgJ21vdXNlb3V0JyxcbiAgTU9VU0VPVkVSOiAgICAgICAgICAgICAgICAgICAgICAnbW91c2VvdmVyJyxcbiAgUEFHRVNIT1c6ICAgICAgICAgICAgICAgICAgICAgICAncGFnZXNob3cnLFxuICBSRVFVRVNUX01BREU6ICAgICAgICAgICAgICAgICAgICdyZXF1ZXN0bWFkZScsXG4gIFJFU0laRTogICAgICAgICAgICAgICAgICAgICAgICAgJ3Jlc2l6ZScsXG4gIFJFU1VMVFNfUkVUVVJORUQ6ICAgICAgICAgICAgICAgJ3Jlc3VsdHNyZXR1cm5kJyxcbiAgU0NST0xMOiAgICAgICAgICAgICAgICAgICAgICAgICAnc2Nyb2xsJyxcbiAgU0lNVUxBVEVEX0NMSUNLOiAgICAgICAgICAgICAgICAnc2ltdWxhdGVkLWNsaWNrJyxcbiAgU0hPV19ISURFOiAgICAgICAgICAgICAgICAgICAgICAnc2hvd2hpZGUnLFxuICBTVUJNSVQ6ICAgICAgICAgICAgICAgICAgICAgICAgICdzdWJtaXQnLFxuICBUT1VDSF9FTkQ6ICAgICAgICAgICAgICAgICAgICAgICd0b3VjaGVuZCcsXG4gIFRPVUNIX1NUQVJUOiAgICAgICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQnLFxuICBUUkFOU0lUSU9ORU5EOiAgICAgICAgICAgICAgICAgICd0cmFuc2l0aW9uZW5kJyxcbiAgVVBEQVRFX1BPU1RfQ09VTlQ6ICAgICAgICAgICAgICAndXBkYXRlcG9zdGNvdW50JyxcbiAgVVBEQVRFX0lOX1ZJRVdQT1JUX01PRFVMRVM6ICAgICAndXBkYXRlaW52aWV3cG9ydG1vZHVsZXMnLFxuICBVUERBVEVfU0VBUkNIX1dJVEhfTkVXX0lURU1TOiAgICd1cGRhdGVzZWFyY2h3aXRobmV3aXRlbXMnLFxuICBVUERBVEVfU0VUVElOR1M6ICAgICAgICAgICAgICAgICd1cGRhdGVzZXR0aW5ncycsXG4gIFdIRUVMOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ3doZWVsJ1xufTtcbiIsImV4cG9ydCB7IEFSSUEgfSBmcm9tICcuL2FyaWEnO1xuZXhwb3J0IHsgQ0xBU1NfTkFNRVMgfSBmcm9tICcuL2NsYXNzLW5hbWVzJztcbmV4cG9ydCB7IEVORFBPSU5UUyB9IGZyb20gJy4vZW5kcG9pbnRzJztcbmV4cG9ydCB7IEVSUk9SUyB9IGZyb20gJy4vZXJyb3JzJztcbmV4cG9ydCB7IEVWRU5UUyB9IGZyb20gJy4vZXZlbnRzJztcbmV4cG9ydCB7IE1JU0MgfSBmcm9tICcuL21pc2MnO1xuZXhwb3J0IHsgS0VZX0NPREVTfSBmcm9tICcuL2tleS1jb2Rlcyc7XG5leHBvcnQgeyBTRUxFQ1RPUlMgfSBmcm9tICcuL3NlbGVjdG9ycyc7XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkS0VZIENPREVTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZXhwb3J0IGNvbnN0IEtFWV9DT0RFUyA9IHtcbiAgRVNDQVBFOiAyNyxcbiAgRU5URVI6IDEzLFxuICBTUEFDRUJBUjogMzJcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxcXG4vLyAgICAkTUlTQyBTVFJJTkdTXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgTUlTQyA9IHtcbiAgQkFOTkVSX0NPT0tJRTogICAgICAgICAgICAgICAgICAgICAgJ2Jhbm5lcl92aWV3ZWQnLFxuICBCQU5ORVJfQ09PS0lFX1ZJRVdFRDogICAgICAgICAgICAgICAndmlld2VkJyxcbiAgQlVUVE9OX1NVQk1JVFRFRDogICAgICAgICAgICAgICAgICAgJ1RoYW5rIFlvdScsXG4gIEJVVFRPTl9QUk9DRVNTSU5HOiAgICAgICAgICAgICAgICAgICdXb3JraW5nJyxcbiAgQkVGT1JFRU5EOiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JlZm9yZWVuZCcsXG4gIENIQU5HRTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICdDaGFuZ2UgJyxcbiAgREFUQV9WSVNJQkxFOiAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtdmlzaWJsZScsXG4gIERJU0FCTEVEOiAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXNhYmxlZCcsXG4gIGZVUkwxOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyLnBocD91PScsXG4gIExBUkdFOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEwMjQsXG4gIE1FRElVTTogICAgICAgICAgICAgICAgICAgICAgICAgICAgIDY0MCxcbiAgbVVSTDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21haWx0bzonLFxuICBtVVJMMjogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnP3N1YmplY3Q9JyxcbiAgbVVSTDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyZib2R5PScsXG4gIHRVUkwxOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0nLFxuICB0VVJMVGV4dDogICAgICAgICAgICAgICAgICAgICAgICAgICAnJnRleHQ9JyxcbiAgdFVSTFZpYTogICAgICAgICAgICAgICAgICAgICAgICAgICAgJyZ2aWE9VGhlRGVtb2NyYXRzJyxcbn07XG4iLCIvLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXFxcbi8vICAgICRTRUxFQ1RPUlMgLSBDU1Mgc2VsZWN0b3JzIE9OTFlcbi8vIC0gIHRhZyBuYW1lcywgI2lkcywgLmNsYXNzbmFtZXMsIFthdHRyaWJ1dGVzXSwgZXRjXG4vLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5leHBvcnQgY29uc3QgU0VMRUNUT1JTID0ge1xuICBBTEw6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICcjYWxsJyxcbiAgQU5DSE9SOiAgICAgICAgICAgICAgICAgICAgICAgICAnYScsXG4gIEFOQ0hPUl9XSVRIX0hSRUY6ICAgICAgICAgICAgICAgJ2FbaHJlZl0nLFxuICBBUElfUkVTVUxUUzogICAgICAgICAgICAgICAgICAgICdbZGF0YS1sb2FkY29tcG9uZW50PVwiQVBJUmVzdWx0c1wiXScsXG4gIEJBQ0tHUk9VTkQ6ICAgICAgICAgICAgICAgICAgICAgJy5iYWNrZ3JvdW5kJyxcbiAgQkFOTkVSX1RSSUdHRVI6ICAgICAgICAgICAgICAgICAnLmJhbm5lci1jbG9zZScsXG4gIEJVVFRPTjogICAgICAgICAgICAgICAgICAgICAgICAgJ2J1dHRvbicsXG4gIENIRUNLRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgJzpjaGVja2VkJyxcbiAgQ0hFQ0tFRF9MQUJFTDogICAgICAgICAgICAgICAgICAnOmNoZWNrZWQgKyBsYWJlbCcsXG4gIENIRUNLQk9YOiAgICAgICAgICAgICAgICAgICAgICAgJ2NoZWNrYm94JyxcbiAgQ0hFVlJPTl9TVFJJUEU6ICAgICAgICAgICAgICAgICAnLmNoZXZyb24tc3RyaXBlJyxcbiAgQ0xPU0U6ICAgICAgICAgICAgICAgICAgICAgICAgICAnLmNsb3NlJyxcbiAgQ0xPU0VfU0VBUkNIOiAgICAgICAgICAgICAgICAgICAnLmNsb3NlLXNlYXJjaCcsXG4gIERBVEFfQk9UVE9NOiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtYm90dG9tcG9zaXRpb24nLFxuICBEQVRBX0hBTEZXQVk6ICAgICAgICAgICAgICAgICAgICdkYXRhLWhhbGZ3YXknLFxuICBEQVRBX0hBU19BTklNQVRFRDogICAgICAgICAgICAgICdkYXRhLWhhcy1hbmltYXRlZCcsXG4gIERBVEFfTEFaWV9MT0FEOiAgICAgICAgICAgICAgICAgJ2RhdGEtbGF6eWxvYWQnLFxuICBEQVRBX1BPU0lUSU9OOiAgICAgICAgICAgICAgICAgICdkYXRhLXBvc2l0aW9uJyxcbiAgREFUQV9WSVNJQkxFOiAgICAgICAgICAgICAgICAgICAnW2RhdGEtdmlzaWJsZV0nLFxuICBESVY6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXYnLFxuICBEUk9QRE9XTjogICAgICAgICAgICAgICAgICAgICAgICcuZHJvcGRvd24nLFxuICBEUk9QRE9XTl9DT05URU5UOiAgICAgICAgICAgICAgICcuZHJvcGRvd25fX2NvbnRlbnQnLFxuICBEUk9QRE9XTl9UT0dHTEU6ICAgICAgICAgICAgICAgICcuZHJvcGRvd25fX3RvZ2dsZScsXG4gIERST1BET1dOX1RPR0dMRV9DTElDSzogICAgICAgICAgJy5kcm9wZG93bi5jbGljaycsXG4gIERST1BET1dOX1RPR0dMRV9IT1ZFUjogICAgICAgICAgJy5kcm9wZG93bi5ob3ZlcicsXG4gIEVNQUlMOiAgICAgICAgICAgICAgICAgICAgICAgICAgJy5zaGFyZS0tZW1haWwnLFxuICBGQUNFQk9PSzogICAgICAgICAgICAgICAgICAgICAgICcuc2hhcmUtLWZiJyxcbiAgRkVBVFVSRURWSURFTzogICAgICAgICAgICAgICAgICAnLmZlYXR1cmVkLXZpZGVvIHZpZGVvJyxcbiAgRklMRV9JTlBVVDogICAgICAgICAgICAgICAgICAgICAnaW5wdXRbdHlwZT1maWxlXScsXG4gIEZJTFRFUjogICAgICAgICAgICAgICAgICAgICAgICAgJy5maWx0ZXInLFxuICBGSUxURVJfQ0hPSUNFOiAgICAgICAgICAgICAgICAgICcuZmlsdGVyLWNob2ljZScsXG4gIEZJTFRFUl9PUFRJT046ICAgICAgICAgICAgICAgICAgJy5maWx0ZXItb3B0aW9uJyxcbiAgRklMVEVSX1RSSUdHRVI6ICAgICAgICAgICAgICAgICAnLmZpbHRlci10cmlnZ2VyJyxcbiAgRk9STTogICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9ybScsXG4gIEZPUk1fRklFTERTOiAgICAgICAgICAgICAgICAgICAgJ2lucHV0LCBzZWxlY3QsIHRleHRhcmVhJyxcbiAgSFRNTDogICAgICAgICAgICAgICAgICAgICAgICAgICAnaHRtbCcsXG4gIElOVkFMSUQ6ICAgICAgICAgICAgICAgICAgICAgICAgJzppbnZhbGlkJyxcbiAgTEFORElOR19QQUdFX1RJVExFOiAgICAgICAgICAgICAnLmxhbmRpbmctcGFnZS1oZWFkZXJfX3RpdGxlJyxcbiAgTElOS0VESU46ICAgICAgICAgICAgICAgICAgICAgICAnLnNoYXJlLS1saScsXG4gIExPQURJTkc6ICAgICAgICAgICAgICAgICAgICAgICAgJy5sb2FkaW5nJyxcbiAgTE9BRF9NT1JFOiAgICAgICAgICAgICAgICAgICAgICAnLmxvYWQtbW9yZScsXG4gIE5BVjogICAgICAgICAgICAgICAgICAgICAgICAgICAgJy5wcmltYXJ5LW5hdicsXG4gIE5BVl9UUklHR0VSOiAgICAgICAgICAgICAgICAgICAgJy5uYXYtdHJpZ2dlcicsXG4gIE5FU1RFRDogICAgICAgICAgICAgICAgICAgICAgICAgJy5uZXN0ZWQnLFxuICBPR0RFU0M6ICAgICAgICAgICAgICAgICAgICAgICAgICdtZXRhW3Byb3BlcnR5PVwib2c6ZGVzY3JpcHRpb25cIl0nLFxuICBPR1RJVExFOiAgICAgICAgICAgICAgICAgICAgICAgICdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nLFxuICBPR1VSTDogICAgICAgICAgICAgICAgICAgICAgICAgICdtZXRhW3Byb3BlcnR5PVwib2c6dXJsXCJdJyxcbiAgT1BFTl9TRUFSQ0g6ICAgICAgICAgICAgICAgICAgICAnLm9wZW4tc2VhcmNoJyxcbiAgT1BUR1JPVVA6ICAgICAgICAgICAgICAgICAgICAgICAnb3B0Z3JvdXAnLFxuICBQQVJBR1JBUEg6ICAgICAgICAgICAgICAgICAgICAgICdwJyxcbiAgUExBWUVSOiAgICAgICAgICAgICAgICAgICAgICAgICAnLnBsYXllcicsXG4gIFBMQVlfVFJJR0dFUjogICAgICAgICAgICAgICAgICAgJy52aWRlb19fcGxheS10cmlnZ2VyJyxcbiAgUE9TVF9DT1VOVDogICAgICAgICAgICAgICAgICAgICAnLnBvc3QtY291bnQgLmNvdW50JyxcbiAgUE9TVF9MSVNUSU5HOiAgICAgICAgICAgICAgICAgICAnLnBvc3QtbGlzdGluZycsXG4gIFJFU1VMVFNfQ09OVEFJTkVSOiAgICAgICAgICAgICAgJy5yZXN1bHRzLWNvbnRhaW5lcicsXG4gIFNFQ09OREFSWV9CTE9HX0xJU1RJTkc6ICAgICAgICAgJy5zZWNvbmRhcnktYmxvZy1saXN0aW5nJyxcbiAgU0VBUkNIX0lOUFVUOiAgICAgICAgICAgICAgICAgICAnLnNlYXJjaC1maWVsZF9faW5wdXQnLFxuICBTRUxFQ1RFRDogICAgICAgICAgICAgICAgICAgICAgICcuc2VsZWN0ZWQnLFxuICBTSVRFX05BVjogICAgICAgICAgICAgICAgICAgICAgICcubmF2aWdhdGlvbicsXG4gIFNUQVRJU1RJQ19WQUxVRTogICAgICAgICAgICAgICAgJy5zdGF0aXN0aWNfX3ZhbHVlJyxcbiAgU1VCTUlUOiAgICAgICAgICAgICAgICAgICAgICAgICAnW3R5cGU9XCJzdWJtaXRcIl0nLFxuICBTVkdfQkdfQ09OVEFJTkVSOiAgICAgICAgICAgICAgICcuc3ZnLWJhY2tncm91bmQnLFxuICBUQUI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICdbcm9sZT1cInRhYlwiXScsXG4gIFRBQlBBTkVMOiAgICAgICAgICAgICAgICAgICAgICAgJ1tyb2xlPVwidGFicGFuZWxcIl0nLFxuICBUV0lUVEVSOiAgICAgICAgICAgICAgICAgICAgICAgICcuc2hhcmUtLXR3Jyxcbn07XG4iLCIvKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAqIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAqIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICogbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZnVuYyBBIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgTiBtaWxsaXNlY29uZHNcbiAqIEBwYXJhbSAge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0XG4gKiBAcGFyYW0gIHtib29sZWFufSBpbW1lZGlhdGUgVHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlIGxlYWRpbmcgZWRnZSBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZ1xuICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90IGJlIHRyaWdnZXJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gIGxldCB0aW1lb3V0O1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gdGhpcztcbiAgICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBjb25zdCBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICBpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgfTtcbn1cblxuIiwiLyoqXG4gKiBSZXR1cm5zIHRoZSBjb29raWUgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBvZiB0aGUgY29va2llIHRvIGZpbmRcbiAqIEByZXR1cm4ge09iamVjdH0gY29va2llIGJhc2VkIG9uIG5hbWUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRjb29raWUobmFtZSkge1xuICBjb25zdCBjb29raWVzID0ge31cbiAgY29uc3QgY29va2llU2V0ID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7ICcpO1xuICBjb29raWVTZXQuZm9yRWFjaChjb29raWUgPT4gY29va2llc1tjb29raWUuc3BsaXQoJz0nKVswXV0gPSBjb29raWUuc3BsaXQoJz0nKVsxXSk7XG5cbiAgcmV0dXJuIGNvb2tpZXNbbmFtZV07XG59OyIsIi8vIGV4cG9ydCB7IGNsb3Nlc3QgfSBmcm9tICcuL2Nsb3Nlc3QuanMnO1xuLy8gZXhwb3J0IHsgY3JlYXRlbG9hZGVyIH0gZnJvbSAnLi9sb2FkZXInO1xuLy8gZXhwb3J0IHsgY29udmVydGRhdGUgfSBmcm9tICcuL2NvbnZlcnRkYXRlLmpzJztcbmV4cG9ydCB7IGRlYm91bmNlIH0gZnJvbSAnLi9kZWJvdW5jZSc7XG5leHBvcnQgeyBnZXRjb29raWUgfSBmcm9tICcuL2dldGNvb2tpZSc7XG4vLyBleHBvcnQgeyBoYXNob3ZlciB9IGZyb20gJy4vaGFzaG92ZXInO1xuLy8gZXhwb3J0IHsgaGV4dG9yZ2IgfSBmcm9tICcuL2hleHRvcmdiJztcbi8vIGV4cG9ydCB7IGludGVycG9sYXRlbnVtYmVycyB9IGZyb20gJy4vaW50ZXJwb2xhdGVudW1iZXJzJztcbi8vIGV4cG9ydCB7IGlzb2JqZWN0ZW1wdHkgfSBmcm9tICcuL2lzb2JqZWN0ZW1wdHknO1xuZXhwb3J0IHsgaXNzY3JvbGxlZGludG92aWV3IH0gZnJvbSAnLi9pc3Njcm9sbGVkaW50b3ZpZXcnO1xuLy8gZXhwb3J0IHsgTWVzc2FnZUJ1cyB9IGZyb20gJy4vbWVzc2FnZWJ1cyc7XG5leHBvcnQgeyBvcGVucG9wdXAgfSBmcm9tICcuL29wZW5wb3B1cCc7XG4vLyBleHBvcnQgeyByZW1vdmVsb2FkZXIgfSBmcm9tICcuL2xvYWRlcic7XG5leHBvcnQgeyByYW5kb21zZWN1cmVzdHJpbmcgfSBmcm9tICcuL3JhbmRvbXNlY3VyZXN0cmluZyc7XG5leHBvcnQgeyBzY3JvbGx0byB9IGZyb20gJy4vc2Nyb2xsdG8nO1xuIiwiLyoqXG4gKiBBIGZ1bmN0aW9uIHdoaWNoIG1lYXN1cmVzIHRoZSBlbGVtZW50cyBwb3NpdGlvbiBvbiB0aGUgcGFnZSBpblxuICogcmVsYXRpb24gdG8gdGhlIHdoYXQgdGhlIHVzZXIgY2FuIGN1cnJlbnRseSBzZWUgb24gdGhlaXIgc2NyZWVuXG4gKiBhbmQgcmV0dXJucyBhIGJvb2xlYW4gdmFsdWUgd2l0aCBgdHJ1ZWAgYmVpbmcgdGhhdCB0aGUgZWxlbWVudFxuICogaXMgdmlzaWJsZSBhbmQgYGZhbHNlYCBiZWluZyB0aGF0IGl0IGlzIG5vdCB2aXNpYmxlLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gIGVsZW0gQSBET00gZWxlbWVudFxuICogQHJldHVybiB7Qm9vbGVhbn0gaXNWaXNpYmxlIEEgYm9vbGVhbiB2YWx1ZSB3aXRoIGB0cnVlYCByZXByZXNlbnRpbmcgdGhhdCB0aGUgZWxlbWVudCBpcyB2aXNpYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc3Njcm9sbGVkaW50b3ZpZXcoZWxlbSkge1xuICBjb25zdCBlbGVtZW50Qm91bmRzID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIGVsZW1lbnRCb3VuZHMudG9wIDwgd2luZG93LmlubmVySGVpZ2h0ICYmIGVsZW1lbnRCb3VuZHMuYm90dG9tID49IDA7XG59XG5cbiIsIi8qKlxuICogQSBmdW5jdGlvbiB3aGljaCBvcGVucyBhIHBvcHVwIHdpbmRvd1xuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gdXJsIHRoZSB1cmwgdG8gb3BlbiBpbiB0aGUgcG9wdXBcbiAqIEBwYXJhbSAge1N0cmluZ30gd2luZG93TmFtZSBhIHVuaXF1ZSBuYW1lIGZvciB0aGUgcG9wdXBcbiAqIEBwYXJhbSAge0ludGVnZXJ9IHcgdGhlIGRlc2lyZWQgd2lkdGggb2YgdGhlIHBvcHVwXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSBoIHRoZSBkZXNpcmVkIGhlaWdodCBvZiB0aGUgcG9wdXBcbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHRoZSBwb3B1cCBmdW5jdGlvbiBpcyBib3VuZCB0b1xuICovXG5leHBvcnQgZnVuY3Rpb24gb3BlbnBvcHVwKHVybCwgd2luZG93TmFtZSwgdywgaCkge1xuICByZXR1cm4gd2luZG93Lm9wZW4odXJsLCB3aW5kb3dOYW1lLFxuICAgICdtZW51YmFyPW5vLHN0YXR1cz1ubyx0b29sYmFyPW5vLGxvY2F0aW9uPXllcyxyZXNpemFibGU9eWVzLHNjcm9sbGJhcnM9eWVzLHN0YXR1cz1ubyx3aWR0aD0nICsgdyArICcsaGVpZ2h0PScgKyBoICsgJydcbiAgKTtcbn1cbiIsIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgbGVuZ3RoIGFuZFxuICogcmV0dXJucyBhIHJhbmRvbSBzdHJpbmdcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGxlbmd0aCBvZiB0aGUgcmFuZG9tIHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSByYW5kb20gc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21zZWN1cmVzdHJpbmcobGVuZ3RoKSB7XG4gIGxldCB0ZXh0ID0gJyc7XG4gIGNvbnN0IHBvc3NpYmxlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5JztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuICB9XG4gIHJldHVybiB0ZXh0O1xufSIsIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHNjcm9sbHMgdG8gYSB0YXJnZXQgb24gcGFnZVxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gZXZlbnRcbiAqIEBwYXJhbSAge0hUTUxOb2RlfSBlbGVtZW50XG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSBvZmZzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjcm9sbHRvKGV2ZW50LCBlbGVtZW50LCBvZmZzZXQgPSAwKSB7XG4gIGNvbnN0IGhhc2ggPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpLmNoYXJBdCgwKSA9PT0gJyMnID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSA6IHVuZGVmaW5lZDtcblxuICBpZiAoaGFzaCAmJiB3aW5kb3cuc2Nyb2xsICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCAkdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihoYXNoKTtcbiAgICBjb25zdCB0YXJnZXRZID0gJHRhcmdldC5vZmZzZXRUb3AgLSBvZmZzZXQ7XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgd2luZG93LnNjcm9sbFRvKHtcbiAgICAgIHRvcDogdGFyZ2V0WSxcbiAgICAgIGJlaGF2aW9yOiAnc21vb3RoJ1xuICAgIH0pO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEVWRU5UUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5cbi8qKlxuICogSURcbiAqXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGlnbm9yZVxuICovXG5sZXQgaWQgPSAwO1xuXG4vKipcbiAqIEdldCBJRFxuICpcbiAqIEJlY2F1c2UgZmlsZSBpcyBsb2FkZWQgb25seSBvbmNlLCB0aGlzIGZ1bmN0aW9uXG4gKiBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBldmVyeSB0aW1lXG4gKiBpdCBpcyBjYWxsZWQuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBVbmlxdWUgSUQgdmFsdWVcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG4vKipcbiAqIENsaWNrIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpY2tTZXJ2aWNlIHtcbiAgLyoqXG4gICAqIENsaWNrIFNlcnZpY2UgY29uc3RydWN0b3IgaW4gd2hpY2ggdGhlIGBjYWxsYmFja3NgIGFycmF5IGlzIGNyZWF0ZWRcbiAgICogYXMgYSBwcm9wZXJ0eSBvZiB0aGUgY2xhc3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIC8qKlxuICAgICAgICogQW4gYXJyYXkgdG8gYmUgcG9wdWxhdGVkIHdpdGggY2FsbGJhY2sgZnVuY3Rpb25zIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgb24gQ2xpY2tcbiAgICAgICAqXG4gICAgICAgKiBAcHJvcGVydHkge0FycmF5fSBjYWxsYmFja3NcbiAgICAgICAqL1xuICAgICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcblxuICAgICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgKiBAZGVzYyBJbml0aWFsaXplIHRoZSBzaW5nbGV0b24gYnkgYXR0YWNoaW5nIHRoZSBldmVudCBsaXN0ZW5lciB0byB0aGUgd2luZG93XG4gICogQGxpc3RlbnMge0V2ZW50fSBsaXN0ZW5zIHRvIHRoZSB3aW5kb3cgQ2xpY2sgZXZlbnRcbiAgKi9cbiAgaW5pdCgpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5DTElDSywgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICogQGRlc2MgVGhlIGNsaWNrIGV2ZW50IGhhbmRsZXIuIEl0ZXJhdGVzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIGludm9rZXMgZWFjaCBjYWxsYmFjayBpbiB0aGUgQXJyYXlcbiAgKiBAcGFyYW0gIHtFdmVudH0gZXZlbnQgdGhlIGV2ZW50IG9iamVjdFxuICAqL1xuICBvbkNsaWNrKGV2ZW50KSB7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgICAgIGlmIChjYWxsYmFjay5pc0VsZW1lbnRNYXRjaCkge1xuICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBjYWxsYmFjay50YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsYmFjayhldmVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsYmFjayhldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2MgQSBob29rIGZvciBwdXNoaW5nIGEgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogaW50byB0aGUgYGNhbGxiYWNrc2AgYXJyYXkuIEEgdW5pcXVlXG4gICAqIElEIHZhbHVlIGZvciB0aGUgY2FsbGJhY2sgaXMgZ2VuZXJhdGVkXG4gICAqIGFuZCBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGZvciByZW1vdmluZ1xuICAgKiB0aGUgY2FsbGJhY2sgaWYgbmVlZCBiZS5cbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBBIHJlZmVyZW5jZSB0byB0aGUgRE9NIGVsZW1lbnQgdGhhdCB0cmlnZ2VycyB0aGUgZXZlbnRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBpbnZva2UgYnkgdGhlIENsaWNrU2VydmljZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzRWxlbWVudE1hdGNoIEEgZmxhZyB1c2VkIHRvIGludmVydCB0aGUgY29uZGl0aW9uYWwgY2hlY2sgZm9yIGZpcmluZyB0aGUgY2FsbGJhY2tcbiAgICogQHJldHVybiB7RnVuY3Rpb259IGByZW1vdmVDYWxsYmFja2AgQSBmdW5jdGlvbiB3aGljaCB3aWxsIHJlbW92ZSBhbiBlbnRyeSBmcm9tIHRoZSBgY2FsbGJhY2tzYCBhcnJheVxuICAgKi9cbiAgYWRkQ2FsbGJhY2soZWxlbWVudCwgY2FsbGJhY2ssIGlzRWxlbWVudE1hdGNoKSB7XG4gICAgLy8gR2VuZXJhdGUgYW4gaWQgZm9yIHRoZSBjYWxsYmFja1xuICAgIGNvbnN0IGlkID0gZ2V0SWQoKTtcbiAgICAvLyBtb2R1bGUgY2FuJ3QgYmUgdW5kZWZpbmVkIGJlY2F1c2UgaXQncyBhcyBpbiBpZGVudGlmaWVyIGZvciB0aGUgY2FsbGJhY2tzIGFycmF5LlxuICAgIGNvbnN0IG1vZHVsZSA9IGVsZW1lbnQuZGF0YXNldCAmJiBlbGVtZW50LmRhdGFzZXQubG9hZG1vZHVsZSA/IGVsZW1lbnQuZGF0YXNldC5sb2FkbW9kdWxlIDogZWxlbWVudDtcbiAgICBsZXQgZmxhZyA9IGZhbHNlO1xuICAgIGNvbnN0IHRhcmdldEVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuY2FsbGJhY2tzW2ldLm1vZHVsZSA9PT0gbW9kdWxlKSB7XG4gICAgICAgIGZsYWcgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghZmxhZykge1xuICAgICAgLy8gUHVzaCBmdW5jdGlvbiBpbnRvIGFycmF5IHdpdGggYSB1bmlxdWUgaWRcbiAgICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goe1xuICAgICAgICBtb2R1bGUsXG4gICAgICAgIGlkLFxuICAgICAgICB0YXJnZXRFbGVtZW50LFxuICAgICAgICBpc0VsZW1lbnRNYXRjaCxcbiAgICAgICAgY2FsbGJhY2tcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgcmVtb3ZlIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2FsbGJhY2suYmluZCh0aGlzLCBpZCk7XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVycyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCByZW1vdmVzXG4gICAqIHRoZSBlbnRyeSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpZCBwYXNzZWRcbiAgICogaW4gYXMgYW4gYXJndW1lbnRcbiAgICpcbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBBbiBpZCB2YWx1ZSB0byBmaWx0ZXIgYnlcbiAgICovXG4gIHJlbW92ZUNhbGxiYWNrKGlkKSB7XG4gICAgdGhpcy5jYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrcy5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgIHJldHVybiBpdGVtLmlkICE9PSBpZDtcbiAgICB9KTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4uLy4uL1V0aWxzJztcbmltcG9ydCB7IEVWRU5UUyB9IGZyb20gJy4uLy4uL0NvbnN0YW50cyc7XG5cbi8qKlxuICogSURcbiAqXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGlnbm9yZVxuICovXG5sZXQgaWQgPSAwO1xuXG4vKipcbiAqIEdldCBJRFxuICpcbiAqIEJlY2F1c2UgZmlsZSBpcyBsb2FkZWQgb25seSBvbmNlLCB0aGlzIGZ1bmN0aW9uXG4gKiBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBldmVyeSB0aW1lXG4gKiBpdCBpcyBjYWxsZWQuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBVbmlxdWUgSUQgdmFsdWVcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gIHJldHVybiBpZCsrO1xufVxuXG4vKipcbiAqIFJlc2l6ZSBTZXJ2aWNlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlc2l6ZVNlcnZpY2Uge1xuICAvKipcbiAgICogUmVzaXplU2VydmljZSBjb25zdHJ1Y3RvciBpbiB3aGljaCB0aGUgYGNhbGxiYWNrc2AgYXJyYXkgaXMgY3JlYXRlZFxuICAgKiBhcyBhIHByb3BlcnR5IG9mIHRoZSBjbGFzcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIG9uIHJlc2l6ZVxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtBcnJheX0gY2FsbGJhY2tzXG4gICAgICovXG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcblxuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEluaXRpYWxpemUgdGhlIHNpbmdsZXRvbiBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB3aW5kb3dcbiAgICogQGxpc3RlbnMge0V2ZW50fSBsaXN0ZW5zIHRvIHRoZSB3aW5kb3cgcmVzaXplIGV2ZW50XG4gICAqL1xuICBpbml0KCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5SRVNJWkUsIGRlYm91bmNlKHRoaXMub25SZXNpemUuYmluZCh0aGlzKSwgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBUaGUgcmVzaXplIGV2ZW50IGhhbmRsZXIuIEl0ZXJ0YXRlcyB0aHJvdWdoIHRoZSBgY2FsbGJhY2tgIGFycmF5IGFuZCBpbnZva2VzIGVhY2ggY2FsbGJhY2sgaW4gdGhlIEFycmF5XG4gICAqL1xuICBvblJlc2l6ZSgpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgY2FsbGJhY2suY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBBIGhvb2sgZm9yIHB1c2hpbmcgYSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBpbnRvIHRoZSBgY2FsbGJhY2tzYCBhcnJheS4gQSB1bmlxdWVcbiAgICogSUQgdmFsdWUgZm9yIHRoZSBjYWxsYmFjayBpcyBnZW5lcmF0ZWRcbiAgICogYW5kIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgZm9yIHJlbW92aW5nXG4gICAqIHRoZSBjYWxsYmFjayBpZiBuZWVkIGJlLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGludm9rZSBieSB0aGUgUmVzaXplU2VydmljZVxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYHJlbW92ZUNhbGxiYWNrYCBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgcmVtb3ZlIGFuIGVudHJ5IGZyb20gdGhlIGBjYWxsYmFja3NgIGFycmF5XG4gICAqL1xuICBhZGRDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIC8vIEdlbmVyYXRlIGFuIGlkIGZvciB0aGUgY2FsbGJhY2tcbiAgICBjb25zdCBpZCA9IGdldElkKCk7XG5cbiAgICAvLyBQdXNoIGZ1bmN0aW9uIGludG8gYXJyYXkgd2l0aCBhIHVuaXF1ZSBpZFxuICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goe1xuICAgICAgaWQsXG4gICAgICBjYWxsYmFja1xuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIHRoZSByZW1vdmUgZnVuY3Rpb25cbiAgICByZXR1cm4gdGhpcy5yZW1vdmVDYWxsYmFjay5iaW5kKHRoaXMsIGlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIHJlbW92ZXNcbiAgICogdGhlIGVudHJ5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGlkIHBhc3NlZFxuICAgKiBpbiBhcyBhbiBhcmd1bWVudFxuICAgKlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIEFuIGlkIHZhbHVlIHRvIGZpbHRlciBieVxuICAgKi9cbiAgcmVtb3ZlQ2FsbGJhY2soaWQpIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0uaWQgIT09IGlkO1xuICAgIH0pO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGRlYm91bmNlIH0gZnJvbSAnLi4vLi4vVXRpbHMnO1xuaW1wb3J0IHsgRVZFTlRTIH0gZnJvbSAnLi4vLi4vQ29uc3RhbnRzJztcblxuLyoqXG4gKiBJRFxuICpcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAaWdub3JlXG4gKi9cbmxldCBpZCA9IDA7XG5cbi8qKlxuICogR2V0IElEXG4gKlxuICogQmVjYXVzZSBmaWxlIGlzIGxvYWRlZCBvbmx5IG9uY2UsIHRoaXMgZnVuY3Rpb25cbiAqIGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGV2ZXJ5IHRpbWVcbiAqIGl0IGlzIGNhbGxlZC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFVuaXF1ZSBJRCB2YWx1ZVxuICogQGlnbm9yZVxuICovXG5mdW5jdGlvbiBnZXRJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbi8qKlxuICogU2Nyb2xsIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2Nyb2xsU2VydmljZSB7XG4gIC8qKlxuICAgKiBTY3JvbGwgU2VydmljZSBjb25zdHJ1Y3RvciBpbiB3aGljaCB0aGUgYGNhbGxiYWNrc2AgYXJyYXkgaXMgY3JlYXRlZFxuICAgKiBhcyBhIHByb3BlcnR5IG9mIHRoZSBjbGFzcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIG9uIHNjcm9sbFxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtBcnJheX0gY2FsbGJhY2tzXG4gICAgICovXG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB1c2VyIGJhc2VkIG9uIHNjcm9sbCwgdmVydGljYWxseVxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IHBvc2l0aW9uXG4gICAgICovXG4gICAgdGhpcy5zY3JvbGxZID0gMDtcblxuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEluaXRpYWxpemUgdGhlIHNpbmdsZXRvbiBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB3aW5kb3dcbiAgICogQGxpc3RlbnMge0V2ZW50fSBsaXN0ZW5zIHRvIHRoZSB3aW5kb3cgc2Nyb2xsIGV2ZW50XG4gICAqL1xuICBpbml0KCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5TQ1JPTEwsIGRlYm91bmNlKHRoaXMub25TY3JvbGwuYmluZCh0aGlzKSwgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzYyBUaGUgc2Nyb2xsIGV2ZW50IGhhbmRsZXIuIEl0ZXJhdGVzIHRocm91Z2ggdGhlIGBjYWxsYmFja2AgYXJyYXkgYW5kIGludm9rZXMgZWFjaCBjYWxsYmFjayBpbiB0aGUgQXJyYXlcbiAgICovXG4gIG9uU2Nyb2xsKCkge1xuICAgIHRoaXMuc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZO1xuICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICBjYWxsYmFjay5jYWxsYmFjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjIEEgaG9vayBmb3IgcHVzaGluZyBhIGNhbGxiYWNrIGZ1bmN0aW9uIGludG8gdGhlIGBjYWxsYmFja3NgIGFycmF5LiBBIHVuaXF1ZVxuICAgKiBJRCB2YWx1ZSBmb3IgdGhlIGNhbGxiYWNrIGlzIGdlbmVyYXRlZCBhbmQgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBmb3IgcmVtb3ZpbmdcbiAgICogdGhlIGNhbGxiYWNrIGlmIG5lZWQgYmUuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gaW52b2tlIGJ5IHRoZSBTY3JvbGxTZXJ2aWNlXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBgcmVtb3ZlQ2FsbGJhY2tgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCByZW1vdmUgYW4gZW50cnkgZnJvbSB0aGUgYGNhbGxiYWNrc2AgYXJyYXlcbiAgICovXG4gIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgLy8gR2VuZXJhdGUgYW4gaWQgZm9yIHRoZSBjYWxsYmFja1xuICAgIGNvbnN0IGlkID0gZ2V0SWQoKTtcblxuICAgIC8vIFB1c2ggZnVuY3Rpb24gaW50byBhcnJheSB3aXRoIGEgdW5pcXVlIGlkXG4gICAgdGhpcy5jYWxsYmFja3MucHVzaCh7XG4gICAgICBpZCxcbiAgICAgIGNhbGxiYWNrXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIHJlbW92ZSBmdW5jdGlvblxuICAgIHJldHVybiB0aGlzLnJlbW92ZUNhbGxiYWNrLmJpbmQodGhpcywgaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlcnMgdGhyb3VnaCB0aGUgYGNhbGxiYWNrYCBhcnJheSBhbmQgcmVtb3Zlc1xuICAgKiB0aGUgZW50cnkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaWQgcGFzc2VkXG4gICAqIGluIGFzIGFuIGFyZ3VtZW50XG4gICAqXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgQW4gaWQgdmFsdWUgdG8gZmlsdGVyIGJ5XG4gICAqL1xuICByZW1vdmVDYWxsYmFjayhpZCkge1xuICAgIHRoaXMuY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3MuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS5pZCAhPT0gaWQ7XG4gICAgfSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gSW1wb3J0IHNlcnZpY2VzXG5pbXBvcnQgQ2xpY2tTZXJ2aWNlIGZyb20gJy4vQ2xpY2tTZXJ2aWNlJztcbmltcG9ydCBSZXNpemVTZXJ2aWNlIGZyb20gJy4vUmVzaXplU2VydmljZSc7XG5pbXBvcnQgU2Nyb2xsU2VydmljZSBmcm9tICcuL1Njcm9sbFNlcnZpY2UnO1xuXG4vKipcbiAqIEEgc2luZ2xldG9uIHdob3NlIHByb3BlcnRpZXMgYXJlIGluZGl2aWR1YWwgc2VydmljZXMuXG4gKlxuICogQW55IHNlcnZpY2Ugc2luZ2xldG9uIHNlcnZpY2UgdGhhdCBuZWVkcyB0byBiZSBpbnN0YW50aWF0ZWRcbiAqIHNob3VsZCBiZSBkb25lIHNvIGluIHRoZSBTZXJ2aWNlcyBjbGFzcy5cbiAqXG4gKiBTZXJ2aWNlcyBzaG91bGQgbm90IGludGVyYWN0IHdpdGggdGhlIERPTSwgdGhhdCBzaG91bGQgYmVcbiAqIGxlZnQgdG8gdGhlIFZpZXdzLiBTZXJ2aWNlcyBjYW4gc2ltcGx5IGJlIHVzZWQgdG8gY29uc29saWRhdGVcbiAqIGFuIGV4cGVuc2l2ZSBldmVudCBsaXN0ZW5lciAoJ3Njcm9sbCcsICdyZXNpemUnLCBldGMpLiBvclxuICogdHJhY2sgc3RhdGUgKGxpa2Ugd2hpY2ggbW9kYWwgaXMgb3BlbiBhdCB3aGljaCB0aW1lKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VydmljZXMge1xuICAvKipcbiAgICogU2VydmljZXMgY29uc3RydWN0b3IgdGhhdCBpbnN0YW50aWF0ZXMgZWFjaCBzZXJ2aWNlIGluZGl2aWR1YWxseS5cbiAgICogVG8gYWRkIGFub3RoZXIgc2VydmljZXMgaW5zdGlhdGUgaXQgaGVyZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8qKlxuICAgICAqIEEgc2VydmljZSB3aGljaCBsaXN0ZW5zIHRvIHRoZSBgd2luZG93YCBjbGljayBldmVudCBhbmRcbiAgICAgKiBpbnZva2VzIGFuIGFycmF5IG9mIGNhbGxiYWNrc1xuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IENsaWNrU2VydmljZSBBIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgQ2xpY2tTZXJ2aWNlIGNsYXNzXG4gICAgICovXG4gICAgdGhpcy5DbGlja1NlcnZpY2UgPSBuZXcgQ2xpY2tTZXJ2aWNlKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHNlcnZpY2Ugd2hpY2ggbGlzdGVucyB0byB0aGUgYHdpbmRvd2AgcmVzaXplIGV2ZW50IGFuZFxuICAgICAqIGludm9rZXMgYW4gYXJyYXkgb2YgY2FsbGJhY2tzXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gUmVzaXplU2VydmljZSBBIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgUmVzaXplU2VydmljZSBjbGFzc1xuICAgICAqL1xuICAgIHRoaXMuUmVzaXplU2VydmljZSA9IG5ldyBSZXNpemVTZXJ2aWNlKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHNlcnZpY2Ugd2hpY2ggbGlzdGVucyB0byB0aGUgYHdpbmRvd2Agc2Nyb2xsIGV2ZW50IGFuZFxuICAgICAqIGludm9rZXMgYW4gYXJyYXkgb2YgY2FsbGJhY2tzXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge09iamVjdH0gU2Nyb2xsU2VydmljZSBBIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgU2Nyb2xsU2VydmljZSBjbGFzc1xuICAgICAqL1xuICAgIHRoaXMuU2Nyb2xsU2VydmljZSA9IG5ldyBTY3JvbGxTZXJ2aWNlKCk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgaXNzY3JvbGxlZGludG92aWV3IH0gZnJvbSAnLi4vLi4vVXRpbHMnO1xuaW1wb3J0IHsgQ0xBU1NfTkFNRVMsIEVWRU5UUywgTUlTQywgU0VMRUNUT1JTIH0gZnJvbSAnQ29uc3RhbnRzJztcblxuLyoqXG4gKiBJbiBWaWV3cG9ydFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJblZpZXdwb3J0IHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBpbnZpZXdwb3J0IHdoaWNoIHNpbXBseSBhc3NpZ25zIHRoZSBTY3JvbGxTZXJ2aWNlXG4gICAqIHRvIGEgcHJvcGVydHkgb24gdGhlIGNvbnRydWN0b3IgZm9yIHJlZmVyZW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFNlcnZpY2VzIHZhcmlvdXMgc2VydmljZXMsIHBhc3NlZCBpbiBhcyBwYXJhbVxuICAgKi9cbiAgY29uc3RydWN0b3IoU2VydmljZXMpIHtcbiAgICAvKipcbiAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIFNjcm9sbFNlcnZpY2Ugc2luZ2xldG9uXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9XG4gICAgICovXG4gICAgdGhpcy5TY3JvbGxTZXJ2aWNlID0gU2VydmljZXMuU2Nyb2xsU2VydmljZTtcblxuICAgIC8vIEluaXRpYWxpemUgdGhlIHZpZXdcbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdmlldyBieSBjYWxsaW5nIHRoZSBmdW5jdGlvbnMgdG9cbiAgICogY3JlYXRlIERPTSByZWZlcmVuY2VzLCBzZXR1cCBldmVudCBoYW5kbGVycyBhbmRcbiAgICogdGhlbiBjcmVhdGUgdGhlIGV2ZW50IGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmNhY2hlRG9tUmVmZXJlbmNlcygpXG4gICAgICAuc2V0dXBIYW5kbGVycygpXG4gICAgICAuZW5hYmxlKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIGFsbCBuZWNlc3NhcnkgRE9NIGVsZW1lbnRzIHVzZWQgaW4gdGhlIHZpZXcgYW5kIGNhY2hlIHRoZW1cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGNhY2hlRG9tUmVmZXJlbmNlcygpIHtcbiAgICAvKipcbiAgICAgKiBBbGwgRE9NIGVsZW1lbnRzIHdpdGggdGhlIGBkYXRhLXZpc2libGVgIGF0dHJpYnV0ZVxuICAgICAqIEBwcm9wZXJ0eSB7Tm9kZUxpc3R9XG4gICAgICovXG4gICAgdGhpcy5tb2R1bGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChTRUxFQ1RPUlMuREFUQV9WSVNJQkxFKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmQgZXZlbnQgaGFuZGxlcnMgd2l0aCB0aGUgcHJvcGVyIGNvbnRleHQgb2YgYHRoaXNgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0dXBIYW5kbGVycygpIHtcbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYG9uU2Nyb2xsYCBmdW5jdGlvbiB3aXRoIHRoZSBwcm9wZXJcbiAgICAgKiBjb250ZXh0IGJvdW5kIHRvIHRoZSBJblZpZXdwb3J0IGNsYXNzLlxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICB0aGlzLm9uU2Nyb2xsSGFuZGxlciA9IHRoaXMub25TY3JvbGwuYmluZCh0aGlzKTtcblxuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgdXBkYXRlTW9kdWxlc2AgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyXG4gICAgICogY29udGV4dCBib3VuZCB0byB0aGUgSW5WaWV3cG9ydCBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgdGhpcy5vbk1vZHVsZVVwZGF0ZUhhbmRsZXIgPSB0aGlzLnVwZGF0ZU1vZHVsZXMuYmluZCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBldmVudCBoYW5kbGVycyB0byBlbmFibGUgaW50ZXJhY3Rpb24gd2l0aCB2aWV3XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbmFibGUoKSB7XG4gICAgLy8gQ2FsbCBzY3JvbGwgaGFuZGxlciBvbiBsb2FkIHRvIGdldCBpbml0aWFsIHZpZXdhYmxlIGVsZW1lbnRzXG4gICAgd2luZG93LnNldFRpbWVvdXQodGhpcy5vblNjcm9sbEhhbmRsZXIsIDMwMCk7XG5cbiAgICAvLyBBZGQgdG8gU2Nyb2xsU2VyaXZlIGNhbGxiYWNrc1xuICAgIHRoaXMuU2Nyb2xsU2VydmljZS5hZGRDYWxsYmFjayh0aGlzLm9uU2Nyb2xsSGFuZGxlcik7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLlVQREFURV9JTl9WSUVXUE9SVF9NT0RVTEVTLCB0aGlzLm9uTW9kdWxlVXBkYXRlSGFuZGxlcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHdoaWNoIGxvb3BzIG92ZXIgdGhlIGN1cnJlbnQgbW9kdWxlcyBhbmQgZGV0ZXJtaW5lc1xuICAgKiB3aGljaCBhcmUgY3VycmVudGx5IGluIHRoZSB2aWV3cG9ydC4gRGVwZW5kaW5nIG9uIHdoZXRoZXIgb3JcbiAgICogbm90IHRoZXkgYXJlIHZpc2libGUgYSBkYXRhIGF0dHJpYnV0ZSBib29sZWFuIGlzIHRvZ2dsZWRcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIG9uU2Nyb2xsKCkge1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodGhpcy5tb2R1bGVzLCAobW9kdWxlKSA9PiB7XG4gICAgICBpZiAoaXNzY3JvbGxlZGludG92aWV3KG1vZHVsZSkpIHtcbiAgICAgICAgaWYgKG1vZHVsZS5nZXRBdHRyaWJ1dGUoTUlTQy5EQVRBX1ZJU0lCTEUpID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShNSVNDLkRBVEFfVklTSUJMRSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtb2R1bGUuaGFzQXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX0hBU19BTklNQVRFRCkgJiYgbW9kdWxlLmdldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9CT1RUT00pID09PSAnYWJvdmUtYm90dG9tJykge1xuICAgICAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfSEFTX0FOSU1BVEVELCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1vZHVsZS5nZXRBdHRyaWJ1dGUoTUlTQy5EQVRBX1ZJU0lCTEUpID09PSAndHJ1ZScpIHtcbiAgICAgICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKE1JU0MuREFUQV9WSVNJQkxFLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlY3QgPSBtb2R1bGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBjdXJyZW50RGF0YVBvc2l0aW9uID0gbW9kdWxlLmdldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9QT1NJVElPTik7XG4gICAgICBjb25zdCBjYWxjdWxhdGVkRGF0YVBvc2l0aW9uID0gcmVjdC5ib3R0b20gPCAwID8gQ0xBU1NfTkFNRVMuQUJPVkVfVklFV1BPUlQgOiByZWN0LnRvcCA+PSB3aW5kb3cuaW5uZXJIZWlnaHQgPyBDTEFTU19OQU1FUy5CRUxPV19WSUVXUE9SVCA6IENMQVNTX05BTUVTLklOX1ZJRVdQT1JUO1xuICAgICAgY29uc3QgY2FsY3VsYXRlZEJvdHRvbVBvc2l0aW9uID0gcmVjdC5ib3R0b20gPiB3aW5kb3cuaW5uZXJIZWlnaHQgPyBDTEFTU19OQU1FUy5CRUxPV19CT1RUT00gOiBDTEFTU19OQU1FUy5BQk9WRV9CT1RUT007XG4gICAgICBjb25zdCBoYWxmd2F5UG9zaXRpb24gPSByZWN0LmJvdHRvbSA8PSAod2luZG93LmlubmVySGVpZ2h0IC8gMS4yNSkgPyBDTEFTU19OQU1FUy5BQk9WRV9IQUxGV0FZIDogQ0xBU1NfTkFNRVMuQkVMT1dfSEFMRldBWTtcbiAgICAgIGlmIChjdXJyZW50RGF0YVBvc2l0aW9uICE9PSBjYWxjdWxhdGVkRGF0YVBvc2l0aW9uKSB7XG4gICAgICAgIG1vZHVsZS5zZXRBdHRyaWJ1dGUoU0VMRUNUT1JTLkRBVEFfUE9TSVRJT04sIGNhbGN1bGF0ZWREYXRhUG9zaXRpb24pO1xuICAgICAgfVxuICAgICAgbW9kdWxlLnNldEF0dHJpYnV0ZShTRUxFQ1RPUlMuREFUQV9CT1RUT00sIGNhbGN1bGF0ZWRCb3R0b21Qb3NpdGlvbik7XG4gICAgICBtb2R1bGUuc2V0QXR0cmlidXRlKFNFTEVDVE9SUy5EQVRBX0hBTEZXQVksIGhhbGZ3YXlQb3NpdGlvbik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHdoaWNoIHVwZGF0ZXMgdGhlIGxpc3Qgb2YgZGF0YS12aXNpYmxlIG1vZHVsZXMgYnkgY2FsbGluZyBgY2FjaGVEb21SZWZlcmVuY2VzYCBhbmQgY2FsbHMgYG9uU2Nyb2xsYFxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgdXBkYXRlTW9kdWxlcygpIHtcbiAgICAvLyBjb25zb2xlLmxvZygnc2Nyb2xsJyk7XG4gICAgdGhpcy5jYWNoZURvbVJlZmVyZW5jZXMoKS5vblNjcm9sbCgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQVJJQSwgU0VMRUNUT1JTLCBDTEFTU19OQU1FUywgRVZFTlRTLCBLRVlfQ09ERVMgfSBmcm9tICcuLi8uLi9Db25zdGFudHMnO1xuXG5cbi8qKlxuICogQSBjbGFzcyB3aGljaCBoaWRlcyBhbmQgcmV2ZWFscyBoaWRkZW4gbWVudSBjb250ZW50IGJhc2VkIG9uIHVzZXIgY2xpY2sgb2YgYSBidXR0b24uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5hdiB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgTmF2IHdoaWNoIHNpbXBseSBhc3NpZ25zIHRoZSBTY3JvbGxTZXJ2aWNlXG4gICAqIHRvIGEgcHJvcGVydHkgb24gdGhlIGNvbnRydWN0b3IgZm9yIHJlZmVyZW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFJFUVVJUkVEIC0gdGhlIG1vZHVsZSdzIGNvbnRhaW5lclxuICAgKiBAcGFyYW0ge09iamVjdH0gU2VydmljZXMgdmFyaW91cyBzZXJ2aWNlcywgcGFzc2VkIGluIGFzIHBhcmFtXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBTZXJ2aWNlcyApIHtcbiAgICAvKipcbiAgICAgKiBET00gbm9kZSB0aGF0IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtPYmplY3R9IGVsZW1lbnQgRE9NIG5vZGUgdGhhdCBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSB2aWV3XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHZpZXcgYnkgY2FsbGluZyB0aGUgZnVuY3Rpb25zIHRvXG4gICAqIGNyZWF0ZSBET00gcmVmZXJlbmNlcywgc2V0dXAgZXZlbnQgaGFuZGxlcnMgYW5kXG4gICAqIHRoZW4gY3JlYXRlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBIZWFkZXIgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGluaXQoKSB7XG4gICAgdGhpcy5jYWNoZURvbVJlZmVyZW5jZXMoKVxuICAgICAgLnNldHVwSGFuZGxlcnMoKVxuICAgICAgLmVuYWJsZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2FjaGUgRE9NIFJlZmVyZW5jZXNcbiAgICpcbiAgICogRmluZCBhbGwgbmVjZXNzYXJ5IERPTSBlbGVtZW50cyB1c2VkIGluIHRoZSB2aWV3IGFuZCBjYWNoZSB0aGVtXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gSGVhZGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoZSBjbGFzc1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBjYWNoZURvbVJlZmVyZW5jZXMoKSB7XG4gICAgdGhpcy5uYXZUcmlnZ2VyID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoU0VMRUNUT1JTLk5BVl9UUklHR0VSKTtcbiAgICB0aGlzLnNpdGVOYXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFNFTEVDVE9SUy5TSVRFX05BVik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhlIHByb3BlciBjb250ZXh0IG9mIGB0aGlzYC5cbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBOYXYgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHNldHVwSGFuZGxlcnMoKSB7XG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGBvbkNsaWNrYCBmdW5jdGlvbiB3aXRoIHRoZSBwcm9wZXJcbiAgICAgKiBjb250ZXh0IGJvdW5kIHRvIHRoZSBTVkdTY3JvbGxBbmltYXRpb25zIGNsYXNzLlxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICB0aGlzLm9uQ2xpY2tIYW5kbGVyID0gdGhpcy5vbkNsaWNrLmJpbmQodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgZXZlbnQgaGFuZGxlcnMgdG8gZW5hYmxlIGludGVyYWN0aW9uIHdpdGggdmlld1xuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IE5hdiBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW5hYmxlKCkge1xuICAgIC8vIGhhbmRsZSBuYXYgdHJpZ2dlciBjbGlja1xuICAgIHRoaXMubmF2VHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKEVWRU5UUy5DTElDSywgdGhpcy5vbkNsaWNrSGFuZGxlcik7XG4gICAgdGhpcy5uYXZUcmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoRVZFTlRTLktFWV9ET1dOLCB0aGlzLm9uQ2xpY2tIYW5kbGVyKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihFVkVOVFMuS0VZX0RPV04sIHRoaXMub25DbGlja0hhbmRsZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xsaW5nIGJleW9uZCB0aGUgaGVpZ2h0IG9mIHRoZSBuYXYgd2lsbCB0cmlnZ2VyIGEgY2xhc3MgY2hhbmdlXG4gICAqIGFuZCB2aWNlIHZlcnNhLlxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgb25DbGljaygpIHtcbiAgICBjb25zdCBpc09wZW4gPSB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKENMQVNTX05BTUVTLk9QRU4pO1xuICAgIHRoaXMuaGVhZGVyT3BlbiA9ICFpc09wZW47XG4gICAgaWYgKGV2ZW50LnR5cGUgPT09IEVWRU5UUy5LRVlfRE9XTiAmJiAoXG4gICAgICBldmVudC50YXJnZXQubm9kZU5hbWUubWF0Y2goL2F8aW5wdXR8dGV4dGFyZWF8c2VsZWN0fGJ1dHRvbi9pKSB8fFxuICAgICAgKGlzT3BlbiAmJiBldmVudC5rZXlDb2RlICE9PSBLRVlfQ09ERVMuRVNDQVBFICYmIChldmVudC5rZXlDb2RlICE9PSBLRVlfQ09ERVMuU1BBQ0VCQVIgfHwgZXZlbnQuY3VycmVudFRhcmdldCA9PT0gd2luZG93KSkgfHxcbiAgICAgICghaXNPcGVuICYmIGV2ZW50LmtleUNvZGUgIT09IEtFWV9DT0RFUy5TUEFDRUJBUilcbiAgICApKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC50eXBlID09PSBFVkVOVFMuS0VZX0RPV04gJiYgZXZlbnQua2V5Q29kZSA9PT0gS0VZX0NPREVTLlNQQUNFQkFSKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5uYXZUcmlnZ2VyLmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5zaXRlTmF2LmNsYXNzTGlzdC50b2dnbGUoQ0xBU1NfTkFNRVMuT1BFTik7XG4gICAgdGhpcy5uYXZUcmlnZ2VyLnNldEF0dHJpYnV0ZShBUklBLkVYUEFOREVELCBpc09wZW4pO1xuICAgIHRoaXMuc2l0ZU5hdi5zZXRBdHRyaWJ1dGUoQVJJQS5ISURERU4sIGlzT3Blbik7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKENMQVNTX05BTUVTLk9QRU5FRCk7XG4gIH1cblxufVxuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG4ndXNlIHN0cmljdCc7XG5cbi8vIEZvdW5kYXRpb24gQ29yZVxuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24uY29yZS5qcyc7XG4vLyBGb3VuZGF0aW9uIFV0aWxpdGllc1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5ib3guanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5rZXlib2FyZC5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMnO1xuaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24udXRpbC5uZXN0LmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyc7XG5pbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnMuanMnO1xuLy8gRm91bmRhdGlvbiBQbHVnaW5zLiBBZGQgb3IgcmVtb3ZlIGFzIG5lZWRlZCBmb3IgeW91ciBzaXRlXG4vLyBpbXBvcnQgJ2ZvdW5kYXRpb24tc2l0ZXMvanMvZm91bmRhdGlvbi5kcmlsbGRvd24uanMnO1xuLy8gaW1wb3J0ICdmb3VuZGF0aW9uLXNpdGVzL2pzL2ZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzJztcbi8vIGltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51LmpzJztcbmltcG9ydCAnZm91bmRhdGlvbi1zaXRlcy9qcy9mb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyc7XG5cbmltcG9ydCBqcXVlcnkgZnJvbSAnanF1ZXJ5Jztcbi8vIGltcG9ydCBwcmVwSW5wdXRzIGZyb20gJ21vZHVsZXMvcHJlcGlucHV0cy5qcyc7XG5pbXBvcnQgc29jaWFsU2hhcmUgZnJvbSAnbW9kdWxlcy9zb2NpYWxTaGFyZS5qcyc7XG4vLyBpbXBvcnQgY2Fyb3VzZWwgZnJvbSAnbW9kdWxlcy9jYXJvdXNlbC5qcyc7XG5cbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAnO1xuXG4oZnVuY3Rpb24oJCkge1xuICAvLyBJbml0aWFsaXplIEZvdW5kYXRpb25cbiAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xuXG4gIC8vIFByZXBhcmUgZm9ybSBpbnB1dHNcbiAgLy8gcHJlcElucHV0cygpO1xuICAvLyBJbml0aWFsaXplIHNvY2lhbCBzaGFyZSBmdW5jdGlvbmFsaXR5XG4gIC8vIFJlcGxhY2UgdGhlIGVtcHR5IHN0cmluZyBwYXJhbWV0ZXIgd2l0aCB5b3VyIEZhY2Vib29rIElEXG4gIHNvY2lhbFNoYXJlKCcnKTtcblxuICAvLyBBdHRhY2ggQXBwIHRvIHRoZSB3aW5kb3dcbiAgd2luZG93LkFwcCA9IG5ldyBBcHAoKTtcbn0pKGpxdWVyeSk7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnanF1ZXJ5JztcblxuY29uc3Qgc29jaWFsU2hhcmUgPSBmdW5jdGlvbihmYklkKSB7XG4gIGNvbnN0ICRib2R5ID0gJCgnYm9keScpO1xuXG4gIC8vIEZhY2Vib29rIHNoYXJpbmcgd2l0aCB0aGUgU0RLXG4gICQuZ2V0U2NyaXB0KCcvL2Nvbm5lY3QuZmFjZWJvb2submV0L2VuX1VTL3Nkay5qcycpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgJGJvZHkub24oJ2NsaWNrLnNoYXJlci1mYicsICcuc2hhcmVyLWZiJywgZnVuY3Rpb24oZSkge1xuICAgICAgY29uc3QgJGxpbmsgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICBtZXRob2Q6ICdmZWVkJyxcbiAgICAgICAgZGlzcGxheTogJ3BvcHVwJyxcbiAgICAgIH07XG4gICAgICBjb25zdCBuZXdVcmwgPSAkbGluay5kYXRhKCdyZWRpcmVjdC10bycpID9cbiAgICAgICAgICAkbGluay5kYXRhKCdyZWRpcmVjdC10bycpIDogbnVsbDtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB3aW5kb3cuRkIuaW5pdCh7XG4gICAgICAgIGFwcElkOiBmYklkLFxuICAgICAgICB4ZmJtbDogZmFsc2UsXG4gICAgICAgIHZlcnNpb246ICd2Mi4wJyxcbiAgICAgICAgc3RhdHVzOiBmYWxzZSxcbiAgICAgICAgY29va2llOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCd0aXRsZScpKSB7XG4gICAgICAgIG9wdGlvbnMubmFtZSA9ICRsaW5rLmRhdGEoJ3RpdGxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCd1cmwnKSkge1xuICAgICAgICBvcHRpb25zLmxpbmsgPSAkbGluay5kYXRhKCd1cmwnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRsaW5rLmRhdGEoJ3BpY3R1cmUnKSkge1xuICAgICAgICBvcHRpb25zLnBpY3R1cmUgPSAkbGluay5kYXRhKCdwaWN0dXJlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpKSB7XG4gICAgICAgIG9wdGlvbnMuZGVzY3JpcHRpb24gPSAkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cuRkIudWkob3B0aW9ucywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKG5ld1VybCkge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gVHdpdHRlciBzaGFyaW5nXG4gICRib2R5Lm9uKCdjbGljay5zaGFyZXItdHcnLCAnLnNoYXJlci10dycsIGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCAkbGluayA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICBjb25zdCB1cmwgPSAkbGluay5kYXRhKCd1cmwnKTtcbiAgICBjb25zdCB0ZXh0ID0gJGxpbmsuZGF0YSgnZGVzY3JpcHRpb24nKTtcbiAgICBjb25zdCB2aWEgPSAkbGluay5kYXRhKCdzb3VyY2UnKTtcbiAgICBsZXQgdHdpdHRlclVSTCA9IGBodHRwczovL3R3aXR0ZXIuY29tL3NoYXJlP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh1cmwpfWA7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAodGV4dCkge1xuICAgICAgdHdpdHRlclVSTCArPSBgJnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQodGV4dCl9YDtcbiAgICB9XG4gICAgaWYgKHZpYSkge1xuICAgICAgdHdpdHRlclVSTCArPSBgJnZpYT0ke2VuY29kZVVSSUNvbXBvbmVudCh2aWEpfWA7XG4gICAgfVxuICAgIHdpbmRvdy5vcGVuKHR3aXR0ZXJVUkwsICd0d2VldCcsXG4gICAgICAgICd3aWR0aD01MDAsaGVpZ2h0PTM4NCxtZW51YmFyPW5vLHN0YXR1cz1ubyx0b29sYmFyPW5vJyk7XG4gIH0pO1xuXG4gIC8vIExpbmtlZEluIHNoYXJpbmdcbiAgJGJvZHkub24oJ2NsaWNrLnNoYXJlci1saScsICcuc2hhcmVyLWxpJywgZnVuY3Rpb24oZSkge1xuICAgIGNvbnN0ICRsaW5rID0gJChlLnRhcmdldCk7XG4gICAgY29uc3QgdXJsID0gJGxpbmsuZGF0YSgndXJsJyk7XG4gICAgY29uc3QgdGl0bGUgPSAkbGluay5kYXRhKCd0aXRsZScpO1xuICAgIGNvbnN0IHN1bW1hcnkgPSAkbGluay5kYXRhKCdkZXNjcmlwdGlvbicpO1xuICAgIGNvbnN0IHNvdXJjZSA9ICRsaW5rLmRhdGEoJ3NvdXJjZScpO1xuICAgIGxldCBsaW5rZWRpblVSTCA9ICdodHRwczovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlP21pbmk9dHJ1ZSZ1cmw9JyArXG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBsaW5rZWRpblVSTCArPSBgJnRpdGxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpdGxlKX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaW5rZWRpblVSTCArPSAnJnRpdGxlPSc7XG4gICAgfVxuXG4gICAgaWYgKHN1bW1hcnkpIHtcbiAgICAgIGxpbmtlZGluVVJMICs9XG4gICAgICAgICAgYCZzdW1tYXJ5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHN1bW1hcnkuc3Vic3RyaW5nKDAsIDI1NikpfWA7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgbGlua2VkaW5VUkwgKz0gYCZzb3VyY2U9JHtlbmNvZGVVUklDb21wb25lbnQoc291cmNlKX1gO1xuICAgIH1cblxuICAgIHdpbmRvdy5vcGVuKGxpbmtlZGluVVJMLCAnbGlua2VkaW4nLFxuICAgICAgICAnd2lkdGg9NTIwLGhlaWdodD01NzAsbWVudWJhcj1ubyxzdGF0dXM9bm8sdG9vbGJhcj1ubycpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNvY2lhbFNoYXJlO1xuIl19
