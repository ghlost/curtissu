const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Convert date to human readable
 *
 * @param {String} ISO an ISO date string
 * @return {String} human readable date
 */
export function convertdate(ISO) {
  const thisDate = new Date(ISO);
  const year = thisDate.getFullYear();
  const month = monthNames[thisDate.getMonth()];
  const day = thisDate.getDate();

  return month + ' ' + day + ', ' + year;
}
