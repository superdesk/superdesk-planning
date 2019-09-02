import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get, debounce} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {planningUtils, assignmentUtils, gettext, stringUtils} from '../../../utils';
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
            startWorking,
            priorities,
            removeAssignment,
            revertAssignment,
            hideItemActions,
            contentTypes,
            assignedDesk,
        } = this.props;

        const isItemLocked = get(lockedItems, 'assignment') && assignment._id in lockedItems.assignment;
        const itemActionsCallBack = {
            [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.label]: startWorking.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: reassign.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label]: editAssignmentPriority.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.label]: removeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.label]: this.onDoubleClick,
            [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.label]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.label]: revertAssignment.bind(null, assignment),
        };

        const itemActions = !hideItemActions ?
            assignmentUtils.getAssignmentActions(assignment,
                session,
                privileges,
                lockedItems,
                contentTypes,
                itemActionsCallBack) : [];

        const hasContent = assignmentUtils.assignmentHasContent(assignment);

        const displayName = assignedUser && assignedUser.display_name ?
            assignedUser.display_name : ' - ';

        const borderState = isItemLocked ? 'locked' : false;

        const planningSchedule = get(assignment, 'planning.scheduled');
        const assignedDeskName = get(assignedDesk, 'name') || '-';
        const genre = get(assignment, 'planning.genre.name');

        const isOverdue = assignmentUtils.isDue(assignment);
        const clockIconClass = isOverdue ? 'label-icon label-icon--warning' : 'label-icon';

        return (
            <Item
                shadow={3}
                activated={get(assignment, '_id') === currentAssignmentId}
                onClick={this.handleSingleAndDoubleClick}
                className="AssignmentItem"
            >
                <Border state={borderState} />
                <Column>
                    <OverlayTrigger placement="right"
                        overlay={
                            <Tooltip id="content_type">
                                {
                                    gettext('Type: {{type}}', {
                                        type: stringUtils.firstCharUpperCase(
                                            get(assignment, 'planning.g2_content_type', '').replace('_', ' ')),
                                    })
                                }
                            </Tooltip>
                        }
                    >
                        <i className={planningUtils.getCoverageIcon(planningUtils.getCoverageContentType(
                            assignment, contentTypes) || get(assignment, 'planning.g2_content_type'))} />
                    </OverlayTrigger>
                </Column>
                <Column grow={true} border={false}>
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-text__slugline">{get(assignment, 'planning.slugline')}</span>
                            <span>{get(assignment, 'description_text')}</span>
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
                            <span data-sd-tooltip={gettext('Due Date')}
                                data-flow="right"
                                className={clockIconClass}
                            >
                                <i className="icon-time" />
                                {planningSchedule ? (
                                    <AbsoluteDate
                                        date={moment(planningSchedule).format()}
                                        className="sd-list-item__time__schedule" />
                                ) : (
                                    <span>{gettext('\'not scheduled yet\'')}</span>
                                )}
                                {isOverdue && <span className="label label--warning label--hollow">due</span>}
                            </span>
                        </span>
                        <div className="sd-list-item__element-lm-10">
                            <span className="sd-list-item__text-label">{gettext('Desk:')}</span>
                            <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                                <span>{assignedDeskName}</span>
                            </span>
                        </div>
                        {genre && (<div className="sd-list-item__element-lm-10">
                            <span className="sd-list-item__text-label">{gettext('Genre:')}</span>
                            <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                                <span>{genre}</span>
                            </span>
                        </div>)}
                    </Row>
                </Column>
                <Column border={false}>
                    <time>
                        <span>{moment(assignment._updated).fromNow()}</span>
                    </time>
                </Column>
                <Column border={false}>
                    <UserAvatar
                        user={assignedUser || {display_name: '*'}}
                        large={false}
                        withLoggedInfo={isCurrentUser}
                        isLoggedIn={isCurrentUser}
                        tooltip={assignedUser ?
                            gettext('Assigned: {{ displayName }}', {displayName}) : gettext('Unassigned')}
                        showInactive />
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
    session: PropTypes.object,
    privileges: PropTypes.object,
    startWorking: PropTypes.func,
    priorities: PropTypes.array,
    removeAssignment: PropTypes.func,
    revertAssignment: PropTypes.func,
    hideItemActions: PropTypes.bool,
    contentTypes: PropTypes.array,
    assignedDesk: PropTypes.object,
};
