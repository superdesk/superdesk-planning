import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import classNames from 'classnames';

import {AssignmentPreview} from './AssignmentPreview';
import {PlanningPreview} from './PlanningPreview';
import {EventPreview} from './EventPreview';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {
    assignmentUtils,
    getCreator,
    getCoverageIcon,
    getItemInArrayById,
    lockUtils,
} from '../../utils';
import {ASSIGNMENTS, WORKSPACE} from '../../constants';
import {
    ItemActionsMenu,
    StateLabel,
    AuditInformation,
    AbsoluteDate,
    Datetime,
    UserAvatar,
    PriorityLabel,
} from '../';
import {List, ToggleBox} from '../UI';
import './style.scss';

class AssignmentPreviewContainerComponent extends React.Component {
    getUser(userId) {
        const {users} = this.props;

        return users.find((u) => u._id === userId);
    }

    getItemActions() {
        const {
            reassign,
            editAssignmentPriority,
            completeAssignment,
            assignment,
            inAssignments,
            session,
            privileges,
            startWorking,
            removeAssignment,
            lockedItems,
            openArchivePreview,
        } = this.props;

        if (!inAssignments || lockUtils.isLockRestricted(assignment, session, lockedItems)) {
            return [];
        }

        const actions = [
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.START_WORKING,
                callback: startWorking.bind(null, assignment),
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.REASSIGN,
                callback: reassign.bind(null, assignment),
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY,
                callback: editAssignmentPriority.bind(null, assignment),
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.COMPLETE,
                callback: completeAssignment.bind(null, assignment),
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.REMOVE,
                callback: removeAssignment.bind(null, assignment),
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE,
                callback: openArchivePreview.bind(null, assignment),
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY,
                callback: completeAssignment.bind(null, assignment),
            },
        ];

        return assignmentUtils.getAssignmentItemActions(
            assignment,
            session,
            privileges,
            actions
        );
    }

    render() {
        const {
            assignment,
            inAssignments,
            onFulFilAssignment,
            users,
            desks,
            planningItem,
            eventItem,
            urgencyLabel,
            priorities,
            keywords,
            formProfile,
            agendas,
        } = this.props;

        if (!assignment) {
            return null;
        }

        const planning = get(assignment, 'planning', {});
        const assignedTo = get(assignment, 'assigned_to', {});

        const state = get(assignedTo, 'state');

        const createdBy = getCreator(assignment, 'original_creator', users);
        const updatedBy = getCreator(assignment, 'version_creator', users);
        const creationDate = get(assignment, '_created');
        const updatedDate = get(assignment, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);

        const assignedUser = getItemInArrayById(users, get(assignedTo, 'user'));
        const assignedDesk = getItemInArrayById(desks, get(assignedTo, 'desk'));
        const deskAssignor = getItemInArrayById(users, get(assignedTo, 'assignor_desk'));
        const userAssignor = getItemInArrayById(users, get(assignedTo, 'assignor_user'));
        const deskAssignorName = get(deskAssignor, 'display_name') ||
            get(deskAssignor, 'name') || '-';
        const userAssignorName = get(userAssignor, 'display_name') ||
            get(userAssignor, 'name') || '-';
        const assignedDateDesk = get(assignedTo, 'assigned_date_desk');
        const assignedDateUser = get(assignedTo, 'assigned_date_user');

        const assignedUserName = get(assignedUser, 'display_name') ||
            get(assignedUser, 'name') ||
            '-';
        const assignedDeskName = get(assignedDesk, 'name') || '-';

        const itemActions = this.getItemActions();

        return (
            <div className="AssignmentPreview">
                <div className="AssignmentPreview__audit side-panel__content-block
                side-panel__content-block--pad-small side-panel__content-block--flex">
                    <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                        <AuditInformation
                            createdBy={createdBy}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate}
                        />
                    </div>
                    <div>
                        {get(itemActions, 'length') > 0 && <ItemActionsMenu actions={itemActions}/>}
                    </div>
                </div>
                <div className="AssignmentPreview__toolbar side-panel__top-tools">
                    <div>
                        <List.Item noBg={true} noHover={true}>
                            <List.Column border={false}>
                                <UserAvatar
                                    user={assignedUser}
                                    large={true}
                                    noMargin={true}
                                    initials={false}
                                />
                            </List.Column>
                            <List.Column border={false}>
                                <List.Row classes="sd-list-item__row--no-margin">
                                    <span className="sd-list-item__normal">
                                        Desk:
                                    </span>
                                    <span className="sd-list-item__strong">
                                        {assignedDeskName}
                                    </span>
                                </List.Row>
                                <List.Row classes="sd-list-item__row--no-margin">
                                    <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                        {deskAssignor &&
                                        <span>Assigned by {deskAssignorName}, <Datetime
                                            date={assignedDateDesk}/></span>}
                                    </span>
                                </List.Row>
                                <List.Row classes="sd-list-item__row--no-margin">
                                    <span className="sd-list-item__normal">
                                        Assigned:
                                    </span>
                                    <span className="sd-list-item__strong">
                                        {assignedUserName}
                                    </span>
                                </List.Row>
                                <List.Row classes="sd-list-item__row--no-margin">
                                    <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                        {userAssignor &&
                                        <span>Assigned by {userAssignorName}, <Datetime
                                            date={assignedDateUser}/></span>}
                                    </span>
                                </List.Row>
                                <List.Row classes="sd-list-item__row--margin-top">
                                    <span className="sd-list-item__normal">
                                        Due:
                                    </span>
                                    <AbsoluteDate
                                        date={get(assignment, 'planning.scheduled', '').toString()}
                                        noDateString="'not scheduled yet'"
                                    />
                                </List.Row>
                                <List.Row classes="sd-list-item__row--margin-top">
                                    <span
                                        data-sd-tooltip={'Type: ' + planning.g2_content_type}
                                        data-flow="down">
                                        <i
                                            className={classNames(
                                                'AssignmentPreview__coverage-icon',
                                                getCoverageIcon(planning.g2_content_type)
                                            )}
                                        />
                                    </span>
                                    <PriorityLabel
                                        item={assignment}
                                        priorities={priorities}
                                        tooltipFlow="down"/>
                                    <StateLabel item={assignment.assigned_to}/>
                                </List.Row>
                            </List.Column>
                        </List.Item>
                    </div>
                </div>

                {!inAssignments && state === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED &&
                    <div className="AssignmentPreview__fulfil side-panel__content-block
                    side-panel__content-block--pad-small side-panel__content-block--flex">
                        <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                            <button
                                className="btn btn--primary"
                                type="submit"
                                onClick={onFulFilAssignment.bind(null, assignment)}
                                disabled={false}>
                                Fulfil Assignment
                            </button>
                        </div>
                    </div>
                }

                <div className="AssignmentPreview__coverage side-panel__content-block
                side-panel__content-block--pad-small">
                    <AssignmentPreview
                        assignment={assignment}
                        keywords={keywords}
                        coverageFormProfile={formProfile.coverage}
                        planningFormProfile={formProfile.planning}
                        planningItem={planningItem}
                    />
                </div>

                <div className="AssignmentPreview__planning side-panel__content-block
                side-panel__content-block--pad-small">
                    <ToggleBox title="Planning" isOpen={false} style="toggle-box--circle" scrollInView={true}>
                        <PlanningPreview
                            urgencyLabel={urgencyLabel}
                            item={planningItem}
                            formProfile={formProfile.planning}
                            agendas={agendas}
                        />
                    </ToggleBox>
                </div>

                {eventItem &&
                    <div className="AssignmentPreview__event side-panel__content-block
                    side-panel__content-block--pad-small">
                        <ToggleBox title="Event" isOpen={false} style="toggle-box--circle" scrollInView={true}>
                            <EventPreview
                                item={eventItem}
                                formProfile={formProfile.events}
                            />
                        </ToggleBox>
                    </div>
                }
            </div>
        );
    }
}

