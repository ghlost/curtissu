'use strict';

import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, KEY_CODES } from '../../Constants';
import { getcookie } from '../../Utils';


/**
 * A class which hides and reveals hidden menu content based on user click of a button.
 */
export default class Video {
  /**
   * Constructor for Video which simply assigns the ScrollService
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
    console.log(getcookie('video'))
    if(getcookie('video') !== 'true') {
      this.cacheDomReferences()
        .setupHandlers()
        .enable();

        
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
   */
  cacheDomReferences() {
    this.content = this.element.querySelector('.video__content');

    return this;
  }

  /**
   * Bind event handlers with the proper context of `this`.
   *
   * @return {Object} Video A reference to the current instance of the class
   * @chainable
   */
  setupHandlers() {
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
   */
  enable() {
    // handle Video trigger click
    this.element.addEventListener(EVENTS.CLICK, this.onClickHandler);
    this.element.addEventListener(EVENTS.KEY_DOWN, this.onClickHandler);

    return this;
  }

  /**
   * Clicking the content will cause it to be removed from sight
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onClick() {
    event.preventDefault();
    this.element.classList.add('fade');
    document.body.classList.remove('video-open');
  }
}
