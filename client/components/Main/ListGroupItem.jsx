import React from 'react';
import PropTypes from 'prop-types';
import {debounce, indexOf} from 'lodash';

import {EventItem, EventItemWithPlanning} from '../Events';
import {PlanningItem} from '../Planning';

import {ITEM_TYPE, EVENTS, PLANNING, MAIN, CLICK_DELAY} from '../../constants';
import {getItemType, eventUtils} from '../../utils';


export class ListGroupItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {clickedOnce: undefined};
        this._delayedClick = undefined;

        this.handleSingleAndDoubleClick = this.handleSingleAndDoubleClick.bind(this);
        this.onSingleClick = this.onSingleClick.bind(this);

        this.dom = {item: null};
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.active && !this.props.active) {
            // The item just became active, scroll into view
            if (this.dom.item) {
                this.dom.item.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
            }
        }
    }

    // onSingleClick, onDoubleClick and handleSingleAndDoubleClick
    // are workarounds to achieve single and double click on the same component
    onSingleClick(index, item) {
        this.setState({clickedOnce: undefined});
        this.props.onItemClick(index, item);
    }

    onDoubleClick(item) {
        this.props.onDoubleClick(item);
    }

    handleSingleAndDoubleClick(index, item) {
        if (!this._delayedClick) {
            this._delayedClick = debounce(this.onSingleClick, CLICK_DELAY);
        }

        if (this.state.clickedOnce) {
            this._delayedClick.cancel();
            this.setState({clickedOnce: false});
            this.onDoubleClick(item);
        } else {
            this._delayedClick(index, item);
            this.setState({clickedOnce: true});
        }
    }

    render() {
        const {
            item,
            onItemClick,
            onDoubleClick,
            onAddCoverageClick,
            lockedItems,
            agendas,
            date,
            session,
            privileges,
            calendars,
            activeFilter,
            onMultiSelectClick,
            selectedEventIds,
            selectedPlanningIds,
            itemActions,
            users,
            desks,
            showAddCoverage,
            hideItemActions,
            listFields,
            active,
            index,
            navigateDown,
            navigateList,
            onItemActivate,
            previewItem,
            contentTypes,
            contacts,
        } = this.props;
        const itemType = getItemType(item);

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onItemClick && onDoubleClick ? this.handleSingleAndDoubleClick :
            this.onSingleClick;

        let itemProps = {
            item: item,
            onItemClick: clickHandler.bind(null, index),
            lockedItems: lockedItems,
            session: session,
            privileges: privileges,
            activeFilter: activeFilter,
            onMultiSelectClick: onMultiSelectClick,
            listFields: listFields,
            active: active,
            refNode: (node) => {
                this.dom.item = node;
            },
        };

        let eventProps = {
            ...itemProps,
            calendars: calendars,
            multiSelected: indexOf(selectedEventIds, item._id) !== -1,
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName],
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName],
            [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName],
            [EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName],
        };

        let planningProps = {
            ...itemProps,
            contacts: contacts,
            users: users,
            desks: desks,
            contentTypes: contentTypes,
            agendas: agendas,
            date: date,
            onAddCoverageClick: onAddCoverageClick,
            multiSelected: indexOf(selectedPlanningIds, item._id) !== -1,
            showAddCoverage: showAddCoverage,
            hideItemActions: hideItemActions,
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName],
            [PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName],
            [PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName],
            [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName],
        };

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            if (eventUtils.eventHasPlanning(item) && activeFilter === MAIN.FILTERS.COMBINED) {
                return (
                    <EventItemWithPlanning
                        eventProps={eventProps}
                        planningProps={planningProps}
                        showRelatedPlannings={this.props.showRelatedPlannings}
                        relatedPlanningsInList={this.props.relatedPlanningsInList}
                        navigateDown={navigateDown}
                        navigateList={navigateList}
                        onItemActivate={onItemActivate}
                        previewItem={previewItem}
                    />
                );
            }

            return (
                <EventItem { ... eventProps } />
            );

        case ITEM_TYPE.PLANNING:
            return (
                <PlanningItem { ...planningProps } />
            );
        }
        return null;
    }
}

ListGroupItem.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    users: PropTypes.array,
    desks: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    editItem: PropTypes.object,
    previewItem: PropTypes.string,
    lockedItems: PropTypes.object.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    itemActions: PropTypes.object,
    showAddCoverage: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    listField: PropTypes.object,
    calendars: PropTypes.array,
    listFields: PropTypes.object,
    active: PropTypes.bool,
    index: PropTypes.number,
    navigateDown: PropTypes.bool,
    navigateList: PropTypes.func,
    onItemActivate: PropTypes.func,
    contentTypes: PropTypes.array,
    contacts: PropTypes.object,
};
