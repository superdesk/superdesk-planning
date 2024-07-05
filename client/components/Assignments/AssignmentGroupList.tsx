import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, throttle} from 'lodash';

import {superdeskApi} from '../../superdeskApi';

import {UI, KEYCODES} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {assignmentUtils} from '../../utils';

import {AssignmentItem} from './AssignmentItem';
import {Header, Group} from '../UI/List';
import {OrderDirectionIcon} from '../OrderBar';
import {assignmentsViewRequiresArchiveItems} from './AssignmentItem/fields';
import {ListItemLoader} from 'superdesk-ui-framework/react/components/ListItemLoader';
import moment from 'moment';

const focusElement = throttle((element: HTMLElement) => {
    element.focus();
}, 250, {leading: true});

interface IProps {
    filterBy?: string;
    orderByField?: string,
    orderDirection?: string;
    assignments: Array<any>;
    groupKey: string;
    users?: Array<any>;
    session?: any;
    loadMoreAssignments: (groupKey: string) => any;
    lockedItems?: any;
    currentAssignmentId?: string;
    reassign?: () => any;
    completeAssignment?: () => any;
    editAssignmentPriority?: () => any;
    hideItemActions?: boolean;
    privileges?: any;
    startWorking?: () => any;
    totalCount?: number;
    changeAssignmentListSingleGroupView?: (groupKey: string) => any;
    assignmentListSingleGroupView?: string;
    preview?: () => any;
    priorities?: Array<any>;
    removeAssignment?: () => any;
    openArchivePreview?: () => any;
    revertAssignment?: () => any;
    setMaxHeight?: boolean;
    contentTypes?: Array<any>;
    desks?: Array<any>;
    groupLabel?: string;
    groupStates?: Array<string>;
    groupEmptyMessage?: string;
    showCount?: boolean;
    changeListSortOrder?: (groupKey: string, order: any, savePreferences?: boolean) => any;
    saveSortPreferences?: boolean;
    contacts?: any;
    isLoading?: boolean;
    dayField?: string;
}

interface IState {
    isNextPageLoading: boolean;
}

class AssignmentGroupListComponent extends React.Component<IProps, IState> {
    dom: any;
    constructor(props) {
        super(props);
        this.state = {isNextPageLoading: false};
        this.dom = {list: null};

        this.handleScroll = this.handleScroll.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleHeaderNameKeyDown = this.handleHeaderNameKeyDown.bind(this);
        this.changeAssignmentListSingleGroupView = this.changeAssignmentListSingleGroupView.bind(this);
        this.changeListOrder = this.changeListOrder.bind(this);
    }

    componentWillUpdate(nextProps) {
        // Bring scrolltop to top if list settings change
        if (this.props.filterBy !== nextProps.filterBy ||
            this.props.orderByField !== nextProps.orderByField ||
            this.props.orderDirection !== nextProps.orderDirection
        ) {
            if (this.dom.list.scrollTop !== 0) {
                this.dom.list.scrollTop = 0;
            }
        }
    }

    handleScroll(event: React.UIEvent) {
        if (this.state.isNextPageLoading) {
            return;
        }

        const node = event.target;
        const {totalCount, assignments, loadMoreAssignments, groupKey} = this.props;

        if (node && totalCount > get(assignments, 'length', 0)) {
            if (node.scrollTop + node.offsetHeight + 200 >= node.scrollHeight) {
                this.setState({isNextPageLoading: true});

                loadMoreAssignments(groupKey)
                    .finally(() => this.setState({isNextPageLoading: false}));
            }
        }
    }

    handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
        const {querySelectorParent} = superdeskApi.utilities;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            const nextElement = document.activeElement.nextElementSibling;

            if (nextElement instanceof HTMLElement) {
                // Don't scroll the list. The list will be scrolled automatically
                // when an item is focused that is outside of the viewport
                event.preventDefault();

                focusElement(nextElement);
            }
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            const previousElement = document.activeElement.previousElementSibling;

