import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IDesk, IUser, IArticle} from 'superdesk-api';
import {
    IAssignmentItem,
    IAssignmentPriority,
    ICoverageContentProfile,
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
import planningActions from '../../../actions/planning/api';

import {assignmentUtils, eventUtils, planningUtils, getFileDownloadURL} from '../../../utils';
import {ASSIGNMENTS, WORKSPACE} from '../../../constants';

import {Button, Spacer} from 'superdesk-ui-framework/react';
import {AssignmentPreviewHeader} from './AssignmentPreviewHeader';
import {AssignmentPreview} from './AssignmentPreview';
import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';

import {RelatedPlannings} from '../../RelatedPlannings';
import {EventMetadata} from '../../Events';
import {PreviewFieldRelatedArticles} from '../../fields/preview/RelatedArticles';
import {editPlanningInNewTab} from '../../../utils/assignments';


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
    relatedEvents: Array<IEventItem>;

    priorities: Array<IAssignmentPriority>;
    privileges: {[key: string]: number};
    formProfile: IFormProfiles;
    lockedItems: ILockedItems;
    currentWorkspace: 'ASSIGNMENTS' | 'AUTHORING' | 'AUTHORING_WIDGET';
    contentTypes: Array<IG2ContentType>;
    files: {[key: string]: IFile};
    archiveItems: {[itemId: string]: IArticle};

    assignmentCoverageProfile: ICoverageContentProfile;
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
        this.props.relatedEvents
            .filter((event) => eventUtils.shouldFetchFilesForEvent(event))
            .forEach((event) => {
                this.props.fetchEventFiles(event);
            });

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
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PLANNING.actionName]: () => editPlanningInNewTab(assignment.planning_item),
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
            itemActionsCallBack,
            this.props.archiveItems,
        );
    }

    render() {
        const {
            assignment,
            showFulfilAssignment,
            onFulFilAssignment,
            users,
            desks,
            planningItem,
            priorities,
            formProfile,
            assignmentCoverageProfile,
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
                                text={gettext('Link to Assignment')}
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
                        assignmentCoverageProfile={assignmentCoverageProfile}
                        planningItem={planningItem}
                        createLink={getFileDownloadURL}
                        files={files}
                    />
                </ContentBlock>

                {this.props.relatedEvents.length > 0 && (
                    <ContentBlock className="AssignmentPreview__event" padSmall={true}>
                        <h3 className="side-panel__heading side-panel__heading--big">
                            {gettext('Related Events')}
                        </h3>

                        <Spacer v gap="8">
                            {
                                this.props.relatedEvents.map((event) => (
                                    <div key={event._id}>
                                        <EventMetadata
                                            key={event._id}
                                            event={event}
                                            createUploadLink={getFileDownloadURL}
                                            files={files}
                                            hideEditIcon={true}
                                            cardView={true}
                                        />

                                        <PreviewFieldRelatedArticles
                                            item={event}
                                            languageFilter={assignment.planning.language}
                                            wrapper={({children}) => (
                                                <div
                                                    className="sd-padding--2 sd-padding-b--0 sd-padding-t--0"
                                                >
                                                    {children}
                                                </div>
                                            )}
                                        />
                                    </div>
                                ))
                            }
                        </Spacer>
                    </ContentBlock>
                )}

                <ContentBlock className="AssignmentPreview__planning" padSmall={true}>
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Planning')}
                    </h3>

                    <RelatedPlannings
                        plannings={[planningItem]}
                        openPlanningItem={true}
                        expandable={true}
                        users={users}
                        desks={desks}
                        allowEditPlanning={false}
                        currentCoverageId={assignment.coverage_item}
                        cardView={true}
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

    // coverages do not have related events; it holds related events of a planning item
    relatedEvents: selectors.getRelatedEventsForCurrentAssignment(state),

    priorities: get(state, 'vocabularies.assignment_priority'),
    privileges: selectors.general.privileges(state),
    formProfile: selectors.forms.profiles(state),
    lockedItems: selectors.locks.getLockedItems(state),
    currentWorkspace: selectors.general.currentWorkspace(state),
    contentTypes: selectors.general.contentTypes(state),
    files: selectors.general.files(state),
    archiveItems: selectors.getStoredArchiveItems(state),

    assignmentCoverageProfile: selectors.getCurrentAssignmentCoverageProfile(state),
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
    fetchPlanningFiles: (planning) => dispatch(planningActions.fetchPlanningFiles(planning)),
});

export const AssignmentPreviewContainer = connect<IStateProps, IDispatchProps>(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPreviewContainerComponent);
