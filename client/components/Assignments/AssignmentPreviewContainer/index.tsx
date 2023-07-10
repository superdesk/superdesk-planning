import * as React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {assignmentUtils, gettext, eventUtils, planningUtils, getFileDownloadURL} from '../../../utils';
import {ASSIGNMENTS, WORKSPACE} from '../../../constants';

import {AssignmentPreviewHeader} from './AssignmentPreviewHeader';
import {AssignmentPreview} from './AssignmentPreview';
import {Button} from '../../UI';
import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';

import {RelatedPlannings} from '../../RelatedPlannings';
import {EventMetadata} from '../../Events';

class AssignmentPreviewContainerComponent extends React.Component {
    componentDidMount() {
        if (eventUtils.shouldFetchFilesForEvent(this.props.eventItem)) {
            this.props.fetchEventFiles(this.props.eventItem);
        }

        if (planningUtils.shouldFetchFilesForPlanning(this.props.planningItem)) {
            this.props.fetchPlanningFiles(this.props.planningItem);
        }
    }

    getItemActions() {
        const {
            startWorking,
            reassign,
            editAssignmentPriority,
            completeAssignment,
            assignment,
            hideItemActions,
            session,
            privileges,
            removeAssignment,
            lockedItems,
            openArchivePreview,
            revertAssignment,
            contentTypes,
        } = this.props;

        if (hideItemActions) {
            return [];
        }

        const itemActionsCallBack = {
            [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.actionName]: startWorking.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.actionName]: reassign.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.actionName]: editAssignmentPriority.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.actionName]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.actionName]: removeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.actionName]: openArchivePreview.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.actionName]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.actionName]: revertAssignment.bind(null, assignment),
        };

        return assignmentUtils.getAssignmentActions(assignment,
            session,
            privileges,
            lockedItems,
            contentTypes,
            itemActionsCallBack);
    }

    render() {
        const {
            assignment,
            showFulfilAssignment,
            onFulFilAssignment,
            users,
            desks,
            planningItem,
            eventItem,
            priorities,
            formProfile,
            hideAvatar,
            currentWorkspace,
            contentTypes,
            session,
            privileges,
            files,
        } = this.props;

        if (!assignment) {
            return null;
        }

        const planning = get(assignment, 'planning', {});
        const itemActions = this.getItemActions();
        const canFulfilAssignment = showFulfilAssignment && assignmentUtils.canFulfilAssignment(
            assignment,
            session,
            privileges
        );

        return (
            <div className="AssignmentPreview">
                <AssignmentPreviewHeader
                    assignment={assignment}
                    planning={planning}
                    priorities={priorities}
                    itemActions={itemActions}
                    users={users}
                    desks={desks}
                    hideAvatar={hideAvatar}
                    hideItemActions={currentWorkspace === WORKSPACE.AUTHORING}
                    contentTypes={contentTypes}
                />

                {canFulfilAssignment && (
                    <ContentBlock className="AssignmentPreview__fulfil" padSmall={true} flex={true}>
                        <ContentBlockInner grow={true}>
                            <Button
                                color="primary"
                                text={gettext('Fulfil Assignment')}
                                onClick={onFulFilAssignment.bind(null, assignment)}
                            />
                        </ContentBlockInner>
                    </ContentBlock>
                )}

                <ContentBlock className="AssignmentPreview__coverage" padSmall={true}>
                    <AssignmentPreview
                        assignment={assignment}
                        coverageFormProfile={formProfile.coverage}
                        planningFormProfile={formProfile.planning}
                        planningItem={planningItem}
                        createLink={getFileDownloadURL}
                        files={files}
                    />
                </ContentBlock>

                {eventItem && (
                    <ContentBlock className="AssignmentPreview__event" padSmall={true}>
                        <h3 className="side-panel__heading--big">
                            {gettext('Associated Event')}
                        </h3>
                        <EventMetadata
                            event={eventItem}
                            createUploadLink={getFileDownloadURL}
                            files={files}
                            hideEditIcon={true}
                        />
                    </ContentBlock>
                )}

                <ContentBlock className="AssignmentPreview__planning" padSmall={true}>
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Planning')}
                    </h3>
                    <RelatedPlannings
                        className="related-plannings"
                        plannings={[planningItem]}
                        openPlanningItem={true}
                        expandable={true}
                        users={users}
                        desks={desks}
                        allowEditPlanning={false}
                        currentCoverageId={assignment.coverage_item}

                    />
                </ContentBlock>
            </div>
        );
    }
}

AssignmentPreviewContainerComponent.propTypes = {
    hideAvatar: PropTypes.bool,
    assignment: PropTypes.object.isRequired,
    onFulFilAssignment: PropTypes.func,
    startWorking: PropTypes.func.isRequired,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    removeAssignment: PropTypes.func,
    session: PropTypes.object,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    desks: PropTypes.array,
    planningItem: PropTypes.object,
    eventItem: PropTypes.object,
    priorities: PropTypes.array,
    privileges: PropTypes.object,
    formProfile: PropTypes.object,
    lockedItems: PropTypes.object,
    openArchivePreview: PropTypes.func,
    revertAssignment: PropTypes.func,
    hideItemActions: PropTypes.bool,
    showFulfilAssignment: PropTypes.bool,
    fetchEventFiles: PropTypes.func,
    currentWorkspace: PropTypes.string,
    contentTypes: PropTypes.array,
    fetchPlanningFiles: PropTypes.func,
    files: PropTypes.array,
};

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    session: selectors.general.session(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),

    planningItem: selectors.getCurrentAssignmentPlanningItem(state),
    eventItem: selectors.getCurrentAssignmentEventItem(state),

    priorities: get(state, 'vocabularies.assignment_priority'),
    privileges: selectors.general.privileges(state),
    formProfile: selectors.forms.profiles(state),
    lockedItems: selectors.locks.getLockedItems(state),
    currentWorkspace: selectors.general.currentWorkspace(state),
    contentTypes: selectors.general.contentTypes(state),
    files: selectors.general.files(state),
});

const mapDispatchToProps = (dispatch) => ({
    startWorking: (assignment) => dispatch(actions.assignments.ui.startWorking(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    revertAssignment: (assignment) => dispatch(actions.assignments.ui.revert(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    onFulFilAssignment: (assignment) => dispatch(actions.assignments.ui.onFulFilAssignment(assignment)),
    removeAssignment: (assignment) => dispatch(actions.assignments.ui.showRemoveAssignmentModal(assignment)),
    openArchivePreview: (assignment) => dispatch(actions.assignments.ui.openArchivePreview(assignment)),
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    fetchPlanningFiles: (planning) => dispatch(actions.planning.api.fetchPlanningFiles(planning)),
});

export const AssignmentPreviewContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPreviewContainerComponent);
