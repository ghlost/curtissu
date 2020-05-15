'use strict';

import { isscrolledintoview } from '../../Utils';
import { CLASS_NAMES, EVENTS, MISC, SELECTORS } from 'Constants';

/**
 * In Viewport
 */
export default class InViewport {
  /**
   * Constructor for inviewport which simply assigns the ScrollService
   * to a property on the contructor for reference.
   *
   * @param {Object} Services various services, passed in as param
   */
  constructor(Services) {
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
   */
  init() {
    this.cacheDomReferences()
      .setupHandlers()
      .enable();

    return this;
  }

  /**
   * Find all necessary DOM elements used in the view and cache them
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  cacheDomReferences() {
    /**
     * All DOM elements with the `data-visible` attribute
     * @property {NodeList}
     */
    this.modules = document.querySelectorAll(SELECTORS.DATA_VISIBLE);

    return this;
  }

  /**
   * Bind event handlers with the proper context of `this`.
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  setupHandlers() {
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
   */
  enable() {
    // Call scroll handler on load to get initial viewable elements
    window.setTimeout(this.onScrollHandler, 300);

    // Add to ScrollSerive callbacks
    this.ScrollService.addCallback(this.onScrollHandler);

    document.body.addEventListener(EVENTS.UPDATE_IN_VIEWPORT_MODULES, this.onModuleUpdateHandler);

    return this;
  }

  /**
   * A function which loops over the current modules and determines
   * which are currently in the viewport. Depending on whether or
   * not they are visible a data attribute boolean is toggled
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onScroll() {
    Array.prototype.forEach.call(this.modules, (module) => {
      if (isscrolledintoview(module)) {
        if (module.getAttribute(MISC.DATA_VISIBLE) === 'false') {
          module.setAttribute(MISC.DATA_VISIBLE, true);
        }
        if (!module.hasAttribute(SELECTORS.DATA_HAS_ANIMATED) && module.getAttribute(SELECTORS.DATA_BOTTOM) === 'above-bottom') {
          module.setAttribute(SELECTORS.DATA_HAS_ANIMATED, true);
        }
      } else {
        if (module.getAttribute(MISC.DATA_VISIBLE) === 'true') {
          module.setAttribute(MISC.DATA_VISIBLE, false);
        }
      }
      const rect = module.getBoundingClientRect();
      const currentDataPosition = module.getAttribute(SELECTORS.DATA_POSITION);
      const calculatedDataPosition = rect.bottom < 0 ? CLASS_NAMES.ABOVE_VIEWPORT : rect.top >= window.innerHeight ? CLASS_NAMES.BELOW_VIEWPORT : CLASS_NAMES.IN_VIEWPORT;
      const calculatedBottomPosition = rect.bottom > window.innerHeight ? CLASS_NAMES.BELOW_BOTTOM : CLASS_NAMES.ABOVE_BOTTOM;
      const halfwayPosition = rect.bottom <= (window.innerHeight / 1.25) ? CLASS_NAMES.ABOVE_HALFWAY : CLASS_NAMES.BELOW_HALFWAY;
      if (currentDataPosition !== calculatedDataPosition) {
        module.setAttribute(SELECTORS.DATA_POSITION, calculatedDataPosition);
      }
      module.setAttribute(SELECTORS.DATA_BOTTOM, calculatedBottomPosition);
      module.setAttribute(SELECTORS.DATA_HALFWAY, halfwayPosition);
    });

    return this;
  }

  /**
   * A function which updates the list of data-visible modules by calling `cacheDomReferences` and calls `onScroll`
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  updateModules() {
    // console.log('scroll');
    this.cacheDomReferences().onScroll();

    return this;
  }
}
