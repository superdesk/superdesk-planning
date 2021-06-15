import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';

import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import * as actions from '../../../actions';
import * as helpers from '../../tests/helpers';

import {LockContainer} from '../../';
import {AssignmentPreviewContainer} from './';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentPreviewHeader} from './AssignmentPreviewHeader';
import {EventPreview} from './EventPreview';
import {PlanningPreview} from './PlanningPreview';
import {ItemActionsMenu} from '../../ItemActionsMenu';

describe('<AssignmentPreviewContainer />', () => {
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

    const getWrapper = (props) => mount(
        <Provider store={initStore()}>
            <AssignmentPreviewContainer {...props} />
        </Provider>
    );

    it('renders preview sections', () => {
        assignment.planning_item = 'p2';
        assignment.assigned_to.state = 'assigned';
        let wrapper = getWrapper().find('.AssignmentPreview');

        expect(wrapper.children().length).toBe(4);

        expect(wrapper.hasClass('AssignmentPreview')).toBe(true);

        expect(wrapper.childAt(0).type()).toEqual(AssignmentPreviewHeader);
        expect(wrapper.childAt(1).hasClass('AssignmentPreview__coverage')).toBe(true);
        expect(wrapper.childAt(2).hasClass('AssignmentPreview__planning')).toBe(true);
        expect(wrapper.childAt(3).hasClass('AssignmentPreview__event')).toBe(true);
        expect(wrapper.find(ItemActionsMenu).length).toBe(1);

        wrapper = getWrapper({
            showFulfilAssignment: true,
            hideItemActions: true,
        }).find('.AssignmentPreview');
        expect(wrapper.children().length).toBe(5);

        expect(wrapper.hasClass('AssignmentPreview')).toBe(true);
        expect(wrapper.childAt(0).type()).toEqual(AssignmentPreviewHeader);
        expect(wrapper.childAt(1).hasClass('AssignmentPreview__fulfil')).toBe(true);
        expect(wrapper.childAt(2).hasClass('AssignmentPreview__coverage')).toBe(true);
        expect(wrapper.childAt(3).hasClass('AssignmentPreview__planning')).toBe(true);
        expect(wrapper.childAt(4).hasClass('AssignmentPreview__event')).toBe(true);
        expect(wrapper.find(ItemActionsMenu).length).toBe(0);
    });

    describe('top toolbar', () => {
        beforeEach(() => {
            sinon.stub(actions.assignments.ui, 'startWorking').returns({type: 'Test'});
            sinon.stub(actions.assignments.ui, 'reassign').returns({type: 'Test'});
            sinon.stub(actions.assignments.ui, 'complete').returns({type: 'Test'});
            sinon.stub(actions.assignments.ui, 'editPriority').returns({type: 'Test'});
            sinon.stub(actions.assignments.ui, 'openArchivePreview').returns({type: 'Test'});
        });

        afterEach(() => {
            restoreSinonStub(actions.assignments.ui.startWorking);
            restoreSinonStub(actions.assignments.ui.reassign);
            restoreSinonStub(actions.assignments.ui.complete);
            restoreSinonStub(actions.assignments.ui.editPriority);
            restoreSinonStub(actions.assignments.ui.openArchivePreview);
        });

        it('renders icons, labels and menu items', () => {
            assignment.priority = 1;
            assignment.assigned_to.state = 'assigned';
            const wrapper: ReactWrapper = getWrapper();
            const topTools = wrapper.find('.side-panel__top-tools');
            const audit = wrapper.find('.AssignmentPreview__audit');

            // Renders Content Type icon
            // Cannot test data-sd-tooltip="Type: text"
            // Our gettext mock simply returns the string
            expect(topTools.contains(
                <span data-sd-tooltip="Type: Text" data-flow="right">
                    <i className="sd-list-item__inline-icon icon-text" />
                </span>
            )).toBe(true);

            // Renders Assignment Priority
            expect(topTools.find('.priority-label--1').exists()).toBe(true);

            // Renders Assignment State label
            expect(topTools.contains(
                <span className="label label--draft label--hollow">
                    Assigned
                </span>
            )).toBe(true);

            const menu = new helpers.actionMenu(audit);

            expect(menu.isAvailable()).toBe(true);
            menu.expectActions([
                'Start Working',
                'Reassign',
                'Edit Priority',
                'Remove Assignment',
            ]);
        });

        it('`Start Working` executes `assignments.ui.startWorking`', () => {
            assignment.assigned_to.state = 'assigned';
            assignment.planning.g2_content_type = 'text';
            const wrapper = getWrapper();
            const menu = new helpers.actionMenu(wrapper);

            expect(menu.actionLabels()).toContain('Start Working');
            menu.invokeAction('Start Working');
            expect(actions.assignments.ui.startWorking.callCount).toBe(1);
        });

        it('`Reassign` executes `assignments.ui.reassign`', () => {
            assignment.assigned_to.state = 'assigned';
            const wrapper = getWrapper();
            const menu = new helpers.actionMenu(wrapper);

            expect(menu.actionLabels()).toContain('Reassign');
            menu.invokeAction('Reassign');
            expect(actions.assignments.ui.reassign.callCount).toBe(1);
        });

        it('`Edit Priority` executes `assignments.ui.editPriority`', () => {
            assignment.assigned_to.state = 'assigned';
            const wrapper = getWrapper();
            const menu = new helpers.actionMenu(wrapper);

            expect(menu.actionLabels()).toContain('Edit Priority');
            menu.invokeAction('Edit Priority');
            expect(actions.assignments.ui.editPriority.callCount).toBe(1);
        });

        it('`Complete Assignment` executes `assignments.ui.complete`', () => {
            assignment.assigned_to.state = 'in_progress';
            const wrapper = getWrapper();
            const menu = new helpers.actionMenu(wrapper);

            expect(menu.actionLabels()).toContain('Complete Assignment');
            menu.invokeAction('Complete Assignment');
            expect(actions.assignments.ui.complete.callCount).toBe(1);
        });

        it('`Open Coverage` executes `assignments.ui.openArchivePreview`', () => {
            assignment.item_ids = ['item1'];
            const wrapper = getWrapper();
            const menu = new helpers.actionMenu(wrapper);

            expect(menu.actionLabels()).toContain('Open Coverage');
            menu.invokeAction('Open Coverage');
            expect(actions.assignments.ui.openArchivePreview.callCount).toBe(1);
        });
    });

    it('renders Assignment preview', () => {
        const wrapper = getWrapper();

        expect(wrapper.find(AssignmentPreview).length).toBe(1);
        expect(wrapper.find(LockContainer).length).toBe(0);
    });

    it('renders Planning preview', () => {
        const mountWrapper = getWrapper();
        let wrapper = mountWrapper.find('.AssignmentPreview');
        let toggle = new helpers.toggleBox(wrapper.childAt(2));

        expect(toggle.title()).toBe('Planning');
        expect(toggle.isOpen()).toBe(false);
        toggle.click();

        wrapper = mountWrapper.find('.AssignmentPreview');
        toggle = new helpers.toggleBox(wrapper.childAt(2));
        expect(toggle.isOpen()).toBe(true);
        expect(toggle.find(PlanningPreview).length).toBe(1);
    });

    it('renders Event preview', () => {
        assignment.planning_item = 'p2';
        const mountWrapper = getWrapper();
        let wrapper = mountWrapper.find('.AssignmentPreview');
        let toggle = new helpers.toggleBox(wrapper.childAt(3));

        expect(toggle.title()).toBe('Event');
        expect(toggle.isOpen()).toBe(false);
        toggle.click();

        wrapper = mountWrapper.find('.AssignmentPreview');
        toggle = new helpers.toggleBox(wrapper.childAt(3));
        expect(toggle.isOpen()).toBe(true);
        expect(toggle.find(EventPreview).length).toBe(1);
    });
});
