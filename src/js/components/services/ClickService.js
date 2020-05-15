'use strict';

import { EVENTS } from '../../Constants';

/**
 * ID
 *
 * @type {Number}
 * @ignore
 */
let id = 0;

/**
 * Get ID
 *
 * Because file is loaded only once, this function
 * can be used to generate a unique id every time
 * it is called.
 *
 * @return {Number} Unique ID value
 * @ignore
 */
function getId() {
  return id++;
}

/**
 * Click Service
 */
export default class ClickService {
  /**
   * Click Service constructor in which the `callbacks` array is created
   * as a property of the class.
   */
  constructor() {
      /**
       * An array to be populated with callback functions that will be triggered on Click
       *
       * @property {Array} callbacks
       */
      this.callbacks = [];

      this.init();
  }

  /**
  * @desc Initialize the singleton by attaching the event listener to the window
  * @listens {Event} listens to the window Click event
  */
  init() {
      window.addEventListener(EVENTS.CLICK, this.onClick.bind(this));
  }

  /**
  * @desc The click event handler. Iterates through the `callback` array and invokes each callback in the Array
  * @param  {Event} event the event object
  */
  onClick(event) {
      this.callbacks.forEach((callback) => {
          if (callback.isElementMatch) {
              if (event.target === callback.targetElement) {
                  callback.callback(event);
              }
          } else {
              callback.callback(event);
          }
      });
  }

  /**
   * @desc A hook for pushing a callback function
   * into the `callbacks` array. A unique
   * ID value for the callback is generated
   * and a function is returned for removing
   * the callback if need be.
   *
   * @param {HTMLElement} element A reference to the DOM element that triggers the event
   * @param {Function} callback A function to invoke by the ClickService
   * @param {Boolean} isElementMatch A flag used to invert the conditional check for firing the callback
   * @return {Function} `removeCallback` A function which will remove an entry from the `callbacks` array
   */
  addCallback(element, callback, isElementMatch) {
    // Generate an id for the callback
    const id = getId();
    // module can't be undefined because it's as in identifier for the callbacks array.
    const module = element.dataset && element.dataset.loadmodule ? element.dataset.loadmodule : element;
    let flag = false;
    const targetElement = element;

    for (let i = 0; i < this.callbacks.length; i++) {
      if (this.callbacks[i].module === module) {
        flag = true;
      }
    }

    if (!flag) {
      // Push function into array with a unique id
      this.callbacks.push({
        module,
        id,
        targetElement,
        isElementMatch,
        callback
      });
    }

    // Return the remove function
    return this.removeCallback.bind(this, id);
  }

  /**
   * Filters through the `callback` array and removes
   * the entry that corresponds to the id passed
   * in as an argument
   *
   * @param  {Number} id An id value to filter by
   */
  removeCallback(id) {
    this.callbacks = this.callbacks.filter((item) => {
      return item.id !== id;
    });
  }
}
