/**
 * Convert HEX color to RGB
 *
 * @param {String} hex a hex color
 * @return {String} A CSS rgb color value
 */
export function hextorgb(hex) {
    const rgb = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        , (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map((x) => parseInt(x, 16));

    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}
