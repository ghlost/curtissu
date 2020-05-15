/**
 * A function that takes a length and
 * returns a random string
 *
 * @param  {Number} length of the random string
 * @return {String} random string
 */
export function randomsecurestring(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}