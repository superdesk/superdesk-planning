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
    if (!text) {
        return '';
    }

    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        return injector.get('gettextCatalog').getString(text, params || {});
    }

    if (text && params) {
        const template = (tpl, args) => tpl.replace(/\{{\s*(\w+)\s*}}/g, (_, v) => args[v]);

        return template(text, params);
    }

    return text;
};

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
