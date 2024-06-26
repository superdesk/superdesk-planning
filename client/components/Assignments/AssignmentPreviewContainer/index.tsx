import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IDesk, IUser} from 'superdesk-api';
import {
    IAssignmentItem,
    IAssignmentPriority,
    IEventItem, IFile,
    IFormProfiles,
    IG2ContentType,
    ILockedItems,
    IPlanningItem,
    ISession
} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {assignmentUtils, eventUtils, planningUtils, getFileDownloadURL} from '../../../utils';
import {ASSIGNMENTS, WORKSPACE} from '../../../constants';

import {Button} from 'superdesk-ui-framework/react';
import {AssignmentPreviewHeader} from './AssignmentPreviewHeader';
import {AssignmentPreview} from './AssignmentPreview';
import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';

import {RelatedPlannings} from '../../RelatedPlannings';
import {EventMetadata} from '../../Events';
import {PreviewFieldRelatedArticles} from '../../fields/preview/RelatedArticles';

interface IOwnProps {
    hideAvatar?: boolean;
    hideItemActions?: boolean;
    showFulfilAssignment?: boolean;
}

interface IStateProps {
    assignment: IAssignmentItem;
    session: ISession;
    users: Array<IUser>;
    desks: Array<IDesk>;
    planningItem?: IPlanningItem;
    eventItems?: Array<IEventItem>;

    priorities: Array<IAssignmentPriority>;
    privileges: {[key: string]: number};
    formProfile: IFormProfiles;
    lockedItems: ILockedItems;
    currentWorkspace: 'ASSIGNMENTS' | 'AUTHORING' | 'AUTHORING_WIDGET';
    contentTypes: Array<IG2ContentType>;
    files: Array<IFile>;
}

interface IDispatchProps {
    startWorking(assignment: IAssignmentItem): void;
    reassign(assignment: IAssignmentItem): void;
    completeAssignment(assignment: IAssignmentItem): void;
    revertAssignment(assignment: IAssignmentItem): void;
    editAssignmentPriority(assignment: IAssignmentItem): void;
    onFulFilAssignment(assignment: IAssignmentItem): void;
    removeAssignment(assignment: IAssignmentItem): void;
    openArchivePreview(assignment: IAssignmentItem): void;
    fetchEventFiles(event: IEventItem): void;
    fetchPlanningFiles(planning: IPlanningItem): void;
}

type IProps = IOwnProps & IStateProps & IDispatchProps;

class AssignmentPreviewContainerComponent extends React.Component<IProps> {
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
            eventItems,
            priorities,
            formProfile,
            hideAvatar,
            currentWorkspace,
            contentTypes,
            session,
            privileges,
            lockedItems,
            files,
        } = this.props;

        if (!assignment) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
        const planning = get(assignment, 'planning', {});
        const itemActions = this.getItemActions();
        const canFulfilAssignment = showFulfilAssignment && assignmentUtils.canFulfilAssignment(
            assignment,
            session,
            privileges,
            lockedItems
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
                                type="primary"
                                text={gettext('Fulfil Assignment')}
                                onClick={() => {
                                    onFulFilAssignment(assignment);
                                }}
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

                {(eventItems?.length ?? 0) > 0 && (
                    eventItems.map((eventItem) => (
                        <div className="sd-padding--2 sd-padding-b--0">
                            <PreviewFieldRelatedArticles
                                item={eventItem}
                                languageFilter={assignment.planning.language}
                            />
                        </div>
                    ))
                )}

                {(eventItems?.length ?? 0) > 0 && (
                    <ContentBlock className="AssignmentPreview__event" padSmall={true}>
                        <h3 className="side-panel__heading side-panel__heading--big">
                            {gettext('Associated Events')}
                        </h3>
                        {eventItems.map((eventItem) => (
                            <EventMetadata
                                event={eventItem}
                                createUploadLink={getFileDownloadURL}
                                files={files}
                                hideEditIcon={true}
                            />
                        ))}
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

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    session: selectors.general.session(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),

    planningItem: selectors.getCurrentAssignmentPlanningItem(state),
    eventItems: selectors.getCurrentAssignmentEventItems(state),

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

export const AssignmentPreviewContainer = connect<IStateProps, IDispatchProps>(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPreviewContainerComponent);
