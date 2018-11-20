import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {ListGroup} from '.';
import {PanelInfo} from '../UI';
import {Item, Column, Group} from '../UI/List';
import {gettext} from '../../utils/gettext';
import './style.scss';

export class ListPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isNextPageLoading: false,
            scrollTop: 0,
        };

        this.dom = {list: null};

        this.handleScroll = this.handleScroll.bind(this);
        this.unsetNextPageLoading = this.unsetNextPageLoading.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'activeFilter') !== get(this.props, 'activeFilter')) {
            this.setState({
                isNextPageLoading: false,
                scrollTop: 0,
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
        }
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

    render() {
        const {
            groups,
            onItemClick,
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
        } = this.props;

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
                >
                    {groups.map((group) => {
                        const listGroupProps = {
                            name: group.date,
                            items: group.events,
                            onItemClick: onItemClick,
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
                        };

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
    previewItem: PropTypes.object,
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
};
