import React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../superdeskApi';
import {IDesk, IUser} from 'superdesk-api';
import {
    FILTER_TYPE,
    IAgenda, ICalendar, IContactItem,
    IEventItem,
    IEventOrPlanningItem, IG2ContentType,
    ILockedItems,
    IPlanningItem,
    ISession, LIST_VIEW_TYPE, SORT_FIELD
} from '../../interfaces';

import {KEYCODES, MAIN} from '../../constants';
import {onEventCapture} from '../../utils';

import {ListGroup} from '.';
import {PanelInfo} from '../UI';
import {Item, Column, Group} from '../UI/List';
import './style.scss';

/**
 * Used for implementing WAI-ARIA Listbox
 */
export interface IAccessibleListBox {
    containerProps: {
        role: 'listbox';
        'aria-activedescendant': string;
        tabIndex: number;
    };

    groupId: string;
    getChildId(index: number): void;
}


interface IProps {
    groups: Array<{
        date?: string;
        events: Array<IEventOrPlanningItem>;
    }>;
    desks: Array<IDesk>;
    users: Array<IUser>;
    lockedItems: ILockedItems;
    previewItem: IEventOrPlanningItem['_id'];
    agendas: Array<IAgenda>;
    session: ISession;
    privileges: {[key: string]: number};
    activeFilter: FILTER_TYPE;
    relatedPlanningsInList?: {[key: string]: Array<IPlanningItem>}; // Map Event Ids to Related Plannings
    selectedEventIds?: Array<IEventItem['_id']>;
    selectedPlanningIds?: Array<IPlanningItem['_id']>;
    itemActions: {[key: string]: () => void}; // List of item action dispatches (i.e. Cancel Event)
    loadingIndicator: boolean;
    showAddCoverage?: boolean;
    hideItemActions?: boolean;
    listFields?: {[key: string]: { // List fields from planning_types collection (i.e. Planning Profiles)
        primary_fields?: Array<string>;
        secondary_fields?: Array<string>;
    }};
    calendars: Array<ICalendar>;
    isAllListItemsLoaded: boolean;
    indexItems?: boolean;
    contentTypes: Array<IG2ContentType>;
    contacts: {[key: string]: IContactItem};
    listViewType: LIST_VIEW_TYPE;
    sortField: SORT_FIELD;
    userInitiatedSearch?: boolean;

    onItemClick(item: IEventOrPlanningItem): void;
    onDoubleClick(item: IEventOrPlanningItem): void;
    onAddCoverageClick(item: IPlanningItem): void;
    onMultiSelectClick(item: IEventOrPlanningItem, value: boolean, shiftKey: boolean, name: string): void;
    showRelatedPlannings(item: IEventItem): void;
    loadMore(viewType: FILTER_TYPE): Promise<any>;
    filter(viewType: FILTER_TYPE): Promise<any>;
}

interface IState {
    isNextPageLoading: boolean;
    scrollTop: number;

    /**
     * This index is shared between groups.
     * If there are 2 groups with 5 items each,
     * and second item of the second group is focused,
     * activeItemIndex will be 6
     */
    activeItemIndex: number;
    navigateDown: boolean;
}

export class ListPanel extends React.Component<IProps, IState> {
    dom: {list?: any};

