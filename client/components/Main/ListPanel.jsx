import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {ListGroup} from '.';
import {PanelInfo} from '../UI';
import {Item, Column, Group} from '../UI/List';
import {gettext} from '../../utils/gettext';
import {onEventCapture} from '../../utils';
import {KEYCODES, MAIN} from '../../constants';
import './style.scss';

export class ListPanel extends React.Component {
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
        if (!get(nextProps, 'loadingIndicator') &&
            !!get(this.props, 'loadingIndicator') &&
            this.dom.list &&
            !this.state.isNextPageLoading
        ) {
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
        if (this.isNestedItem(this.state.activeItemIndex)) {
            return;
        }

        if (![KEYCODES.UP, KEYCODES.DOWN, KEYCODES.ENTER].includes(get(event, 'keyCode'))) {
            return;
        }

        onEventCapture(event);

        // If we have an item selected and 'enter' was pressed, lets preview it
        if (get(event, 'keyCode') === KEYCODES.ENTER && this.state.activeItemIndex >= 0) {
            const item = this.getItemFromGroups(this.state.activeItemIndex);

            if (item) {
                this.props.onItemClick(item);
            }
        }

        this.navigateListWorker(get(event, 'keyCode') === KEYCODES.DOWN);
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
    onItemActivate(item, force) {
        if ((this.props.previewItem || force) && item && this.props.previewItem !== item._id) {
            this.props.onItemClick(item);
        }
    }

    render() {
        const {
            groups,
            onDoubleClick,
            onAddCoverageClick,
            lockedItems,
            dateFormat,
            timeFormat,
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
        } = this.props;

        let indexFrom = 0;

        return (
            <div>
                {loadingIndicator &&
                <div className="loading-indicator">{gettext('Loading')}</div>}
                {!loadingIndicator && groups.length <= 0 &&
                <PanelInfo
                    heading={gettext('No Event or Planning items found')}
                    description={gettext('Create new items or change your search filters')}
                />}
                {groups.length > 0 &&
                <div key="groups" className="sd-column-box__main-column__items"
                    onScroll={this.handleScroll}
                    ref={(node) => this.dom.list = node}
                    onKeyDown={this.handleKeyDown}
                    tabIndex="0" >
                    {groups.map((group, index) => {
                        const propsForNestedListItems = {
                            navigateDown: this.state.navigateDown, // tells the direction of navigation
                            navigateList: this.navigateListWorker, // transfer navigation control to 'this' component
                            onItemActivate: this.onItemActivate, // prop to preview nested item on activation
                            previewItem: previewItem, // prop to tell if item is being previewed currently
                        };

                        let listGroupProps = {
                            name: group.date,
                            items: group.events,
                            onItemClick: this.onItemClick,
                            onDoubleClick: onDoubleClick,
                            onAddCoverageClick: onAddCoverageClick,
                            lockedItems: lockedItems,
                            dateFormat: dateFormat,
                            timeFormat: timeFormat,
                            agendas: agendas,
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
                            contentTypes: contentTypes,
                            ...propsForNestedListItems,
                        };

                        if (indexItems) {
                            listGroupProps.activeItemIndex = this.state.activeItemIndex;
                            listGroupProps.indexItems = true;
                            listGroupProps.indexFrom = indexFrom;
                            indexFrom = indexFrom + get(group, 'events.length', 0);
                        }

                        return <ListGroup key={group.date} {...listGroupProps} />;
                    })}
                    {!isAllListItemsLoaded &&
                        <div className="ListGroup">
                            <Group>
                                <Item noBg={true}>
                                    <Column grow={true}>
                                        <div className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--align">
                                            {gettext('loading more items...')}
                                        </div>
                                    </Column>
                                </Item>
                            </Group>
                        </div>
                    }
                </div>}
            </div>
        );
    }
}

ListPanel.propTypes = {
    groups: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    lockedItems: PropTypes.object.isRequired,
    editItem: PropTypes.object,
    previewItem: PropTypes.string,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    loadMore: PropTypes.func.isRequired,
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    itemActions: PropTypes.object,
    filter: PropTypes.func,
    loadingIndicator: PropTypes.bool,
    showAddCoverage: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    listFields: PropTypes.object,
    calendars: PropTypes.array,
    isAllListItemsLoaded: PropTypes.bool,
    indexItems: PropTypes.bool,
    navigateDown: PropTypes.bool,
    navigateList: PropTypes.func,
    onItemActivate: PropTypes.func,
    contentTypes: PropTypes.array,
};
