import React from 'react'
import PropTypes from 'prop-types'
import { ListItem, UserAvatar, AbsoluteDate, StateLabel, ItemActionsMenu, Label } from '../index'
import classNames from 'classnames'
import moment from 'moment'
import { get } from 'lodash'
import { getCoverageIcon, assignmentUtils } from '../../utils/index'
import { ASSIGNMENTS, TOOLTIPS } from '../../constants'

export const AssignmentItem = ({
        assignment,
        onClick,
        className,
        assignedUser,
        isCurrentUser,
        lockedItems,
        currentAssignmentId,
        session,
        privileges,
        reassign,
        completeAssignment,
        editAssignmentPriority,
        inAssignments,
        startWorking,
    }) => {
    const isItemLocked = get(lockedItems, 'assignments') && assignment._id in lockedItems.assignments

    const actions = [
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.REASSIGN,
                callback: () => { reassign(assignment) },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY,
                callback: () => { editAssignmentPriority(assignment) },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.COMPLETE,
                callback: () => { completeAssignment(assignment) },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.START_WORKING,
                callback: () => { startWorking(assignment) },
            },
        ]

        const itemActions = inAssignments ? assignmentUtils.getAssignmentItemActions(
            assignment,
            session,
            privileges,
            actions
        ) : []

    const isAssignmentInUse = assignmentUtils.isAssignmentInUse(assignment)

    return (
        <ListItem
            item={assignment}
            onClick={onClick}
            draggable={true}
            className={classNames(
                'assignmentItem',
                className,
                { 'ListItem--locked': isItemLocked })}
            active={get(assignment, '_id') === currentAssignmentId}
        >
            <div className="sd-list-item__column">
                <i className={getCoverageIcon(assignment.planning.g2_content_type)} />
            </div>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow assignment__title">
                        <span className="ListItem__slugline">{assignment.planning.slugline}</span>
                    </span>
                </div>
                <div className="sd-list-item__row">
                    <span className={
                            classNames('line-input',
                            'priority-label',
                            'priority-label--' + assignment.priority)
                        }
                        style={{ marginRight: '0.6rem' }}
                        data-sd-tooltip={TOOLTIPS.assignmentPriority[assignment.priority]} data-flow='down'
                        >{assignment.priority}</span>
                    <StateLabel item={assignment.assigned_to} />
                    {isAssignmentInUse && <Label text="Content" isHollow={true} iconType="darkBlue2" /> }
                    <span className="ListItem__headline">
                            <i className="icon-time"/>
                            {get(assignment, 'planning.scheduled') ? (
                                <AbsoluteDate date={get(assignment, 'planning.scheduled').toString()} />
                            ) : (<time><span>'not scheduled yet'</span></time>)}
                    </span>
                </div>
            </div>
            <div className="sd-list-item__column sd-list-item__column--no-border">
                <span className="ListItem__headline">
                    {moment(assignment._updated).fromNow()}
                </span>
            </div>
            <div className="sd-list-item__column sd-list-item__column--no-border">
                <span className="ListItem__headline">
                    <UserAvatar
                        user={assignedUser || { display_name: '*' }}
                        large={false}
                        withLoggedInfo={isCurrentUser}
                        isLoggedIn={isCurrentUser}
                    />
                </span>
            </div>
            <div className="sd-list-item__action-menu">
                {itemActions.length > 0 && <ItemActionsMenu actions={itemActions} />}
            </div>
        </ListItem>
    )
}

AssignmentItem.propTypes = {
    assignment: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string,
    assignedUser: PropTypes.object,
    lockedItems: PropTypes.object,
    isCurrentUser: PropTypes.bool,
    currentAssignmentId: PropTypes.string,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    inAssignments: PropTypes.bool,
    session: PropTypes.object,
    privileges: PropTypes.object,
    startWorking: PropTypes.func,
}
