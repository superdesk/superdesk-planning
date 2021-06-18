import React from 'react';
import moment from 'moment';
import {get, debounce, Cancelable} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {superdeskApi} from '../../../superdeskApi';
import {IUser, IDesk} from 'superdesk-api';
import {
    IAssignmentItem,
    IAssignmentPriority,
    IContactItem,
    IG2ContentType,
    ILockedItems,
    IPrivileges,
    ISession
} from '../../../interfaces';

import {assignmentUtils, planningUtils} from '../../../utils';
import {ASSIGNMENTS, CLICK_DELAY} from '../../../constants';
import {getAssignmentTypeInfo} from '../../../utils/assignments';

import {Menu} from 'superdesk-ui-framework/react';
import {UserAvatar} from '../../';
import {Item, Border, Column, Row} from '../../UI/List';

import {getComponentForField, getAssignmentsListView} from './fields';

interface IProps {
    assignment: IAssignmentItem;
    lockedItems: ILockedItems;
    isCurrentUser: boolean;
    currentAssignmentId?: IAssignmentItem['_id'];
    session: ISession;
    privileges: IPrivileges;
    priorities: Array<IAssignmentPriority>;
    hideItemActions?: boolean;
    contentTypes: Array<IG2ContentType>;
    assignedUser?: IUser;
    assignedDesk?: IDesk;
    contacts: {[key: string]: IContactItem};

    onClick(assignment: IAssignmentItem): void;
    onDoubleClick(assignment: IAssignmentItem): void;
    reassign(assignment: IAssignmentItem): void;
    completeAssignment(assignment: IAssignmentItem): void;
    editAssignmentPriority(assignment: IAssignmentItem): void;
    startWorking(assignment: IAssignmentItem): void;
    removeAssignment(assignment: IAssignmentItem): void;
    revertAssignment(assignment: IAssignmentItem): void;
}

interface IState {
    clickedOnce: boolean;
    hover: boolean;
}

export class AssignmentItem extends React.Component<IProps, IState> {
    private _delayedClick: (() => void) & Cancelable | undefined;

    constructor(props) {
        super(props);

        this.state = {
            clickedOnce: false,
            hover: false,
        };
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
        this.onFocus = this.onFocus.bind(this);
        this.onItemHoverOn = this.onItemHoverOn.bind(this);
        this.onItemHoverOff = this.onItemHoverOff.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    onFocus(event: React.FocusEvent<HTMLLIElement>) {
        const {querySelectorParent} = superdeskApi.utilities;

        if (!querySelectorParent(event.target, 'button', {self: true})) {
            // Don't trigger click event if focus went through menu or button inside the list item
            this.props.onClick(this.props.assignment);
        }
    }

    onItemHoverOn() {
        this.setState({hover: true});
    }

    onItemHoverOff() {
        this.setState({hover: false});
    }

    onSingleClick() {
        this.setState({clickedOnce: false});
        this.props.onClick(this.props.assignment);
    }

    onDoubleClick() {
        this.props.onDoubleClick(this.props.assignment);
    }

    handleSingleAndDoubleClick(event: React.MouseEvent<HTMLLIElement>) {
        const {querySelectorParent} = superdeskApi.utilities;

        if (event.target instanceof HTMLElement &&
            querySelectorParent(event.target, 'button', {self: true})
        ) {
            // Don't trigger click events if event went through menu or button inside the list item
            return;
        }

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
        const {tooltip, className} = getAssignmentTypeInfo(assignment, contentTypes);

        return (
            <Column>
                <span className="a11y-only">{tooltip}</span>
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

        // @ts-ignore
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
        const {gettext} = superdeskApi.localization;
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
        if (!this.state.hover && this.props.assignment._id !== this.props.currentAssignmentId) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
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
            [ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.actionName]: startWorking.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.actionName]: reassign.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.actionName]: editAssignmentPriority.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.actionName]: completeAssignment.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.REMOVE.actionName]: removeAssignment.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.actionName]: this.onDoubleClick,
            [ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.actionName]: completeAssignment.bind(
                null,
                assignment
            ),
            [ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.actionName]: revertAssignment.bind(
                null,
                assignment
            ),
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
            <Menu items={planningUtils.toUIFrameworkInterface(itemActions)}>
                {(toggle) => (
                    <div
                        style={{display: 'flex', height: '100%'}}
                        className="sd-list-item__action-menu sd-list-item__action-menu--direction-row"
                    >
                        <button
                            className="icn-btn dropdown__toggle actions-menu-button"
                            aria-label={gettext('Actions')}
                            onClick={(e) => {
                                toggle(e);
                            }}
                            data-test-id="menu-button"
                        >
                            <i className="icon-dots-vertical" />
                        </button>
                    </div>
                )}
            </Menu>
        );
    }

    handleKeyDown(event: React.KeyboardEvent<HTMLLIElement>) {
        if (event.key === ' ' && event.target instanceof HTMLElement) {
            // Display item actions menu when space is pressed
            const element = event.target?.querySelector('.dropdown__toggle');

            if (element instanceof HTMLElement && typeof element?.click === 'function') {
                event.preventDefault();
                element.click();
            }
        } else if (event.key === 'Enter' && this.props.onDoubleClick != null) {
            this.props.onDoubleClick(this.props.assignment);
        }
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
                onFocus={this.onFocus}
                onMouseLeave={this.onItemHoverOff}
                onMouseEnter={this.onItemHoverOn}
                onKeyDown={this.handleKeyDown}
                tabIndex={0}
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
