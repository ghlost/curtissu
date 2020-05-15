'use strict';

import InViewport from './components/views/InViewport';
import ComponentMap from './ComponentMap';
import Services from './components/services';

/**
 * The top-level controller for the whole page. This component is responsible
 * for loading other controllers and views.
 */
export default class App {
  /**
   * Initialize all global JS components and call `loadcomponents`
   * to initialize all unique JS components
   */
  constructor() {
    /**
     * Services is the object which holds references to all services
     * created for pages. Services should be instantiated there and
     * then will be injected into each component for optional use via the
     * `loadcomponents` function
     *
     * @type {Services}
     * @property {Services}
     */
    this.Services = new Services();

    /**
     * The InViewport view component which needs to run globally for all components.
     * @type {InViewport}
     * @property {InViewport}
     */
    this.inViewport = new InViewport(this.Services);

    // Load each component
    this.loadPagecomponents();
  }

  /**
   * This function loops over all elements in the DOM with the
   * `data-loadcomponent` attribute and loads the specified view
   * or controller.
   *
   * To attach a JS component to an HTML element, in your markup you'd
   * do something like: <section class="example-component" data-loadcomponent='Examplecomponent'>
   * where 'Examplecomponent' is your JS class name. You'd need to add that component to the ./componentMap.js
   * and make sure the component exists and is a proper ES6 class, and then you'll end up with
   * an ES6 class that is passed a reference to section.example-component on init.
   */
  loadPagecomponents() {
    const attribute = 'data-loadcomponent';
    Array.prototype.forEach.call(document.querySelectorAll('[' + attribute + ']'), (element) => {
      console.log('loading component ', element.getAttribute(attribute));
      new ComponentMap[element.getAttribute(attribute)](element, this.Services);
    });
  }

}
