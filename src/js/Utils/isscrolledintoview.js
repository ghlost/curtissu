/**
 * A function which measures the elements position on the page in
 * relation to the what the user can currently see on their screen
 * and returns a boolean value with `true` being that the element
 * is visible and `false` being that it is not visible.
 *
 * @param  {Object}  elem A DOM element
 * @return {Boolean} isVisible A boolean value with `true` representing that the element is visible
 */
export function isscrolledintoview(elem) {
  const elementBounds = elem.getBoundingClientRect();
  return elementBounds.top < window.innerHeight && elementBounds.bottom >= 0;
}

