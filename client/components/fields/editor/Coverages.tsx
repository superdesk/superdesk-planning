import * as React from 'react';
import {cloneDeep, get, isEqual} from 'lodash';

import {superdeskApi, planningApi} from '../../../superdeskApi';
import {
    IWebsocketMessageData,
    IPlanningItem,
    IPlanningAssignedTo,
    IAssignmentItem,
    IPlanningCoverageItem,
    ICoverageScheduledUpdate,
} from '../../../interfaces';

import {CoverageArrayInput} from '../../Coverages';
import {Row} from '../../UI/Form';
import {getFileDownloadURL} from '../../../utils';
import {IPropsEditorFieldCoverages} from './coverages.interface';

/**
 * Copy assignment details from an assignment to a coverage assignment.
 *
 * This copies the data that is editable from the Assignment, all other data is read-only from the
 * Assignment point of view.
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

function normalizeAssignedTo(
    assignedTo: DeepPartial<IPlanningAssignedTo>,
): DeepPartial<IPlanningAssignedTo> {
    const normalized = cloneDeep(assignedTo) as Record<string, unknown>;

    Object.keys(normalized).forEach((key) => {
        if (normalized[key] === undefined) {
            delete normalized[key];
        }
    });

    return normalized as DeepPartial<IPlanningAssignedTo>;
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
            let coverageToUpdate: DeepPartial<IPlanningCoverageItem | ICoverageScheduledUpdate> | null = null;
            let coverageIndex: number;
            let scheduledUpdateIndex: number = -1;
            let coverage: DeepPartial<IPlanningItem['coverages'][number]>;

            for (coverageIndex = 0; coverageIndex < coverages.length; coverageIndex++) {
                coverage = coverages[coverageIndex];

                if (assignment.coverage_item !== coverage.coverage_id) {
                    continue;
                } else if (assignment.scheduled_update_id == null) {
                    coverageToUpdate = coverage;
                } else {
                    scheduledUpdateIndex = coverage.scheduled_updates.findIndex(
                        (c) => c.scheduled_update_id === assignment.scheduled_update_id,
                    );

                    if (scheduledUpdateIndex === -1) {
                        console.warn(`Scheduled update ${assignment.scheduled_update_id} not found`);
                        return;
                    }
                    coverageToUpdate = coverage.scheduled_updates[scheduledUpdateIndex];
                }

                break;
            }

            if (coverageToUpdate == null || coverageToUpdate?.assigned_to == null) {
                console.warn(`Coverage for Assignment ${assignment._id} not found`);
                return;
            }

            const currentAssignedTo = normalizeAssignedTo(coverageToUpdate.assigned_to);
            const updatedAssignedTo = cloneDeep(currentAssignedTo);

            copyAssignmentDetailsToCoverage(assignment, updatedAssignedTo);

            const normalizedUpdatedAssignedTo = normalizeAssignedTo(updatedAssignedTo);

            if (isEqual(normalizedUpdatedAssignedTo, currentAssignedTo)) {
                // Ignore websocket echoes that don't change the effective assignment payload.
                return;
            }

            const fieldName = scheduledUpdateIndex === -1 ?
                `coverages[${coverageIndex}].assigned_to` :
                `coverages[${coverageIndex}].scheduled_updates[${scheduledUpdateIndex}].assigned_to`;

            // Keep assignment sync visible in the form without triggering Save button re-activation
            // or a redundant autosave write (updateDirtyFlag=false, saveAutosave=false).
            this.props.onChange(fieldName, normalizedUpdatedAssignedTo, false, false);
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
            return;
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
            // Standard bottom field spacing; the inner InputArray row is unpadded when there are no errors
            <Row>
                <CoverageArrayInput
                    {...this.props}
                    testId="field-coverages"
                    field={this.props.field ?? 'coverages'}
                    value={this.getCoverages()}
                    disabled={this.props.disabled}
                    addButtonText={this.props.addButtonText ?? gettext('Add a coverage')}
                    createUploadLink={getFileDownloadURL}
                />
            </Row>
        );
    }
}
