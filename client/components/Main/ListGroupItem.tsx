import React from 'react';
import {debounce, indexOf} from 'lodash';

import {
    IEventListItemProps,
    IPlanningListItemProps,
    IEventOrPlanningItem,
    IEventItem, IPlanningItem, IBaseListItemProps
} from '../../interfaces';

import {EventItem, EventItemWithPlanning} from '../Events';
import {PlanningItem} from '../Planning';

import {ITEM_TYPE, EVENTS, PLANNING, MAIN, CLICK_DELAY} from '../../constants';
import {getItemType, eventUtils} from '../../utils';

interface IProps extends Omit<
    IEventListItemProps & IPlanningListItemProps,
    'item' | 'multiSelected' | 'refNode' | 'onItemClick'
> {
    item: IEventOrPlanningItem;
    previewItem?: IEventOrPlanningItem['_id'];
    relatedPlanningsInList: {[key: string]: Array<IPlanningItem>};
    selectedEventIds: Array<IEventItem['_id']>;
    selectedPlanningIds: Array<IPlanningItem['_id']>;
    itemActions: {[key: string]: () => void}; // List of item action dispatches (i.e. Cancel Event)
    index: number;
    navigateDown?: boolean;
    minTimeWidth?: string;

    onDoubleClick(item: IEventOrPlanningItem): void;
    showRelatedPlannings(item: IEventItem): void;
    navigateList(increment?: boolean): void;
    onItemActivate(item: IEventItem, forceActivate?: boolean): void;
    onItemClick(index: number, item: IEventOrPlanningItem): void;
}

interface IState {
    clickedOnce?: boolean;
}

export class ListGroupItem extends React.Component<IProps, IState> {
    dom: {item: HTMLElement};
    _delayedClick: any | undefined;

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
            listViewType,
            sortField,
            minTimeWidth,
        } = this.props;
        const itemType = getItemType(item);

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onItemClick && onDoubleClick ? this.handleSingleAndDoubleClick :
            this.onSingleClick;

        let itemProps: Omit<IBaseListItemProps<IEventOrPlanningItem>, 'multiSelected'> = {
            item: item,
            onItemClick: clickHandler.bind(null, index),
            lockedItems: lockedItems,
            session: session,
            privileges: privileges,
            activeFilter: activeFilter,
            onMultiSelectClick: onMultiSelectClick,
            listFields: listFields,
            active: active,
            listViewType: listViewType,
            sortField: sortField,
            minTimeWidth: minTimeWidth,
            refNode: (node) => {
                this.dom.item = node;
            },
        };

        let eventProps: IEventListItemProps = {
            ...itemProps,
            item: item as IEventItem,
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

        let planningProps: IPlanningListItemProps = {
            ...itemProps,
            item: item as IPlanningItem,
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
                        listViewType={this.props.listViewType}
                    />
                );
            }

            return (
                <EventItem {... eventProps} />
            );

        case ITEM_TYPE.PLANNING:
            return (
                <PlanningItem {...planningProps} />
            );
        }
        return null;
    }
}
