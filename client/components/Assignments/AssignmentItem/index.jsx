import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get, debounce} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import * as actions from '../../../actions';

import {
    planningUtils,
    assignmentUtils,
    gettext,
    stringUtils,
} from '../../../utils';
import {ASSIGNMENTS, CLICK_DELAY} from '../../../constants';

import {UserAvatar, ItemActionsMenu} from '../../';
import {Item, Border, Column, Row, ActionMenu} from '../../UI/List';

import {getComponentForField, getAssignmentsListView} from './fields';

export class AssignmentItemComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {clickedOnce: false};
        this._delayedClick = undefined;

        this.onSingleClick = this.onSingleClick.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.handleSingleAndDoubleClick = this.handleSingleAndDoubleClick.bind(
            this
        );
        this.renderContentTypeColumn = this.renderContentTypeColumn.bind(this);
        this.renderContentColumn = this.renderContentColumn.bind(this);
        this.renderAvatar = this.renderAvatar.bind(this);
        this.renderActionsMenu = this.renderActionsMenu.bind(this);
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

    renderContentTypeColumn() {
        const {assignment, contentTypes} = this.props;

        const tooltip = gettext('Type: {{type}}', {
            type: stringUtils.firstCharUpperCase(
                get(assignment, 'planning.g2_content_type', '').replace(
                    '_',
                    ' '
                )
            ),
        });

        const className = planningUtils.getCoverageIcon(
            planningUtils.getCoverageContentType(assignment, contentTypes) ||
                get(assignment, 'planning.g2_content_type'),
            assignment
        );

        return (
            <Column>
                <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip id="content_type">{tooltip}</Tooltip>}
                >
                    <i className={className} />
                </OverlayTrigger>
            </Column>
        );
    }

    renderField(field) {
        const FieldComponent = getComponentForField(field);

        return <FieldComponent {...this.props} key={field} />;
    }

    renderContentColumn() {
        const listViewConfig = getAssignmentsListView();

        return (
            <Column grow={true} border={false}>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {listViewConfig.firstLine.map((field) =>
                            this.renderField(field)
                        )}
                    </span>
                </Row>
                <Row>
                    {listViewConfig.secondLine.map((field) =>
                        this.renderField(field)
                    )}
                </Row>
            </Column>
        );
    }

    renderAvatar() {
        const {
            assignedUser,
            isCurrentUser,
            assignment,
            contacts,
        } = this.props;
        let user;
        let tooltip;

        if (
            get(assignment, 'assigned_to.contact') &&
            get(contacts, assignment.assigned_to.contact)
        ) {
            const contact = contacts[assignment.assigned_to.contact];

            user = {
                display_name: `${contact.last_name}, ${contact.first_name}`,
            };
            tooltip = gettext('Provider: {{ name }}', {
                name: user.display_name,
            });
        } else if (assignedUser) {
            const displayName = assignedUser.display_name
                ? assignedUser.display_name
                : ' - ';

            user = assignedUser;
            tooltip = gettext('Assigned: {{ name }}', {name: displayName});
        } else {
            user = {display_name: '*'};
            tooltip = gettext('Unassigned');
        }

        return (
            <Column border={false}>
                <UserAvatar
                    user={user}
                    large={false}
                    withLoggedInfo={isCurrentUser}
                    isLoggedIn={isCurrentUser}
                    tooltip={tooltip}
                    showInactive
                />
            </Column>
        );
    }

    renderActionsMenu() {
        const {
            assignment,
            session,
            privileges,
            lockedItems,
            contentTypes,
            startWorking,
            reassign,
            editAssignmentPriority,
            completeAssignment,
            removeAssignment,
            revertAssignment,
            hideItemActions,
        } = this.props;

        const itemActionsCallBack = {
            [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.label]: startWorking.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: reassign.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY
                .label]: editAssignmentPriority.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label]: completeAssignment.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.label]: removeAssignment.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.label]: this
                .onDoubleClick,
            [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY
                .label]: completeAssignment.bind(null, assignment),
            [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY
                .label]: revertAssignment.bind(null, assignment),
        };

        const itemActions = !hideItemActions
            ? assignmentUtils.getAssignmentActions(
                assignment,
                session,
                privileges,
                lockedItems,
                contentTypes,
                itemActionsCallBack
            )
            : [];

        return itemActions.length < 1 ? null : (
            <ActionMenu>
                <ItemActionsMenu actions={itemActions} />
            </ActionMenu>
        );
    }

    render() {
        const {assignment, lockedItems, currentAssignmentId} = this.props;

        const isItemLocked =
            get(lockedItems, 'assignment') &&
            assignment._id in lockedItems.assignment;
        const borderState = isItemLocked ? 'locked' : false;

        return (
            <Item
                shadow={3}
                activated={get(assignment, '_id') === currentAssignmentId}
                onClick={this.handleSingleAndDoubleClick}
                className="AssignmentItem"
            >
                <Border state={borderState} />
                {this.renderContentTypeColumn()}
                {this.renderContentColumn()}
                <Column border={false}>
                    <time>
                        <span>{moment(assignment._updated).fromNow()}</span>
                    </time>
                </Column>
                {this.renderAvatar()}
                {this.renderActionsMenu()}
            </Item>
        );
    }
}

AssignmentItemComponent.propTypes = {
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
    contacts: PropTypes.object,
    loadArchiveItem: PropTypes.func,
};

export const AssignmentItem = connect(null, (dispatch) => ({
    loadArchiveItem: (assignment) =>
        dispatch(actions.assignments.api.loadArchiveItem(assignment)),
}))(AssignmentItemComponent);