    constructor(props) {
        super(props);
        this.state = {
            isNextPageLoading: false,
            scrollTop: 0,
            activeItemIndex: -1, // Active item in the list
            navigateDown: true, // Navigation direction
        };

        this.dom = {list: null};

        this.handleScroll = this.handleScroll.bind(this);
        this.unsetNextPageLoading = this.unsetNextPageLoading.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.navigateListWorker = this.navigateListWorker.bind(this);
        this.onItemActivate = this.onItemActivate.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'activeFilter') !== get(this.props, 'activeFilter')) {
            this.setState({
                isNextPageLoading: false,
                scrollTop: 0,
                activeItemIndex: -1,
            });
        }

        // If the list has finished loading, and is not for the next page,
        // Then scroll the list to the top (Used to Advanced Filters and Calendar Navigation)
        // Or user has initiated a search
        if (this.dom.list && get(nextProps, 'userInitiatedSearch') &&
            !get(this.props, 'userInitiatedSearch')) {
            this.dom.list.scrollTop = 0;
            this.setState({activeItemIndex: -1});
        }
    }

    isNestedItem(activeItemIndex) {
        if (this.props.activeFilter === MAIN.FILTERS.COMBINED && activeItemIndex >= 0) {
            // Check to see if item is event-with-planning, then it will handle keydown locally
            const item = this.getItemFromGroups(activeItemIndex);

            return get(item, 'planning_ids.length', 0) > 0;
        }
    }

    handleKeyDown(event) {
        // Prevent list navigation actions if events are triggered inside a child widget.
        if (event.target.getAttribute('role') !== 'listbox') {
            return;
        }

        if (this.isNestedItem(this.state.activeItemIndex)) {
            return;
        }

        if (![KEYCODES.UP, KEYCODES.DOWN, KEYCODES.ENTER, KEYCODES.SPACE].includes(get(event, 'keyCode'))) {
            return;
        }

        onEventCapture(event);

        if (event.keyCode === KEYCODES.ENTER || event.keyCode === KEYCODES.SPACE) {
            event.target.querySelector('.actions-menu-button').click();
        } else if (event.keyCode === KEYCODES.UP || event.keyCode === KEYCODES.DOWN) {
            const {target} = event;
            const activeId = target.getAttribute('aria-activedescendant');

            if (activeId != null) {
                const activeElement = target.querySelector(`#${activeId}`);
                const children = Array.from(target.children);
                const itemCount = target.children.length;
                const activeIndex = children.indexOf(activeElement);

                const increment = get(event, 'keyCode') === KEYCODES.DOWN;

                const wouldGoToItemOutsideThisGroup = increment
                    ? activeIndex >= itemCount - 1
                    : activeIndex <= 0;

                if (!wouldGoToItemOutsideThisGroup) {
                    this.navigateListWorker(increment);
                }
            } else {
                /**
                 * If there is no item currently active,
                 * it should focus the first item in the group that triggered the event.
                 */
                this.setState({activeItemIndex: parseInt(target.getAttribute('data-index-from'), 10) - 1}, () => {
                    this.navigateListWorker(true);
                });
            }
        }
    }

    // Function to navigate active index on the list and preview if needed
    navigateListWorker(increment = true) {
        let newState;
        // Set navigation details on state appropriately

        if (increment && this.isActiveIndexInRange(this.state.activeItemIndex + 1)) {
            newState = {
                navigateDown: true,
                activeItemIndex: this.state.activeItemIndex + 1,
            };
        } else if (this.isActiveIndexInRange(this.state.activeItemIndex - 1)) {
            newState = {
                activeItemIndex: this.state.activeItemIndex - 1,
                navigateDown: false,
            };
        }

        // Need to move up/down in the item list
        if (newState) {
            this.setState(newState);

            // If preview is open, open the new item on preview
            if (!this.isNestedItem(newState.activeItemIndex)) {
                const item = this.getItemFromGroups(newState.activeItemIndex);

                this.onItemActivate(item);
            }
        }

        // Return boolean if list was navigated
        return !!newState;
    }

    onItemClick(index, item) {
        // Get the index to set the item as active
        this.setState({activeItemIndex: index});
        this.props.onItemClick(item);
    }

    getItemFromGroups(index) {
        // Get the specific item from the global indices of the item
        let currentItemsIndex = 0, groupItems, item;

        for (let i = 0; i < get(this.props.groups, 'length', 0); i++) {
            groupItems = get(this.props.groups[i], 'events');
            if (index <= currentItemsIndex + groupItems.length - 1) {
                item = this.props.groups[i].events[index - currentItemsIndex];
                break;
            }
            currentItemsIndex = currentItemsIndex + groupItems.length;
        }

        return item;
    }

    isActiveIndexInRange(index) {
        let count = 0;

        get(this.props, 'groups', []).forEach((g) => {
            count = count + get(g, 'events.length', 0);
        });
        return index >= 0 && index < count;
    }

    unsetNextPageLoading() {
        this.setState({isNextPageLoading: false});
    }

    handleScroll(event) {
        if (this.state.isNextPageLoading) {
            return;
        }

        const node = event.target;

        // scroll event gets fired on hover of each item in the list.
        // this.state.scrollTop is used to check if the scroll position has changed
        if (node && node.scrollTop + node.offsetHeight + 100 >= node.scrollHeight &&
            this.state.scrollTop < node.scrollTop) {
            this.setState({isNextPageLoading: true, scrollTop: node.scrollTop});

            this.props.loadMore(this.props.activeFilter)
                .then(this.unsetNextPageLoading, this.unsetNextPageLoading);
        }

        if (node.scrollTop === 0 && this.state.scrollTop > 0) {
            this.setState({isNextPageLoading: true, scrollTop: 0});

            this.props.filter(this.props.activeFilter)
                .then(this.unsetNextPageLoading, this.unsetNextPageLoading);
        }
    }

    // Function to preview the item once activated
    onItemActivate(item: IEventOrPlanningItem, force?: boolean) {
        if ((this.props.previewItem || force) && item && this.props.previewItem !== item._id) {
            this.props.onItemClick(item);
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            groups,
            onDoubleClick,
            onAddCoverageClick,
            lockedItems,
            agendas,
            session,
            privileges,
            calendars,
            activeFilter,
            showRelatedPlannings,
            relatedPlanningsInList,
            onMultiSelectClick,
            selectedEventIds,
            selectedPlanningIds,
            itemActions,
            loadingIndicator,
            users,
            desks,
            showAddCoverage,
            hideItemActions,
            listFields,
            isAllListItemsLoaded,
            indexItems,
            previewItem,
            contentTypes,
            contacts,
            listViewType,
            sortField,
        } = this.props;

        let indexFrom = 0;

        return (
            <div>
                {loadingIndicator &&
                <div className="loading-indicator">{gettext('Loading')}</div>}
                {!loadingIndicator && groups.length <= 0 && (
                    <PanelInfo
                        heading={gettext('No Event or Planning items found')}
                        description={gettext('Create new items or change your search filters')}
                    />
                )}
                {groups.length > 0 && (
                    <div
                        key="groups"
                        className="sd-column-box__main-column__items"
                        onScroll={this.handleScroll}
                        ref={(node) => this.dom.list = node}
                        onKeyDown={this.handleKeyDown}
                    >
                        {groups.map((group, i) => {
                            const propsForNestedListItems = {
                                navigateDown: this.state.navigateDown, // tells the direction of navigation
                                navigateList: this.navigateListWorker, // transfer navigation control to this component
                                onItemActivate: this.onItemActivate, // prop to preview nested item on activation
                                previewItem: previewItem, // prop to tell if item is being previewed currently
                            };

                            const listBoxGroupId = `list-panel-${i}`;
                            const activeItemInThisGroup = this.state.activeItemIndex >= indexFrom
                                && this.state.activeItemIndex < indexFrom + group.events.length;
                            const getChildId = (childIndex) => `${listBoxGroupId}--${childIndex}`;
                            const activeDescendantIndex = this.state.activeItemIndex - indexFrom;

                            const listBoxGroupProps: IAccessibleListBox = {
                                containerProps: {
                                    role: 'listbox',
                                    tabIndex: 0,
                                    'aria-activedescendant':
                                        activeItemInThisGroup ? getChildId(activeDescendantIndex) : undefined,
                                },
                                groupId: listBoxGroupId,
                                getChildId: getChildId,
                            };

                            let listGroupProps: {[key: string]: any} = {
                                name: group.date,
                                items: group.events,
                                onItemClick: this.onItemClick,
                                onDoubleClick: onDoubleClick,
                                onAddCoverageClick: onAddCoverageClick,
                                lockedItems: lockedItems,
                                agendas: agendas,
                                contentTypes: contentTypes,
                                session: session,
                                privileges: privileges,
                                calendars: calendars,
                                activeFilter: activeFilter,
                                showRelatedPlannings: showRelatedPlannings,
                                relatedPlanningsInList: relatedPlanningsInList,
                                onMultiSelectClick: onMultiSelectClick,
                                selectedEventIds: selectedEventIds,
                                selectedPlanningIds: selectedPlanningIds,
                                itemActions: itemActions,
                                users: users,
                                desks: desks,
                                showAddCoverage: showAddCoverage,
                                hideItemActions: hideItemActions,
                                listFields: listFields,
                                contacts: contacts,
                                listViewType: listViewType,
                                sortField: sortField,
                                listBoxGroupProps: listBoxGroupProps,
                                ...propsForNestedListItems,
                            };

                            if (indexItems) {
                                listGroupProps.activeItemIndex = this.state.activeItemIndex;
                                listGroupProps.indexItems = true;
                                listGroupProps.indexFrom = indexFrom;

                                // increment each iteration
                                indexFrom = indexFrom + group.events.length ?? 0;
                            }

                            return (
                                <ListGroup
                                    key={group.date}
                                    {...listGroupProps}
                                />
                            );
                        })}
                        {!isAllListItemsLoaded && (
                            <div className="ListGroup">
                                <Group>
                                    <Item noBg={true}>
                                        <Column grow={true}>
                                            <div
                                                className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--align"
                                            >
                                                {gettext('loading more items...')}
                                            </div>
                                        </Column>
                                    </Item>
                                </Group>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}
