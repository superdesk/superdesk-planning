import * as React from 'react';
import {Provider} from 'react-redux';
import $ from 'jquery';
import {planningApi} from '../superdeskApi';
import {showModal} from '@superdesk/common';

const scrollListItemIfNeeded = (selectedIndex, listRefElement) => {
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

export function showModalConnectedToStore<T = any>(
    Component: React.ComponentType<{closeModal(): void} & any>,
    props?: T,
): Promise<void> {
    return showModal(
        ({closeModal}) => (
            <Provider store={planningApi.redux.store}>
                <Component
                    closeModal={closeModal}
                    {...props ?? {}}
                />
            </Provider>
        )
    );
}

// eslint-disable-next-line consistent-this
const self = {scrollListItemIfNeeded};

export default self;
