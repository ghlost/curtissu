/**
 * Checks if object exists and is populated
 *
 * @param {Object} obj the object to test
 *
 * @return {Boolean} true is empty, false if not
 */
export function isobjectempty(obj) {
  if (typeof obj !== 'undefined') {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  return true;
}


