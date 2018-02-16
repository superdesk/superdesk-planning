import React from 'react';
import PropTypes from 'prop-types';
import {
    ListItem,
    UserAvatar,
    AbsoluteDate,
    StateLabel,
    ItemActionsMenu,
    Label,
    PriorityLabel,
    InternalNoteLabel,
} from '../index';
import {List} from '../UI';
import classNames from 'classnames';
import moment from 'moment';
import {get} from 'lodash';
import {getCoverageIcon, assignmentUtils, gettext, lockUtils} from '../../utils/index';
import {ASSIGNMENTS} from '../../constants';
import './style.scss';

export const AssignmentItem = ({
    assignment,
    onClick,
    onDoubleClick,
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
    priorities,
    removeAssignment,
}) => {
    const isItemLocked = get(lockedItems, 'assignments') && assignment._id in lockedItems.assignments;

    const actions = [
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
            ...ASSIGNMENTS.ITEM_ACTIONS.START_WORKING,
            callback: startWorking.bind(null, assignment),
        },
        {
            ...ASSIGNMENTS.ITEM_ACTIONS.REMOVE,
            callback: removeAssignment.bind(null, assignment),
        },
        {
            ...ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE,
            callback: onDoubleClick,
        },
        {
            ...ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY,
            callback: completeAssignment.bind(null, assignment),
        },
    ];

    const itemActions = inAssignments && !lockUtils.isLockRestricted(assignment, session, lockedItems) ?
        assignmentUtils.getAssignmentItemActions(
            assignment,
            session,
            privileges,
            actions
        ) : [];

    const hasContent = assignmentUtils.assignmentHasContent(assignment);

    return (
        <ListItem
            item={assignment}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            draggable={true}
            className={classNames(
                'assignmentItem',
                className
            )}
            active={get(assignment, '_id') === currentAssignmentId}
            state={isItemLocked ? 'locked' : null}
        >
            <List.Column>
                <i className={getCoverageIcon(assignment.planning.g2_content_type)} />
            </List.Column>
            <List.Column grow={true} border={false}>
                <List.Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow assignment__title">
                        <span className="ListItem__slugline">{assignment.planning.slugline}</span>
                    </span>
                </List.Row>
                <List.Row>
                    <PriorityLabel
                        item={assignment}
                        priorities={priorities}
                        tooltipFlow="down"
                    />

                    <StateLabel item={assignment.assigned_to} />
                    {hasContent && <Label text="Content" isHollow={true} iconType="darkBlue2" /> }
                    <span className="ListItem__headline">
                        <i className="icon-time sd-list-item__inline-icon"/>
                        <InternalNoteLabel
                            item={assignment}
                            prefix="planning."
                            marginRight={false}
                        />
                        {get(assignment, 'planning.scheduled') ? (
                            <AbsoluteDate date={get(assignment, 'planning.scheduled').toString()} />
                        ) : (<time><span>{gettext('\'not scheduled yet\'')}</span></time>)}
                    </span>
                </List.Row>
            </List.Column>
            <List.Column border={false}>
                <span className="ListItem__headline">
                    {moment(assignment._updated).fromNow()}
                </span>
            </List.Column>
            <List.Column border={false}>
                <span className="ListItem__headline">
                    <UserAvatar
                        user={assignedUser || {display_name: '*'}}
                        large={false}
                        withLoggedInfo={isCurrentUser}
                        isLoggedIn={isCurrentUser}
                    />
                </span>
            </List.Column>
            <List.ActionMenu>
                {itemActions.length > 0 && <ItemActionsMenu actions={itemActions} />}
            </List.ActionMenu>
        </ListItem>
    );
};

AssignmentItem.propTypes = {
    assignment: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
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
    priorities: PropTypes.array,
    removeAssignment: PropTypes.func,
};
