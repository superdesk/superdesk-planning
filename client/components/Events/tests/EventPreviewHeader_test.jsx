import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {EventPreviewHeader} from '../EventPreviewHeader';
import {getTestActionStore} from '../../../utils/testUtils';
import {sessions} from '../../../utils/testData';
import {createTestStore} from '../../../utils';

describe('<EventPreviewHeader />', () => {
    let astore = getTestActionStore();

    astore.init();

    astore.initialState.events.events.e1.lock_user = sessions[1].identity;
    astore.initialState.events.events.e1.lock_session = sessions[1].session;
    astore.initialState.locks.event = {e1: {user: sessions[1].identity._id}};
    astore.initialState.main.previewId = 'e1';
    astore.initialState.main.previewType = 'event';

    const getWrapper = () => {
        const store = createTestStore({initialState: astore.initialState});

        return mount(
            <Provider store={store}>
                <EventPreviewHeader />
            </Provider>
        );
    };

    it('shows lock user if event lock restricted', () => {
        const wrapper = getWrapper();

        expect(wrapper.find('EventPreviewHeaderComponent').length).toBe(1);
        expect(wrapper.find('LockContainer').length).toBe(1);
        expect(wrapper.find('LockContainer').first()
            .props().lockedUser.display_name).toBe('firstname2 lastname2');
    });

    it('item actions component is not rendered if event has no actions', () => {
        const wrapper = getWrapper();

        expect(wrapper.find('EventPreviewHeaderComponent').length).toBe(1);
        expect(wrapper.find('.ItemActionsMenu').length).toBe(0);
    });
});
