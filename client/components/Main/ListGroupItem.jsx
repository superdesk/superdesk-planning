import React from 'react';
import PropTypes from 'prop-types';
import {debounce, indexOf} from 'lodash';

import {EventItem, EventItemWithPlanning} from '../Events';
import {PlanningItem} from '../Planning';

import {ITEM_TYPE, EVENTS, PLANNING, MAIN} from '../../constants';
import {getItemType, eventUtils} from '../../utils';


export class ListGroupItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {clickedOnce: undefined};
        this.handleSingleAndDoubleClick = this.handleSingleAndDoubleClick.bind(this);
        this.onSingleClick = this.onSingleClick.bind(this);
    }

    // onSingleClick, onDoubleClick and handleSingleAndDoubleClick
    // are workarounds to achieve single and double click on the same component
    onSingleClick(item) {
        this.setState({clickedOnce: undefined});
        this.props.onItemClick(item);
    }

    onDoubleClick(item) {
        this.props.onDoubleClick(item);
    }

    handleSingleAndDoubleClick(item) {
        if (!this._delayedClick) {
            this._delayedClick = debounce(this.onSingleClick, 250);
        }

        if (this.state.clickedOnce) {
            this._delayedClick.cancel();
            this.setState({clickedOnce: false});
            this.onDoubleClick(item);
        } else {
            this._delayedClick(item);
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
            dateFormat,
            timeFormat,
            agendas,
            date,
            session,
            privileges,
            activeFilter,
            currentWorkspace,
            onMultiSelectClick,
            selectedEventIds,
            selectedPlanningIds,
            itemActions,
            users,
            desks,
        } = this.props;
        const itemType = getItemType(item);

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onItemClick && onDoubleClick ? this.handleSingleAndDoubleClick :
            this.onSingleClick;

        let itemProps = {
            item: item,
            onItemClick: clickHandler,
            lockedItems: lockedItems,
            dateFormat: dateFormat,
            timeFormat: timeFormat,
            session: session,
            privileges: privileges,
            activeFilter: activeFilter,
            onMultiSelectClick: onMultiSelectClick,
        };

        let eventProps = {
            ...itemProps,
            multiSelected: indexOf(selectedEventIds, item._id) !== -1,
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
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
                itemActions[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]
        };

        let planningProps = {
            ...itemProps,
            users: users,
            desks: desks,
            agendas: agendas,
            date: date,
            currentWorkspace: currentWorkspace,
            onAddCoverageClick: onAddCoverageClick,
            multiSelected: indexOf(selectedPlanningIds, item._id) !== -1,
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
    previewItem: PropTypes.object,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    currentWorkspace: PropTypes.string,
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    itemActions: PropTypes.object,
};
