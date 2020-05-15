'use strict';

import 'core-js/features/array/from';
import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, MISC } from '../../Constants';

/**
 * A class which binds events to a form and controls the form elements
 */
export default class Form {
  /**
   * Constructor for Form which will control the submit funcionality
   * and the thank you message display
   *
   * @param {HTMLElement} element - REQUIRED - the form itself
   */
  constructor(element) {
    /**
     * DOM node that is passed into the constructor
     *
     * @property {Object} element DOM node that is passed into the constructor
     */
    this.element = element;

    /**
     * a flag indicating if the form is Valid
     *
     * @property {Boolean}
     */
    this.isValid = false;

    /**
     * a flag indicating if the form is submitted
     *
     * @property {Boolean}
     */
    this.isSubmitted = false;

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
    this.button = this.element.querySelector(SELECTORS.BUTTON);
    this.formFields = this.element.querySelectorAll(SELECTORS.FORM_FIELDS);

    return this;
  }

  /**
   * Bind event handlers with the proper context of `this`.
   *
   * @return {Object} A reference to the current instance of the class
   * @chainable
   */
  setupHandlers() {
    /**
     * A reference to the `onSubmit` function with the proper
     * context bound to the Form class.
     *
     * @property {Function}
     */
    this.onSubmitHandler = this.onSubmit.bind(this);
    this.onChangeHandler = this.triggerValidInvalid.bind(this);

    return this;
  }

  /**
   * Create event handlers to enable interaction with view
   *
   * @return {Object} From A reference to the current instance of the class
   * @chainable
   */
  enable() {
    // submission event
    this.element.addEventListener(EVENTS.SUBMIT, this.onSubmitHandler, false);

    const formFields = Array.from(this.formFields);
    formFields.forEach(item => item.addEventListener(EVENTS.CHANGE, () => {(this.onChangeHandler(event, item));}, false));

    return this;
  }

  /**
   * Event for inputs on change to detect if valid or invalid and
   * add a class based on that.
   *
   * @param {Event} the event that's attached here
   * @param {HTMLElement} element - REQUIRED - the input
   * @return {Object} A reference to the current instance of the class
   * @chainable
   */
  triggerValidInvalid(event, element) {
    if(element.checkValidity()) {
      element.classList.add(CLASS_NAMES.VALID);
      element.classList.remove(CLASS_NAMES.INVALID);
    } else {
      element.classList.remove(CLASS_NAMES.VALID);
      element.classList.add(CLASS_NAMES.INVALID);
    }

    return this;
  }

  /**
   * Turn form fields into serialized data
   *
   * @return {String} serialized data
   */
  serialize() {
    const formFields = Array.from(this.formFields);
    const serializedArray = [];

    // Filter array to used/usable and named fields
    const namedformFields = formFields.filter( item => {
      if (item.name && !item.disabled && item.type !== 'file' && item.type !== 'reset' && item.type !== 'submit' && item.type !== 'button') return item;
    });

    // check for multiselect, or checked radios/checkboxes
    namedformFields.forEach((item) => {
      // If a multi-select, get all selections
      if (item.type === 'select-multiple') {
        for (let i = 0; i < item.options.length; i++) {
          if (!item.options[i].selected) continue;
          serializedArray.push(encodeURIComponent(item.name) + "=" + encodeURIComponent(item.options[i].value));
        }
      }
      // Push to the array
      else if ((item.type !== 'checkbox' && item.type !== 'radio') || item.checked) {
        serializedArray.push(encodeURIComponent(item.name) + "=" + encodeURIComponent(item.value));
      }
    });

    // make it look like form-urlencoded by joining with &
    return serializedArray.join('&');
  }

  /**
   * Submit the form, assuming the form is valid and
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onSubmit(event) {
    event.preventDefault();
    this.button.setAttribute(MISC.DISABLED, MISC.DISABLED);
    this.buttonText = this.button.textContent;
    this.button.textContent = MISC.BUTTON_PROCESSING;
    this.button.classList.add(CLASS_NAMES.BUTTON_SUBMITTING);
    this.formData = this.serialize();
    const that = this;

    fetch(that.element.attributes.action.value, {
        method: 'POST',
        body: that.formData,
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      .then(res => res.json())
      .then(response => {
        console.log('Success:', JSON.stringify(response));
        that.isSubmitted = true;
        that.element.classList.add(CLASS_NAMES.SUBMITTED);
        that.button.textContent = MISC.BUTTON_SUBMITTED;
        that.button.classList.remove(CLASS_NAMES.BUTTON_SUBMITTING);
        that.button.classList.add(CLASS_NAMES.BUTTON_SUBMITTED);
      })
      .catch(error => {
        console.error('Error:', error);
        that.button.removeAttribute(MISC.DISABLED);
        that.button.classList.add(CLASS_NAMES.BUTTON_SUBMITTING);
        that.button.textContent = that.buttonText;
      });

    return this;
  }
}
