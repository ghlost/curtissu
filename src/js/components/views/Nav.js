'use strict';

import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, KEY_CODES } from '../../Constants';


/**
 * A class which hides and reveals hidden menu content based on user click of a button.
 */
export default class Nav {
  /**
   * Constructor for Nav which simply assigns the ScrollService
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
    this.navTrigger = this.element.querySelector(SELECTORS.NAV_TRIGGER);
    this.siteNav = document.querySelector(SELECTORS.SITE_NAV);

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
   */
  enable() {
    // handle nav trigger click
    this.navTrigger.addEventListener(EVENTS.CLICK, this.onClickHandler);
    this.navTrigger.addEventListener(EVENTS.KEY_DOWN, this.onClickHandler);
    window.addEventListener(EVENTS.KEY_DOWN, this.onClickHandler);

    return this;
  }

  /**
   * Scrolling beyond the height of the nav will trigger a class change
   * and vice versa.
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onClick() {
    const isOpen = this.element.classList.contains(CLASS_NAMES.OPEN);
    this.headerOpen = !isOpen;
    if (event.type === EVENTS.KEY_DOWN && (
      event.target.nodeName.match(/a|input|textarea|select|button/i) ||
      (isOpen && event.keyCode !== KEY_CODES.ESCAPE && (event.keyCode !== KEY_CODES.SPACEBAR || event.currentTarget === window)) ||
      (!isOpen && event.keyCode !== KEY_CODES.SPACEBAR)
    )) {
      return;
    }
    if (event.type === EVENTS.KEY_DOWN && event.keyCode === KEY_CODES.SPACEBAR) {
      return;
    }
    event.preventDefault();
    this.element.classList.toggle(CLASS_NAMES.OPEN);
    this.navTrigger.classList.toggle(CLASS_NAMES.OPEN);
    this.siteNav.classList.toggle(CLASS_NAMES.OPEN);
    this.navTrigger.setAttribute(ARIA.EXPANDED, isOpen);
    this.siteNav.setAttribute(ARIA.HIDDEN, isOpen);
    document.body.classList.toggle(CLASS_NAMES.OPENED);
  }

}
