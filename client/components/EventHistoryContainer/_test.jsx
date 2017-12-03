import React from 'react';
import {createTestStore} from '../../utils';
import {mount} from 'enzyme';
import {EventHistoryContainer} from '../EventHistoryContainer/index';
import {Provider} from 'react-redux';
import sinon from 'sinon';

describe('<EventsHistoryContainer />', () => {
    const highlightedEvent = '5800d71930627218866f1e80';

    it('should fetch highlighted event history when mounted', () => {
        const fetchEventHistory = sinon.spy();

        const props = {
            highlightedEvent: highlightedEvent,
            fetchEventHistory: fetchEventHistory(highlightedEvent),
        };

        let store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <EventHistoryContainer {...props} />
            </Provider>
        );

        expect(wrapper).toBeDefined();
        expect(fetchEventHistory.calledOnce).toBe(true);
        expect(fetchEventHistory.calledWith(highlightedEvent)).toBe(true);
    });
});
