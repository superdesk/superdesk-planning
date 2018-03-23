import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {ListGroup} from '.';
import {PanelInfo} from '../UI';
import {gettext} from '../../utils';
import './style.scss';

export class ListPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isNextPageLoading: false,
            scrollTop: 0
        };
        this.handleScroll = this.handleScroll.bind(this);
        this.unsetNextPageLoading = this.unsetNextPageLoading.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'activeFilter') !== get(this.props, 'activeFilter')) {
            this.setState({
                isNextPageLoading: false,
                scrollTop: 0
            });
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
            activeFilter,
            showRelatedPlannings,
            relatedPlanningsInList,
            currentWorkspace,
            onMultiSelectClick,
            selectedEventIds,
            selectedPlanningIds,
            itemActions,
            loadingIndicator,
            users,
            desks,
        } = this.props;

        return (
            <div>
                {loadingIndicator &&
                <div className="loading-indicator">{gettext('Loading')}</div>}
                {!loadingIndicator && groups.length <= 0 &&
                <PanelInfo
                    heading="No Event or Planning items found"
                    description="Create new items or change your search filters"
                />}
                {groups.length > 0 &&
                <div className="sd-column-box__main-column__items"
                    onScroll={this.handleScroll}>
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
                            activeFilter: activeFilter,
                            showRelatedPlannings: showRelatedPlannings,
                            relatedPlanningsInList: relatedPlanningsInList,
                            currentWorkspace: currentWorkspace,
                            onMultiSelectClick: onMultiSelectClick,
                            selectedEventIds: selectedEventIds,
                            selectedPlanningIds: selectedPlanningIds,
                            itemActions: itemActions,
                            users: users,
                            desks: desks,
                        };

                        return <ListGroup key={group.date} {...listGroupProps} />;
                    })}
                </div>
                }
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
    currentWorkspace: PropTypes.string,
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    itemActions: PropTypes.object,
    filter: PropTypes.func,
    loadingIndicator: PropTypes.bool
};

