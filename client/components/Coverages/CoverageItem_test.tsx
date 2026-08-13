import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {appConfig} from 'appConfig';

import '../../utils/testUtils';
import {CoverageItemComponent} from './CoverageItem';

describe('<CoverageItem />', () => {
    const autoAssignToWorkflowDefault = appConfig.planning_auto_assign_to_workflow;

    afterEach(() => {
        appConfig.planning_auto_assign_to_workflow = autoAssignToWorkflowDefault;
    });

    interface IRenderOptions {
        autoAssignToWorkflow: boolean;
        overrideAutoAssignToWorkflow?: boolean;
        workflowStatus?: string;
        isPreview?: boolean;
    }

    const renderCoverageItem = ({
        autoAssignToWorkflow,
        overrideAutoAssignToWorkflow,
        workflowStatus = 'active',
        isPreview = true,
    }: IRenderOptions): ReactWrapper => {
        appConfig.planning_auto_assign_to_workflow = autoAssignToWorkflow;

        // The component reads only a handful of fields off each entity, so the fixtures are
        // narrower than the prop types
        const props = {
            index: 0,
            isPreview: isPreview,
            item: {
                _id: 'plan1',
                type: 'planning',
                flags: {overide_auto_assign_to_workflow: overrideAutoAssignToWorkflow},
            },
            coverage: {
                coverage_id: 'cov1',
                workflow_status: workflowStatus,
                assigned_to: {desk: 'desk1'},
                planning: {g2_content_type: 'text'},
            },
            users: [],
            desks: [{_id: 'desk1', name: 'Sports'}],
            contentTypes: [{qcode: 'text', name: 'Text'}],
            getContactById: () => Promise.resolve(null),
        } as unknown as React.ComponentProps<typeof CoverageItemComponent>;

        const wrapper = mount(<CoverageItemComponent {...props} />);

        wrapper.update();

        return wrapper;
    };

    it('shows "Added to workflow" when adding to workflow is not automatic', () => {
        const wrapper = renderCoverageItem({autoAssignToWorkflow: false});

        expect(wrapper.text()).toContain('Added to workflow');
    });

    it('hides "Added to workflow" when the coverage was added to workflow automatically', () => {
        const wrapper = renderCoverageItem({autoAssignToWorkflow: true});

        expect(wrapper.text()).not.toContain('Added to workflow');
    });

    it('shows "Added to workflow" when the planning item overrides auto assign to workflow', () => {
        const wrapper = renderCoverageItem({
            autoAssignToWorkflow: true,
            overrideAutoAssignToWorkflow: true,
        });

        expect(wrapper.text()).toContain('Added to workflow');
    });

    it('hides "Added to workflow" when the coverage is not in workflow', () => {
        const wrapper = renderCoverageItem({
            autoAssignToWorkflow: false,
            workflowStatus: 'draft',
        });

        expect(wrapper.text()).not.toContain('Added to workflow');
    });

    it('omits the "Desk" label in previews', () => {
        const wrapper = renderCoverageItem({autoAssignToWorkflow: false, isPreview: true});

        expect(wrapper.text()).toContain('Sports');
        expect(wrapper.text()).not.toContain('Desk:');
    });

    it('renders the "Desk" label outside previews', () => {
        const wrapper = renderCoverageItem({autoAssignToWorkflow: false, isPreview: false});

        expect(wrapper.text()).toContain('Desk:');
    });
});