AssignmentPreviewContainerComponent.propTypes = {
    assignment: PropTypes.object.isRequired,
    onFulFilAssignment: PropTypes.func,
    inAssignments: PropTypes.bool,
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
    urgencyLabel: PropTypes.string,
    priorities: PropTypes.array,
    privileges: PropTypes.object,
    keywords: PropTypes.array,
    formProfile: PropTypes.object,
    lockedItems: PropTypes.object,
    agendas: PropTypes.array,
    openArchivePreview: PropTypes.func,
};

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    inAssignments: selectors.getCurrentWorkspace(state) === WORKSPACE.ASSIGNMENTS,
    session: selectors.getSessionDetails(state),
    users: selectors.getUsers(state),
    desks: selectors.getDesks(state),

    planningItem: selectors.getCurrentAssignmentPlanningItem(state),
    eventItem: selectors.getCurrentAssignmentEventItem(state),

    urgencyLabel: get(state, 'urgency.label', 'Urgency'),
    priorities: get(state, 'vocabularies.assignment_priority'),
    privileges: selectors.getPrivileges(state),
    keywords: get(state, 'vocabularies.keywords', []),
    formProfile: selectors.forms.profiles(state),
    lockedItems: selectors.locks.getLockedItems(state),
    agendas: selectors.getAgendas(state),
});

const mapDispatchToProps = (dispatch) => ({
    startWorking: (assignment) => dispatch(actions.assignments.ui.openSelectTemplateModal(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    onFulFilAssignment: (assignment) => dispatch(actions.assignments.ui.onAssignmentFormSave(assignment)),
    removeAssignment: (assignment) => dispatch(actions.assignments.ui.removeAssignment(assignment)),
    openArchivePreview: (assignment) => dispatch(actions.assignments.ui.openArchivePreview(assignment)),
});

export const AssignmentPreviewContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPreviewContainerComponent);
