'use strict';

import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, KEY_CODES } from '../../Constants';

/**
 * A class which updates the link of the tag filters
 */
export default class Filter {
  /**
   * Constructor for Filter which simply assigns the ScrollService
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
      .separateUrlParams()
      .addFiltersToLinks();

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
    this.links = Array.from(this.element.querySelectorAll('.post-filter__term-link'));
    this.search = window.location.search.substring(1);
    return this;
  }

  /**
   * Grab the Url parameters for the search filters
   *
   * @return {Object} This a reference to the class
   * @chainable
   */
  separateUrlParams() {
    this.searchArray = this.search.split('&');
    this.searchObj = {};
    this.searchArray.forEach(paramKeyValue => {
      const param = paramKeyValue.split('=');
      this.searchObj[param[0]] = param[1];
    });

    if(this.searchObj.tag) {
      this.searchTags = this.searchObj.tag.split('%2C');
      this.activeFilters();
    }

    return this;
  }

  /**
   * Set the link elements a class of active
   *
   * @return {Object} This a reference to the class
   * @chainable
   */
  activeFilters() {
    this.searchTags.forEach(tag => {
      this.links.forEach(link => {
        if (link.dataset.tag === tag) {
          link.classList.add('post-filter__term-link--active');
        }
      });
    })
    return this;
  }

  /**
   * Update filter link to append filter to the list if there
   *
   * @return {Object} This a reference to the class
   * @chainable
   */
  addFiltersToLinks() {
    // root search state but also used to set search param properly
    if(this.searchObj.s) {
      this.links.forEach((link) => {
        link.href = `?s=${this.searchObj.s}&tag=${link.dataset.tag}`;
      });
    }

    // once a filter has been clicked
    if(this.searchObj.tag) {
      this.links.forEach((link) => {
        let tagSet = [...this.searchTags]
        if (this.searchTags.includes(link.dataset.tag)) {
          tagSet.splice(this.searchTags.indexOf(link.dataset.tag), 1);
        } else {
          tagSet.push(link.dataset.tag);
        }
        link.href = `?s=${this.searchObj.s}&tag=${tagSet.join('%2C')}`;
      });
    }

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
