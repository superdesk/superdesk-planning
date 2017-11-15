import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import classNames from 'classnames'

import { AssignmentPreview } from './AssignmentPreview'
import { PlanningPreview } from './PlanningPreview'
import { EventPreview } from './EventPreview'

import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { assignmentUtils, getCreator, getCoverageIcon, getAssignmentPriority } from '../../utils'
import { ASSIGNMENTS, WORKSPACE } from '../../constants'
import { ItemActionsMenu, StateLabel, LockContainer, AuditInformation, ToggleBox } from '../'
import './style.scss'

class AssignmentPreviewContainerComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    getUser(userId) {
        const { users } = this.props
        return users.find((u) => u._id === userId)
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
        } = this.props

        if (!inAssignments) {
            return []
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
        ]

        return assignmentUtils.getAssignmentItemActions(
            assignment,
            session,
            privileges,
            actions
        )
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
            urgencies,
            priorities,
            keywords,
            contentTypes,
            formProfile,
        } = this.props

        if (!assignment) {
            return null
        }

        const planning = get(assignment, 'planning', {})
        const assignedTo = get(assignment, 'assigned_to', {})

        const state = get(assignedTo, 'state')
        const isAssignmentInUse = assignmentUtils.isAssignmentInUse(assignment)
        const lockedUser = get(assignment, 'lock_user')

        const createdBy = getCreator(assignment, 'original_creator', users)
        const updatedBy = getCreator(assignment, 'version_creator', users)
        const creationDate = get(assignment, '_created')
        const updatedDate = get(assignment, '_updated')
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy : users.find((user) => user._id === updatedBy)

        const itemActions = this.getItemActions()

        return (
            <div className="AssignmentPreview">
                <div className="AssignmentPreview__toolbar side-panel__top-tools">
                    <div className="side-panel__top-tools-left">
                        {get(assignment, 'lock_user') &&
                            <LockContainer
                                lockedUser={lockedUser}
                                users={users}
                                displayText={get(assignment, 'lock_action') === 'content_edit' ?
                                    'Content locked' :
                                    'Assignment locked'
                                }
                                showUnlock={false}
                                withLoggedInfo={true}
                            />
                        }
                        <span
                            data-sd-tooltip={'Type: ' + planning.g2_content_type}
                            data-flow="down"
                        >
                            <i
                                className={classNames(
                                    'AssignmentPreview__coverage-icon',
                                    getCoverageIcon(planning.g2_content_type)
                                )}
                            />
                        </span>
                        <span
                            className={classNames(
                                'priority-label',
                                'priority-label--' + assignment.priority
                            )}
                            data-sd-tooltip={'Priority: ' + getAssignmentPriority(assignment.priority, priorities).name}
                            data-flow="down"
                        >
                            {assignment.priority}
                        </span>
                        <StateLabel item={assignment.assigned_to}/>

                        {isAssignmentInUse &&
                            <span
                                className="label label--hollow label--darkBlue2"
                                data-sd-tooltip="Linked to content"
                                data-flow="down"
                            >
                                Content
                            </span>
                        }

                    </div>
                    <div className="side-panel__top-tools-right">
                        {get(itemActions, 'length') > 0 && <ItemActionsMenu actions={itemActions}/>}
                    </div>
                </div>

                {!inAssignments && state === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED &&
                    <div className="AssignmentPreview__fulfil side-panel__content-block side-panel__content-block--pad-small side-panel__content-block--flex">
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

                <div className="AssignmentPreview__audit side-panel__content-block side-panel__content-block--pad-small side-panel__content-block--flex">
                    <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                        <AuditInformation
                            createdBy={createdBy}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate}
                        />
                    </div>
                </div>

                <div className="AssignmentPreview__coverage side-panel__content-block side-panel__content-block--pad-small">
                    <AssignmentPreview
                        users={users}
                        desks={desks}
                        assignment={assignment}
                        keywords={keywords}
                        contentTypes={contentTypes}
                        formProfile={formProfile.coverage}
                    />
                </div>

                <div className="AssignmentPreview__planning side-panel__content-block side-panel__content-block--pad-small">
                    <ToggleBox title="Planning" isOpen={false} style="toggle-box--circle">
                        <PlanningPreview
                            urgencyLabel={urgencyLabel}
                            urgencies={urgencies}
                            item={planningItem}
                            formProfile={formProfile.planning}
                        />
                    </ToggleBox>
                </div>

                {eventItem &&
                    <div className="AssignmentPreview__event side-panel__content-block side-panel__content-block--pad-small">
                        <ToggleBox title="Event" isOpen={false} style="toggle-box--circle">
                            <EventPreview
                                item={eventItem}
                                formProfile={formProfile.events}
                            />
                        </ToggleBox>
                    </div>
                }
            </div>
        )
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
    session: PropTypes.object,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    desks: PropTypes.array,
    planningItem: PropTypes.object,
    eventItem: PropTypes.object,
    urgencyLabel: PropTypes.string,
    urgencies: PropTypes.array,
    priorities: PropTypes.array,
    privileges: PropTypes.object,
    keywords: PropTypes.array,
    contentTypes: PropTypes.array,
    formProfile: PropTypes.object,
}

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    inAssignments: selectors.getCurrentWorkspace(state) === WORKSPACE.ASSIGNMENTS,
    session: selectors.getSessionDetails(state),
    users: selectors.getUsers(state),
    desks: selectors.getDesks(state),

    planningItem: selectors.getCurrentAssignmentPlanningItem(state),
    eventItem: selectors.getCurrentAssignmentEventItem(state),

    urgencyLabel: get(state, 'urgency.label', 'Urgency'),
    urgencies: get(state, 'urgency.urgency', []),
    priorities: get(state, 'vocabularies.assignment_priority'),
    privileges: selectors.getPrivileges(state),
    keywords: get(state, 'vocabularies.keywords', []),
    contentTypes: get(state, 'vocabularies.g2_content_type', []),
    formProfile: selectors.getFormsProfile(state),
})

const mapDispatchToProps = (dispatch) => ({
    startWorking: (assignment) => dispatch(actions.assignments.ui.openSelectTemplateModal(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    onFulFilAssignment: (assignment) => dispatch(actions.assignments.ui.onAssignmentFormSave(assignment)),
})

export const AssignmentPreviewContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPreviewContainerComponent)
