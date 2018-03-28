import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get, debounce} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {planningUtils, assignmentUtils, gettext} from '../../../utils';
import {ASSIGNMENTS, CLICK_DELAY} from '../../../constants';

import {
    UserAvatar,
    AbsoluteDate,
    StateLabel,
    ItemActionsMenu,
    Label,
    PriorityLabel,
    InternalNoteLabel,
} from '../../';
import {Item, Border, Column, Row, ActionMenu} from '../../UI/List';

export class AssignmentItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {clickedOnce: false};
        this._delayedClick = undefined;

        this.onSingleClick = this.onSingleClick.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.handleSingleAndDoubleClick = this.handleSingleAndDoubleClick.bind(this);
    }

    onSingleClick() {
        this.setState({clickedOnce: false});
        this.props.onClick(this.props.assignment);
    }

    onDoubleClick() {
        this.props.onDoubleClick(this.props.assignment);
    }

    handleSingleAndDoubleClick() {
        if (this.props.onClick && !this.props.onDoubleClick) {
            return this.onSingleClick();
        }

        if (!this._delayedClick) {
            this._delayedClick = debounce(this.onSingleClick, CLICK_DELAY);
        }

        if (this.state.clickedOnce) {
            this._delayedClick.cancel();
            this.setState({clickedOnce: false});
            this.onDoubleClick();
        } else {
            this._delayedClick();
            this.setState({clickedOnce: true});
        }
    }

    render() {
        const {
            assignment,
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
            revertAssignment
        } = this.props;

        const isItemLocked = get(lockedItems, 'assignment') && assignment._id in lockedItems.assignment;
        const itemActionsCallBack = {
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: reassign.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label]: editAssignmentPriority.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.label]: startWorking.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.label]: removeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.label]: this.onDoubleClick,
            [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.label]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.label]: revertAssignment.bind(null, assignment),
        };

        const itemActions = inAssignments ?
            assignmentUtils.getAssignmentActions(assignment,
                session,
                privileges,
                lockedItems,
                itemActionsCallBack) : [];

        const hasContent = assignmentUtils.assignmentHasContent(assignment);

        const displayName = assignedUser && assignedUser.display_name ?
            assignedUser.display_name : ' - ';

        const borderState = isItemLocked ? 'locked' : false;

        return (
            <Item
                shadow={3}
                activated={get(assignment, '_id') === currentAssignmentId}
                onClick={this.handleSingleAndDoubleClick}
            >
                <Border state={borderState} />
                <Column>
                    <i className={planningUtils.getCoverageIcon(get(assignment, 'planning.g2_content_type'))} />
                </Column>
                <Column grow={true} border={false}>
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-text__slugline">{get(assignment, 'planning.slugline')}</span>
                        </span>
                    </Row>
                    <Row>
                        <PriorityLabel
                            item={assignment}
                            priorities={priorities}
                            tooltipFlow="right"
                            inline={true}
                        />

                        <StateLabel item={assignment.assigned_to} />
                        {hasContent && <Label text="Content" isHollow={true} iconType="darkBlue2" /> }
                        <span>
                            <InternalNoteLabel
                                item={assignment}
                                prefix="planning."
                                marginRight={true}
                                marginLeft={true}
                            />
                            <span data-sd-tooltip={gettext('Due Date')} data-flow="right">
                                <i className="icon-time" />
                            </span>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                {get(assignment, 'planning.scheduled') ? (
                                    <AbsoluteDate date={get(assignment, 'planning.scheduled').toString()} />
                                ) : (
                                    <time><span>{gettext('\'not scheduled yet\'')}</span></time>
                                )}
                            </span>
                        </span>
                    </Row>
                </Column>
                <Column border={false}>
                    <span>
                        {moment(assignment._updated).fromNow()}
                    </span>
                </Column>
                <Column border={false}>
                    <OverlayTrigger placement="left"
                        overlay={
                            <Tooltip id="assigned_user">
                                {gettext('Assigned: {{ displayName }}', {displayName})}
                            </Tooltip>
                        }
                    >
                        <UserAvatar
                            user={assignedUser || {display_name: '*'}}
                            large={false}
                            withLoggedInfo={isCurrentUser}
                            isLoggedIn={isCurrentUser}
                        />
                    </OverlayTrigger>
                </Column>
                <ActionMenu>
                    {itemActions.length > 0 && <ItemActionsMenu actions={itemActions} />}
                </ActionMenu>
            </Item>
        );
    }
}

AssignmentItem.propTypes = {
    assignment: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
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
    revertAssignment: PropTypes.func,
};
