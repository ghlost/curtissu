/**
 * Returns the cookie or undefined if not found
 * 
 * @param {String} name of the cookie to find
 * @return {Object} cookie based on name passed in
 */
export function getcookie(name) {
  const cookies = {}
  const cookieSet = document.cookie.split('; ');
  cookieSet.forEach(cookie => cookies[cookie.split('=')[0]] = cookie.split('=')[1]);

  return cookies[name];
};