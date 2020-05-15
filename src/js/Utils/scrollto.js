/**
 * A function that scrolls to a target on page
 *
 * @param  {Object} event
 * @param  {HTMLNode} element
 * @param  {Integer} offset
 */
export function scrollto(event, element, offset = 0) {
  const hash = element.getAttribute('href').charAt(0) === '#' ? element.getAttribute('href') : undefined;

  if (hash && window.scroll !== undefined) {
    const $target = document.querySelector(hash);
    const targetY = $target.offsetTop - offset;

    event.preventDefault();

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }
}
