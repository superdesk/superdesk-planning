import $ from 'jquery';
import {get} from 'lodash';

export const onEventCapture = (event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
};

export const gettext = (text, params = null) => {
    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        const translated = injector.get('gettextCatalog').getString(text);

        return params ? injector.get('$interpolate')(translated)(params) : translated;
    }

    return text;
};

export const gettextCatalog = (text, params = null) => {
    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        const translated = injector.get('gettextCatalog').getString(text);

        return params ? injector.get('$interpolate')(translated)(params) : translated;
    }

    return text;
};

export const scrollListItemIfNeeded = (selectedIndex, listRefElement) => {
    if (listRefElement.children.length > 0) {
        let activeElement = listRefElement.children[selectedIndex];

        if (activeElement) {
            let distanceOfSelItemFromVisibleTop = $(activeElement).offset().top -
                $(document).scrollTop() -
            $(listRefElement).offset().top - $(document).scrollTop();

            // If the selected item goes beyond container view, scroll it to middle.
            if (distanceOfSelItemFromVisibleTop >=
                    (listRefElement.clientHeight - activeElement.clientHeight) ||
                    distanceOfSelItemFromVisibleTop < 0) {
                $(listRefElement).scrollTop($(listRefElement).scrollTop() +
                    distanceOfSelItemFromVisibleTop -
                listRefElement.offsetHeight * 0.5);
            }
        }
    }
};

export const isNotForPublication = (item) => get(item, 'flags.marked_for_not_publication', false);

export const firstCharUpperCase = (string) => string && string.replace(/\b\w/g, (l) => l.toUpperCase());
