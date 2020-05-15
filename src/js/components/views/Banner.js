'use strict';

import { MISC, SELECTORS, CLASS_NAMES, EVENTS, KEY_CODES } from '../../Constants';
import { scrollto } from '../../Utils';
import { getcookie } from '../../Utils';


/**
 * A class that will trigger a hiding of the element when
 * the button is clicked to close.
 */
export default class Banner {
  /**
   * Constructor for Banner which simply sets a handler for the closing
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
    this.cookie = getcookie(MISC.BANNER_COOKIE);
    if(!!this.cookie) {
      this.element.classList.add(CLASS_NAMES.HIDDEN);
    } else {
      this.cacheDomReferences()
      .setupHandlers()
      .enable();
      
      document.cookie = `${MISC.BANNER_COOKIE}=${MISC.BANNER_COOKIE_VIEWED};path=/;`;
      this.element.classList.remove(CLASS_NAMES.HIDDEN);
      setTimeout(() => {
        this.element.classList.remove(CLASS_NAMES.CLOSED);
        this.body.classList.add(CLASS_NAMES.BANNER_ACTIVE);
      }, 200);
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
   */
  cacheDomReferences() {
    this.bannerTrigger = this.element.querySelector(SELECTORS.BANNER_TRIGGER);

    this.body = document.querySelector('body');

    this.bannerLink = this.element.querySelector('a');

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
    this.onCloseHandler = this.onClose.bind(this);
    this.onClickLinkHandler = this.onClickLink.bind(this);

    return this;
  }

  /**
   * Create event handlers to enable interaction with view
   *
   * @return {Object} Nav A reference to the current instance of the class
   * @chainable
   */
  enable() {
    // Call scroll handler on load to get initial viewable elements
    this.bannerTrigger.addEventListener(EVENTS.CLICK, this.onCloseHandler, false);
    this.bannerTrigger.addEventListener(EVENTS.KEY_DOWN, this.onCloseHandler, false);

    this.bannerLink.addEventListener(EVENTS.CLICK, this.onClickLinkHandler, false);
    this.bannerLink.addEventListener(EVENTS.KEY_DOWN, this.onClickLinkHandler, false);

    return this;
  }

  /**
   * Add a class to the banner, effectively hiding it,
   * when the close button is clicked.
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onClose(event) {
    if (event.type === EVENTS.KEY_DOWN && event.keyCode !== KEY_CODES.ENTER) {
      return;
    }

    this.element.classList.add(CLASS_NAMES.CLOSED);
    this.body.classList.remove(CLASS_NAMES.BANNER_ACTIVE);

    const that = this;
    setTimeout(() => {
      this.element.classList.remove(CLASS_NAMES.CLOSED);
      that.element.classList.add(CLASS_NAMES.HIDDEN);
    }, 200);

    return this;
  }

  onClickLink(event) {
    scrollto(event, this.bannerLink, 100);
    this.onCloseHandler(event);

    return this;
  }
}
