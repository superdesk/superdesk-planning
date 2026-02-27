import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi, planningApi} from '../../../superdeskApi';
import {IWebsocketMessageData, IPlanningItem, IPlanningAssignedTo, IAssignmentItem} from '../../../interfaces';

import {CoverageArrayInput} from '../../Coverages';
import {getFileDownloadURL} from '../../../utils';
import {IPropsEditorFieldCoverages} from './coverages.interface';

/**
 * Copy assignment details from an assignment to a coverage assignment.
 *
 * TODO-PR: Update the location where this function should be synced with
 * Note: This was copied from the `planning.common.copy_assignment_details_to_coverage` backend function.
 * The functionality between these two should be kept in sync.
 */
function copyAssignmentDetailsToCoverage(
    assignment: IAssignmentItem,
    coverageAssignedTo: DeepPartial<IPlanningAssignedTo>,
): void {
    coverageAssignedTo.desk = assignment.assigned_to.desk;
    coverageAssignedTo.user = assignment.assigned_to.user;
    coverageAssignedTo.contact = assignment.assigned_to.contact;
    coverageAssignedTo.state = assignment.assigned_to.state;
    coverageAssignedTo.assignor_user = assignment.assigned_to.assignor_user;
    coverageAssignedTo.assignor_desk = assignment.assigned_to.assignor_desk;
    coverageAssignedTo.assigned_date_desk = assignment.assigned_to.assigned_date_desk;
    coverageAssignedTo.assigned_date_user = assignment.assigned_to.assigned_date_user;
    coverageAssignedTo.coverage_provider = assignment.assigned_to.coverage_provider;
    coverageAssignedTo.priority = assignment.priority;
}

export class EditorFieldCoverages extends React.PureComponent<IPropsEditorFieldCoverages> {
    componentDidMount() {
        window.addEventListener('assignments:updated', this.onAssignmentUpdated);
        window.addEventListener('assignments:removed', this.onAssignmentRemoved);
    }

    componentWillUnmount() {
        window.removeEventListener('assignments:updated', this.onAssignmentUpdated);
        window.removeEventListener('assignments:removed', this.onAssignmentRemoved);
    }

    onAssignmentUpdated = (event: CustomEvent<IWebsocketMessageData['ASSIGNMENT_UPDATED']>) => {
        if (event.detail.planning !== this.props.item._id) {
            // This notification was not for the current Planning item
            return;
        }

        planningApi.assignments.getById(event.detail.item).then((assignment) => {
            const coverages = this.getCoverages();
            let coverageAssignedTo: DeepPartial<IPlanningAssignedTo> | null = null;
            let coverageIndex: number;
            let coverage: DeepPartial<IPlanningItem['coverages'][number]>;

            for (coverageIndex = 0; coverageIndex < coverages.length; coverageIndex++) {
                coverage = coverages[coverageIndex];

                if (assignment.coverage_item === coverage.coverage_id) {
                    coverageAssignedTo = assignment.scheduled_update_id == null ?
                        coverage.assigned_to :
                        coverage.scheduled_updates.find(
                            (c) => c.scheduled_update_id === assignment.scheduled_update_id,
                        )?.assigned_to;

                    break;
                }
            }

            if (coverageAssignedTo == null) {
                console.warn(`Coverage for Assignment ${assignment._id} not found`);
                return;
            }

            copyAssignmentDetailsToCoverage(assignment, coverageAssignedTo);
            debugger;
            this.props.onChange(`coverages[${coverageIndex}].assigned_to`, coverageAssignedTo);
        });
    }

    onAssignmentRemoved = (event: CustomEvent<IWebsocketMessageData['ASSIGNMENT_REMOVED']>) => {
        if (event.detail.planning !== this.props.item._id) {
            return;
        }

        const coverages = this.getCoverages();
        const coverageIndex = coverages.findIndex((coverage) => coverage.coverage_id === event.detail.coverage);

        if (coverageIndex === -1) {
            console.warn(`Coverage ${event.detail.coverage} not found`);
        }

        coverages[coverageIndex].assigned_to = {};
        coverages[coverageIndex].workflow_status = 'draft';
        for (let scheduledUpdate of coverages[coverageIndex].scheduled_updates ?? []) {
            scheduledUpdate.assigned_to = {};
            scheduledUpdate.workflow_status = 'draft';
        }

        this.props.onChange(`coverages[${coverageIndex}]`, coverages[coverageIndex]);
    }

    getCoverages(): IPlanningItem['coverages'] {
        const field = this.props.field ?? 'coverages';

        return get(this.props.item, field, this.props.defaultValue) as IPlanningItem['coverages'];
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <CoverageArrayInput
                {...this.props}
                testId="field-coverages"
                field={this.props.field ?? 'coverages'}
                value={this.getCoverages()}
                disabled={this.props.disabled}
                addButtonText={this.props.addButtonText ?? gettext('Add a coverage')}
                createUploadLink={getFileDownloadURL}
            />
        );
    }
}
