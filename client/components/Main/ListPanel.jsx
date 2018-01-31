import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {ListGroup} from '.';
import {PanelInfo} from '../UI';
import {EVENTS, PLANNING} from '../../constants';

export class ListPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isNextPageLoading: false,
            scrollTop: 0
        };
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'activeFilter') !== get(this.props, 'activeFilter')) {
            this.setState({
                isNextPageLoading: false,
                scrollTop: 0
            });
        }
    }

    handleScroll(event) {
        if (this.state.isNextPageLoading) {
            return;
        }

        const node = event.target;

        // scroll event gets fired on hover of each item in the list.
        // this.state.scrollTop is used to check if the scroll position has changed
        if (node && node.scrollTop + node.offsetHeight + 50 >= node.scrollHeight &&
            this.state.scrollTop !== node.scrollTop) {
            this.setState({isNextPageLoading: true, scrollTop: node.scrollTop});

            this.props.loadMore(this.props.activeFilter)
                .then(() => {
                    this.setState({isNextPageLoading: false});
                });
        }

        if (node.scrollTop === 0 && this.state.scrollTop > 0) {
            this.setState({isNextPageLoading: true, scrollTop: 0});

            this.props.filter(this.props.activeFilter)
                .then(() => {
                    this.setState({isNextPageLoading: false});
                });
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
        } = this.props;

        return groups.length <= 0 ? (
            <div className="sd-column-box__main-column">
                <PanelInfo
                    heading="No Event or Planning items found"
                    description="Create new items or change your search filters"
                />
            </div>
        ) : (
            <div className="sd-column-box__main-column"
                onScroll={this.handleScroll.bind(this)}>
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
                        [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
                        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
                        [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
                        [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
                        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
                        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
                        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
                        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
                        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
                        [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
                        [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
                        [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
                        [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
                        [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
                    };

                    return <ListGroup key={group.date} {...listGroupProps} />;
                })}
            </div>
        );
    }
}

ListPanel.propTypes = {
    groups: PropTypes.array,
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
    filter: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func
};

