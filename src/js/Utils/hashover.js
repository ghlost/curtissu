import { MISC } from '../Constants';

/**
 * Returns a Boolean corrsponding to whether or not the device/browser
 * in use is capable of hover events
 *
 * @return {Boolean} true if device is hover event-capable; false if not
 */
export function hashover() {
  const hoverQuery = window.matchMedia(MISC.MQ_HOVER);
  const anyQuery = window.matchMedia(MISC.MQ_NO_ANY);
  return (hoverQuery.matches || !anyQuery.matches) ? true : false;
}

