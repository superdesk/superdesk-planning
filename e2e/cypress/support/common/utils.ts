/**
 * Constructs the url by combining the base and uri
 * @param {string} base - The base URL
 * @param {string} uri - The resource URI
 * @returns {string}
 */
export function constructUrl(base, uri) {
    return base.replace(/\/$/, '') + uri;
}
