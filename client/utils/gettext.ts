import * as utils from 'core/utils';

/**
 * Get translated string
 *
 * You can use params in translation like:
 *
 *    gettext('Hello {{ name }}', {name: 'John'})
 *
 * @param {String} text
 * @param {Object} params
 * @return {String}
 */
export const gettext = (text, params = null) => utils.gettext(text, params);

export function gettextCatalog(text, params = null) {
    if (!text) {
        return '';
    }

    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        return injector.get('gettextCatalog').getString(text, params || {});
    }

    return text;
}
