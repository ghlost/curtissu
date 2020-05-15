'use strict';

import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, KEY_CODES } from '../../Constants';
import { scrollto } from '../../Utils';

/**
 * A class which hides and reveals hidden menu content based on user click of a button.
 */
export default class Anchor {
  /**
   * Constructor for Anchor which simply assigns the ScrollService
   * to a property on the contructor for reference.
   *
   * @param {HTMLElement} element - REQUIRED - the module's container
   */
  constructor(element) {
    /**
     * DOM node that is passed into the constructor
     *
     * @property {Object} element DOM node that is passed into the constructor
     */
    this.element = element;

    /**
     * amount to set the scroll of offset
     *
     * @property {Number}
     */
    this.offset = 100;

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
    this.cacheDomReferences()
      .setupHandlers()
      .enable();

    return this;
  }

  /**
   * Cache DOM References
   *
   * Find all necessary DOM elements used in the view and cache them
   *
   * @return {Object} Header A reference to the current instance of the class
   * @chainable
   */
  cacheDomReferences() {
    this.body = document.querySelector('body');

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
     * A reference to the `scrollTo` function with the proper
     * context bound to the SVGScrollAnimations class.
     *
     * @property {Function}
     */
    this.onClickHandler = this.scrollTo.bind(this);

    return this;
  }

  /**
   * Create event handlers to enable interaction with view
   *
   * @return {Object} Nav A reference to the current instance of the class
   * @chainable
   */
  enable() {
    this.element.addEventListener(EVENTS.CLICK, this.onClickHandler);

    return this;
  }

  /**
   * Scrolling beyond the height of the nav will trigger a class change
   * and vice versa.
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  scrollTo(event) {
    scrollto(event, this.element, this.offset);
    return this;
  }
}
