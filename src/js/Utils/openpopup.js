/**
 * A function which opens a popup window
 *
 * @param  {String} url the url to open in the popup
 * @param  {String} windowName a unique name for the popup
 * @param  {Integer} w the desired width of the popup
 * @param  {Integer} h the desired height of the popup
 * @return {Object} an object the popup function is bound to
 */
export function openpopup(url, windowName, w, h) {
  return window.open(url, windowName,
    'menubar=no,status=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no,width=' + w + ',height=' + h + ''
  );
}
