'use strict';

import { MessageBus } from '../../Utils';

/**
 * The Controller base class
 *
 * @class Controller
 */
export default class Controller extends MessageBus {
  /**
   * Constructor function of the Controller class.
   */
  constructor() {
    super();
  }

  /**
   * Request
   *
   * Calls the request method in super class
   * @param {String} url - a url from which to fetch
   * @param {String} arg - arguments, if any
   * @return {Object} result of the request
   */
  request(url, arg) {
    const args = typeof arg !== 'undefined' ? arg : {method: 'GET'};
    return fetch(url, args ).then((response) =>
      response.json().then((data) => ({
        data: data,
        headers: response.headers,
        status: response.status
      })
      ).then((res) => {
        return res;
      }));
  }

}
