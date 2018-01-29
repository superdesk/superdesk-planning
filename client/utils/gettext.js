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
export const gettext = (text, params = null) => {
    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        const translated = injector.get('gettextCatalog').getString(text);

        return params ? injector.get('$interpolate')(translated)(params) : translated;
    }

    return text;
};

export function gettextCatalog(text, params = null) {
    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        const translated = injector.get('gettextCatalog').getString(text);

        return params ? injector.get('$interpolate')(translated)(params) : translated;
    }

    return text;
}
