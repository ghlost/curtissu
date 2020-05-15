import { CLASS_NAMES, SELECTORS } from '../Constants';

/**
 * Add DOM element for loading graphic to passed-in element
 *
 * @param {HTMLElement} element the element to which to add the loader
 */
export function createloader(element) {
  const loader = document.createElement(SELECTORS.DIV);
  loader.appendChild(document.createTextNode(CLASS_NAMES.LOADING));
  loader.classList.add(CLASS_NAMES.LOADING);
  element.appendChild(loader);
}

/**
 * Remove DOM element for loading graphic from passed-in element
 *
 * @param {HTMLElement} element the element from which to remove the loader
 */
export function removeloader(element) {
  const loader = element.querySelector(SELECTORS.LOADING);
  element.removeChild(loader);
}