            if (previousElement instanceof HTMLElement) {
                // Don't scroll the list. The list will be scrolled automatically
                // when an item is focused that is outside of the viewport
                event.preventDefault();

                focusElement(previousElement);
            }
        } else if (event.key === 'Home') {
            const firstElement = document.activeElement.parentElement.firstElementChild;

            if (firstElement instanceof HTMLElement) {
                // Don't scroll the list. The list will be scrolled automatically
                // when an item is focused that is outside of the viewport
                event.preventDefault();

                firstElement.focus();
            }
        } else if (event.key === 'End') {
            const lastElement = document.activeElement.parentElement.lastElementChild;

            if (lastElement instanceof HTMLElement) {
                // Don't scroll the list. The list will be scrolled automatically
                // when an item is focused that is outside of the viewport
                event.preventDefault();

                lastElement.focus();
            }
        } else if (event.key === 'PageUp') {
            if (document.activeElement instanceof HTMLElement) {
                const ele = querySelectorParent(
                    document.activeElement,
                    '[data-test-id="assignment-group__list"]'
                );

                if (ele?.previousElementSibling instanceof HTMLElement) {
                    event.preventDefault();
                    ele.previousElementSibling.querySelector('.sd-list-item-group > [tabindex="0"]')?.focus();
                }
            }
        } else if (event.key === 'PageDown') {
            if (document.activeElement instanceof HTMLElement) {
                const ele = querySelectorParent(
                    document.activeElement,
                    '[data-test-id="assignment-group__list"]'
                );

                if (ele?.nextElementSibling instanceof HTMLElement) {
                    event.preventDefault();
                    ele.nextElementSibling.querySelector('.sd-list-item-group > [tabindex="0"]')?.focus();
                }
            }
        }
    }

    handleHeaderNameKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>) {
        if (this.props.changeAssignmentListSingleGroupView &&
            [KEYCODES.ENTER, KEYCODES.SPACE].includes(event.keyCode)
        ) {
            this.props.changeAssignmentListSingleGroupView(this.props.groupKey);
        }
    }

    changeAssignmentListSingleGroupView() {
        if (this.props.changeAssignmentListSingleGroupView) {
            this.props.changeAssignmentListSingleGroupView(this.props.groupKey);
        }
    }

    changeListOrder(order) {
        const {changeListSortOrder, groupKey, saveSortPreferences = true} = this.props;

        changeListSortOrder(groupKey, order, saveSortPreferences);
    }

    getListMaxHeight() {
        if (this.props.assignmentListSingleGroupView) {
            return UI.ASSIGNMENTS.FULL_LIST_NO_OF_ITEMS *
                    UI.ASSIGNMENTS.ITEM_HEIGHT;
        } else {
            return UI.ASSIGNMENTS.DEFAULT_NO_OF_ITEMS * UI.ASSIGNMENTS.ITEM_HEIGHT;
        }
    }

    rowRenderer(index) {
        const {
            users,
            session,
            currentAssignmentId,
            privileges,
            contentTypes,
            desks,
            contacts,
        } = this.props;

        const assignment = this.props.assignments[index];
        const assignedUser = users.find((user) => get(assignment, 'assigned_to.user') === user._id);
        const isCurrentUser = assignedUser && assignedUser._id === session.identity._id;
        const onDoubleClick = assignmentUtils.assignmentHasContent(assignment) ?
            this.props.openArchivePreview.bind(null, assignment) :
            null;

        const assignedDesk = desks.find((desk) => get(assignment, 'assigned_to.desk') === desk._id);

        return (
            <AssignmentItem
                key={assignment._id}
                assignment={assignment}
                onClick={this.props.preview.bind(this, assignment)}
                onDoubleClick={onDoubleClick}
                assignedUser={assignedUser}
                isCurrentUser={isCurrentUser}
                lockedItems={this.props.lockedItems}
                session={session}
                privileges={privileges}
                currentAssignmentId={currentAssignmentId}
                reassign={this.props.reassign}
                completeAssignment={this.props.completeAssignment}
                editAssignmentPriority={this.props.editAssignmentPriority}
                hideItemActions={this.props.hideItemActions}
                startWorking={this.props.startWorking}
                priorities={this.props.priorities}
                removeAssignment={this.props.removeAssignment}
                revertAssignment={this.props.revertAssignment}
                contentTypes={contentTypes}
                assignedDesk={assignedDesk}
                contacts={contacts}
            />
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            assignments,
            totalCount,
            assignmentListSingleGroupView,
            setMaxHeight = true,
            groupLabel,
            groupEmptyMessage,
            showCount = true,
            changeAssignmentListSingleGroupView,
            orderDirection,
            isLoading,
        } = this.props;
        const listStyle = setMaxHeight ? {maxHeight: this.getListMaxHeight() + 'px'} : {};
        const headingId = `heading--${this.props.groupKey}`;
        const filteredAssignments = this.props.dayField == null
            ? assignments
            : assignments.filter((assignment) =>
                moment(assignment.planning.scheduled).isSameOrAfter(moment(this.props.dayField)),
            );

        return (
            <div data-test-id="assignment-group__list">
                {!assignmentListSingleGroupView ? (
                    <Header id={headingId}>
                        {changeAssignmentListSingleGroupView ? (
                            <h3 className="sd-list-header__name sd-list-header__name--cursorPointer">
                                <a
                                    onClick={this.changeAssignmentListSingleGroupView}
                                    onKeyDown={this.handleHeaderNameKeyDown}
                                    role="button"
                                    tabIndex={0}
                                >{groupLabel}</a>
                            </h3>
                        ) : (
                            <h3 className="sd-list-header__name">{groupLabel}</h3>
                        )}

                        {showCount && (
                            <div className="sd-list-header__number sd-flex-grow">
                                <span className="a11y-only">{gettext(
                                    'Number of Assignments: ',
                                    {count: (filteredAssignments?.length ?? 0)}
                                )}</span>
                                <span className="badge">{(filteredAssignments?.length ?? 0)}</span>
                            </div>
                        )}

                        <OrderDirectionIcon
                            direction={orderDirection}
                            onChange={this.changeListOrder}
                        />
                    </Header>
                ) : (
                    <Header id={headingId}>
                        <div className="sd-flex-grow sd-list-header__name" />
                        <OrderDirectionIcon
                            direction={orderDirection}
                            onChange={this.changeListOrder}
                        />
                    </Header>
                )}

                <Group
                    verticalScroll={true}
                    shadow={2}
                    style={listStyle}
                    onScroll={this.handleScroll}
                    onKeyDown={this.handleKeyDown}
                    aria-labelledby={headingId}
                    refNode={(assignmentsList) => this.dom.list = assignmentsList}
                    tabIndex={-1}
                >
                    {isLoading === true && (
                        <ListItemLoader />
                    )}
                    {isLoading !== true && (
                        (filteredAssignments?.length ?? 0) > 0 ? (
                            filteredAssignments.map((assignment, index) => this.rowRenderer(index))
                        ) : (
                            <li className="sd-list-item-group__empty-msg">{groupEmptyMessage}</li>
                        )
                    )}
                </Group>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const assignmentDataSelector = selectors.getAssignmentGroupSelectors[ownProps.groupKey];

    return {
        dayField: selectors.getDayField(state),
        filterBy: selectors.getFilterBy(state),
        orderByField: selectors.getOrderByField(state),
        orderDirection: assignmentDataSelector.sortOrder(state),
        assignments: assignmentDataSelector.assignmentsSelector(state),
        totalCount: assignmentDataSelector.countSelector(state),
        previewOpened: selectors.getPreviewAssignmentOpened(state),
        session: selectors.general.session(state),
        users: selectors.general.users(state),
        lockedItems: selectors.locks.getLockedItems(state),
        currentAssignmentId: selectors.getCurrentAssignmentId(state),
        privileges: selectors.general.privileges(state),
        assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
        priorities: selectors.getAssignmentPriorities(state),
        desks: selectors.general.desks(state),
        contacts: selectors.general.contactsById(state),
        isLoading: assignmentDataSelector.isLoading(state),
    };
};

const mapDispatchToProps = (dispatch) => ({
    preview: (assignment) => dispatch(actions.assignments.ui.preview(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    revertAssignment: (assignment) => dispatch(actions.assignments.ui.revert(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    startWorking: (assignment) => dispatch(actions.assignments.ui.startWorking(assignment)),
    removeAssignment: (assignment) => dispatch(actions.assignments.ui.showRemoveAssignmentModal(assignment)),
    openArchivePreview: (assignment) => dispatch(actions.assignments.ui.openArchivePreview(assignment)),
    changeListSortOrder: (list, order, savePreference) => (
        dispatch(actions.assignments.ui.changeListSortOrder(list, order, savePreference))
    ),
});

export const AssignmentGroupList = connect(mapStateToProps, mapDispatchToProps)(AssignmentGroupListComponent);
