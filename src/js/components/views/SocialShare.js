'use strict';

import { openpopup } from '../../Utils';
import { EVENTS, MISC, SELECTORS } from '../../Constants';

/**
 * OGINFO
 *
 * An object containing OG tag data pulled from og tags
 *
 * @type {Object}
 * @ignore
 */
const OGINFO = {
  DESC: '',
  URL: '',
  TITLE: ''
};


/**
 * The SocialShare module which handles the social share buttons
 *
 * @class SocialShare
 */
export default class SocialShare {
  /**
   * SocialShare constructor which assigns the element passed into the constructor
   * to the `this.element` property for later reference
   *
   * @param {HTMLElement} element - REQUIRED - the module's container
   */
  constructor(element) {
    /**
     * Reference to the DOM element that is the root of the component
     * @property {Object}
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
   * @return {Object} SocialShare A reference to the instance of the class
   * @chainable
   */
  init() {
    this.cacheDomReferences()
      .getOGData()
      .enable();

    return this;
  }

  /**
   * Find all necessary DOM elements used in the view and cache them
   *
   * @return {Object} SocialShare A reference to the instance of the class
   * @chainable
   */
  cacheDomReferences() {

    /**
     * The `<button>` that a user interacts with to share to a social site
     * @type {Object}
     */
    this.share = {
      twitter :this.element.querySelector(SELECTORS.TWITTER),
      facebook: this.element.querySelector(SELECTORS.FACEBOOK),
      email: this.element.querySelector(SELECTORS.EMAIL)
    };

    return this;
  }

  /**
   * Get OG data from page's OG tags
   * Set defaults if no tags available
   *
   * @return {Object} SocialShare A reference to the instance of the class
   * @chainable
   */
  getOGData() {

    Object.keys(OGINFO).forEach((key) => {
      const node = document.querySelector(SELECTORS['OG' + key]);
      if (node) {
        OGINFO[key] = node.getAttribute('content');
      }
    });

    return this;
  }

  /**
   * Creates event listeners to enable interaction with view
   *
   * @return {Object} SocialShare A reference to the instance of the class
   * @chainable
   */
  enable() {
    Object.keys(this.share).forEach((shareType) => {
      this.share[shareType].addEventListener(EVENTS.CLICK, this[shareType + 'Share']);
    });

    return this;
  }

  /**
   * Facebook share on click
   * @param {Event} event - the click event
   */
  facebookShare(event) {
    event.preventDefault();
    const shareURL = MISC.fURL1 + OGINFO.URL;
    openpopup(shareURL, 'FacebookShare', 560, 600);
  }

  /**
   * Twitter share on click
   * @param {Event} event - the click event
   */
  twitterShare(event) {
    event.preventDefault();
    const shareURL = MISC.tURL1 + OGINFO.URL + MISC.tURLText + encodeURIComponent(OGINFO.DESC) + MISC.tURLVia;
    openpopup(shareURL, 'TwitterShare', 560, 300);
  }

  /**
   * Send email thorough mailto on click
   *
   */
  emailShare() {
    event.preventDefault();

    const shareURL = MISC.mURL1 + MISC.mURL2 + OGINFO.TITLE + MISC.mURL3 + OGINFO.DESC + ' ' + OGINFO.URL;

    window.open(shareURL, 'Emal');
  }

}
