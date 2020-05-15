/**
 * Looks for ancestor elemnt with given selector
 *
 * @param {HTMLElement} elem the elemnt to test
 * @param {String} selector the selector you're looking for
 * @return {HTMLElement} element The closest element
 */
export function closest(elem, selector) {
  let element = elem;
  const matchesSelector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector;
  while (element) {
    if (matchesSelector.call(element, selector)) {
      break;
    }
    element = element.parentElement;
  }
  return element;
}
