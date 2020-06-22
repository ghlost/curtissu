'use strict';

import { EVENTS } from '../../Constants';

/**
 * A class that shows the first file uploaded to file field on matching label
 */
export default class File {
  /**
   * Constructor for File
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
    this.file = document.getElementById(this.element.getAttribute('for'));

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
    this.onChangeHandler = this.onChange.bind(this);

    return this;
  }

  /**
   * Create event handlers to enable interaction with view
   *
   * @return {Object} Nav A reference to the current instance of the class
   * @chainable
   */
  enable() {
    this.file.addEventListener(EVENTS.CHANGE, this.onChangeHandler);

    return this;
  }

  /**
   * Changing file uploaded will replace the name
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onChange(event) {
    console.log('changed');

    this.element.innerText = this.file.files.length > 0 ? this.file.files[0].name : 'Any Attachment?';

    return this;
  }
}
