import React from 'react';
import {shallow, mount} from 'enzyme';
import {Provider} from 'react-redux';
import {AssignmentPanel, AssignmentPanelContainer} from './';
import {AssignmentPreviewContainer} from '../';
import {createTestStore} from '../../utils';
import {getTestActionStore} from '../../utils/testUtils';
import * as helpers from '../tests/helpers';
import sinon from 'sinon';

describe('<AssignmentPanelContainer />', () => {
    let closePanel;
    let onFulFilAssignment;
    let previewOpened;

    beforeEach(() => {
        onFulFilAssignment = sinon.spy();
        closePanel = sinon.spy();
        previewOpened = true;
    });

    const getShallowWrapper = () => shallow(
        <AssignmentPanel
            closePanel={closePanel}
            onFulFilAssignment={onFulFilAssignment}
            previewOpened={previewOpened}
        />
    );

    it('opening and closing the assignment panel', () => {
        // Start out showing the panel
        let wrapper;

        closePanel = sinon.spy(() => wrapper.setProps({previewOpened: false}));
        wrapper = getShallowWrapper();
        let tabs = new helpers.tabs(wrapper);

        expect(wrapper.hasClass('sd-preview-panel content-item-preview AssignmentPanelContainer')).toBe(true);

        // Tabs are available
        expect(tabs.isMounted).toBe(true);
        expect(tabs.labels()).toEqual(['Assignment', 'Item History']);

        // Default tab is Assignment
        expect(tabs.getActiveTab()).toEqual('Assignment');
        expect(wrapper.find(AssignmentPreviewContainer).length).toBe(1);

        tabs.setActiveTab('Test Tab');
        expect(wrapper.find(AssignmentPreviewContainer).length).toBe(0);

        // Now close the panel
        wrapper.find('.side-panel__tools').simulate('click');
        expect(closePanel.callCount).toBe(1);
        expect(wrapper.instance().props.previewOpened).toBe(false);

        tabs = new helpers.tabs(wrapper);
        expect(tabs.isMounted).toBe(false);

        expect(wrapper.contains(
            <div className="sd-preview-panel content-item-preview hidden" />
        )).toBe(true);
        expect(wrapper.find(AssignmentPreviewContainer).length).toBe(0);
    });

    describe('unlock', () => {
        let store;
        let astore;
        let services;
        let data;
        let assignment;

        beforeEach(() => {
            astore = getTestActionStore();
            services = astore.services;
            data = astore.data;
            assignment = data.assignments[0];
            assignment.lock_user = 'someone';
            assignment.lock_session = 'somesession';

            astore.initialState.workspace.currentWorkspace = 'ASSIGNMENTS';
        });

        const initStore = () => {
            astore.initialState.assignment.currentAssignmentId = assignment._id;
            astore.init();
            store = createTestStore({
                initialState: astore.initialState,
                extraArguments: {api: services.api},
            });
            return store;
        };

        const getWrapper = () => mount(
            <Provider store={initStore()}>
                <AssignmentPanelContainer previewOpened={true} />
            </Provider>
        );

        it('unlock option available when assignment is locked', () => {
            assignment.lock_action = 'not_content_edit';

            const wrapper = getWrapper();
            const lockContainer = wrapper.find('LockContainer').first();

            expect(lockContainer.props().showUnlock).toBe(true);
        });

        it('unlock option not available if content is locked', () => {
            assignment.lock_action = 'content_edit';

            const wrapper = getWrapper();
            const lockContainer = wrapper.find('LockContainer').first();

            expect(lockContainer.props().showUnlock).toBe(false);
        });
    });
});
