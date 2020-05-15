/**
 * A function which moves from one value to another by a certain percent
 *
 * @param {Integer} from the starting number
 * @param {Integer} to the destination number
 * @param {Float} by percentage by which to change
 * @return {Integer} the changed amount, rounded to the nearest integer
 */
export function interpolatenumbers(from, to, by) {
  return Math.round((1 - by) * from + by * to);
}
