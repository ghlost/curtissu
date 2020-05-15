'use strict';

// Import services
import ClickService from './ClickService';
import ResizeService from './ResizeService';
import ScrollService from './ScrollService';

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
 */
export default class Services {
  /**
   * Services constructor that instantiates each service individually.
   * To add another services instiate it here.
   */
  constructor() {
    /**
     * A service which listens to the `window` click event and
     * invokes an array of callbacks
     *
     * @property {Object} ClickService A singleton instance of the ClickService class
     */
    this.ClickService = new ClickService();

    /**
     * A service which listens to the `window` resize event and
     * invokes an array of callbacks
     *
     * @property {Object} ResizeService A singleton instance of the ResizeService class
     */
    this.ResizeService = new ResizeService();

    /**
     * A service which listens to the `window` scroll event and
     * invokes an array of callbacks
     *
     * @property {Object} ScrollService A singleton instance of the ScrollService class
     */
    this.ScrollService = new ScrollService();
  }
}
