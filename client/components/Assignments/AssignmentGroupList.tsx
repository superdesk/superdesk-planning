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

const focusElement = throttle((element: HTMLElement) => {
    element.focus();
}, 250, {leading: true});

class AssignmentGroupListComponent extends React.Component {
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
        const {changeListSortOrder, groupKey, saveSortPreferences} = this.props;

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
                archiveItemForAssignment={this.props.archiveItemForAssignment}
            />
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            assignments,
            totalCount,
            assignmentListSingleGroupView,
            setMaxHeight,
            groupLabel,
            groupEmptyMessage,
            showCount,
            changeAssignmentListSingleGroupView,
            orderDirection,
        } = this.props;
        const listStyle = setMaxHeight ? {maxHeight: this.getListMaxHeight() + 'px'} : {};
        const headingId = `heading--${this.props.groupKey}`;

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
                                    {count: totalCount}
                                )}</span>
                                <span className="badge">{totalCount}</span>
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
                    {get(assignments, 'length', 0) > 0 ? (
                        assignments.map((assignment, index) => this.rowRenderer(index))
                    ) : (
                        <p className="sd-list-item-group__empty-msg">{groupEmptyMessage}</p>
                    )}
                </Group>
            </div>
        );
    }
}

AssignmentGroupListComponent.propTypes = {
    filterBy: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    assignments: PropTypes.array.isRequired,
    groupKey: PropTypes.string.isRequired,
    users: PropTypes.array,
    session: PropTypes.object,
    loadMoreAssignments: PropTypes.func.isRequired,
    lockedItems: PropTypes.object,
    currentAssignmentId: PropTypes.string,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    hideItemActions: PropTypes.bool,
    privileges: PropTypes.object,
    startWorking: PropTypes.func,
    totalCount: PropTypes.number,
    changeAssignmentListSingleGroupView: PropTypes.func,
    assignmentListSingleGroupView: PropTypes.string,
    preview: PropTypes.func,
    priorities: PropTypes.array,
    removeAssignment: PropTypes.func,
    openArchivePreview: PropTypes.func,
    revertAssignment: PropTypes.func,
    setMaxHeight: PropTypes.bool,
    contentTypes: PropTypes.array,
    desks: PropTypes.array,
    groupLabel: PropTypes.string,
    groupStates: PropTypes.arrayOf(PropTypes.string),
    groupEmptyMessage: PropTypes.string,
    showCount: PropTypes.bool,
    changeListSortOrder: PropTypes.func,
    saveSortPreferences: PropTypes.bool,
    contacts: PropTypes.object,
    archiveItemForAssignment: PropTypes.object,
};

AssignmentGroupListComponent.defaultProps = {
    setMaxHeight: true,
    showCount: true,
    saveSortPreferences: true,
};

const mapStateToProps = (state, ownProps) => {
    const assignmentDataSelector = selectors.getAssignmentGroupSelectors[ownProps.groupKey];

    const props = {
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
    };

    if (assignmentsViewRequiresArchiveItems()) {
        props.archiveItemForAssignment = selectors.getStoredArchiveItems(state);
    }

    return props;
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
