'use strict';

import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, MISC } from '../../Constants';
import Glide from '@glidejs/glide'


/**
 * A class which hides and reveals hidden menu content based on user click of a button.
 */
export default class Slider {
  /**
   * Constructor for Slider which simply assigns the ResizeService
   * to a property on the contructor for reference.
   *
   * @param {HTMLElement} element - REQUIRED - the module's container
   * @param {Object} Services various services, passed in as param
   */
  constructor(element, Services ) {
    /**
     * DOM node that is passed into the constructor
     *
     * @property {Object} element DOM node that is passed into the constructor
     */
    this.element = element;

    /**
     * Reference to the ResizeService singleton
     * @property {Object}
     */
    this.ResizeService = Services.ResizeService;

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
   */
  init() {
    this.setupHandlers()
      .enable();

    if(window.innerWidth <= MISC.LARGE) {
      this.glide = new Glide('.glide', {
        perView: 1
      }).mount()
    }

    return this;
  }

  /**
   * Bind event handlers with the proper context of `this`.
   *
   * @return {Object} Nav A reference to the current instance of the class
   * @chainable
   */
  setupHandlers() {
    /**
     * A reference to the `onScroll` function with the proper
     * context bound to the SVGScrollAnimations class.
     *
     * @property {Function}
     */
    this.onResizeHandler = this.onResize.bind(this);

    return this;
  }

  /**
   * Create event handlers to enable interaction with view
   *
   * @return {Object} Nav A reference to the current instance of the class
   * @chainable
   */
  enable() {
    window.setTimeout(this.onResizeHandler, 300);

    // Add to ScrollSerive callbacks
    this.ResizeService.addCallback(this.onResizeHandler);

    return this;
  }

  /**
   * Resizing a window under large should create a slider,
   * large or over should break the slider out.
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onResize() {
    if(window.innerWidth < MISC.LARGE && this.glide === undefined) {
      this.glide = new Glide('.glide').mount()
    } else if(window.innerWidth >= MISC.LARGE && this.glide) {
      this.glide.destroy();
      this.glide = undefined;
    }

    return this;
  }

}
