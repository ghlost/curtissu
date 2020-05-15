'use strict';

import { ARIA, SELECTORS, CLASS_NAMES, EVENTS, MISC, KEY_CODES } from '../../Constants';
import { randomsecurestring } from '../../Utils';
/**
 * A class that creates the functionality for video blocks. A clickable button that expands a player area using the youtube iframe api
 */
export default class Video {
  /**
   * Constructor for Video
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
     * ID of the YT video
     *
     * @property {String}
     */
    this.videoId = this.element.dataset.url;

    /**
     * Create ID for player
     *
     * @property {String}
     */
    this.playerId = 'player-';


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
      .enable()
      .scriptInject();

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
    this.trigger = this.element.querySelector(SELECTORS.PLAY_TRIGGER);
    this.player = this.element.querySelector(SELECTORS.PLAYER);
    this.playerId += randomsecurestring(16);
    this.element.setAttribute('id', this.playerId);

    return this;
  }

  /**
   * scriptInject
   *
   * Pull the YT iframe API if the object doesn't exist
   *
   * @return {Object} A reference to the current instance of the class
   * @chainable
   */
  scriptInject() {
    const tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    return this;
  }

  /**
   * Bind event handlers with the proper context of `this`.
   *
   * @return {Object} A reference to the current instance of the class
   * @chainable
   */
  setupHandlers() {
    this.onButtonClickHandler = this.onButtonClick.bind(this);

    return this;
  }

  /**
   * Create event handlers to enable interaction with view
   *
   * @return {Object} From A reference to the current instance of the class
   * @chainable
   */
  enable() {
    this.trigger.addEventListener(EVENTS.CLICK, this.onButtonClickHandler, false);
    this.trigger.addEventListener(EVENTS.TOUCH_START, this.onButtonClickHandler, false);
    this.trigger.addEventListener(EVENTS.KEY_DOWN, this.onButtonClickHandler, false);

    return this;
  }

  /**
   * Turn form fields into serialized data
   * 
   * @return {String} serialized data
   */
  onYouTubeIframeAPIReady() {
    this.player = new YT.Player(this.playerId, {
      height: '390',
      width: '640',
      videoId: this.videoId,
      events: {
        'onReady': this.onPlayerReady
      }
    });
  }

  onPlayerReady(event) {
    event.target.playVideo();
  }

  /**
   * Click the button
   *
   * @return {Object} A reference to the current instance of this class
   * @chainable
   */
  onButtonClick(event) {
    event.preventDefault();

    if (event.type === EVENTS.KEY_DOWN && (event.keyCode !== KEY_CODES.ENTER)) {
      return this;
    }

    this.element.classList.add('fullscreen');

    const that = this;
    setTimeout(() => {
      that.onYouTubeIframeAPIReady();
    }, 600);

    return this;
  }
}
