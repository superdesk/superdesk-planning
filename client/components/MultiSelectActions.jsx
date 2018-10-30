import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {every, get, some} from 'lodash';
import {eventUtils, planningUtils, gettext} from '../utils';
import {MAIN} from '../constants';
import {SlidingToolBar} from './UI/SubNav';
import {Button} from './UI';
import eventsUi from '../actions/events/ui';
import planningUi from '../actions/planning/ui';


export class MultiSelectActionsComponent extends React.PureComponent {
    constructor(props) {
        super(props);

        this.itemSpike = this.itemSpike.bind(this);
        this.itemUnSpike = this.itemUnSpike.bind(this);
        this.createPlanning = this.createPlanning.bind(this);
        this.handleDeSelectAll = this.handleDeSelectAll.bind(this);
    }

    handleSelectAll() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            this.props.selectAllEvents();
        } else {
            this.props.selectAllPlannings();
        }
    }

    handleDeSelectAll() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            this.props.deSelectAllEvents();
        } else {
            this.props.deSelectAllPlannings();
        }
        if (this.props.isTotalSelected) {
            this.props.setIsTotalSelected(false);
            this.fetchTotalItems();
        }
    }

    handleSelectTotal() {
        this.props.setIsTotalSelected(true);

        this.fetchTotalItems().then((data) => {
            this.handleSelectAll();
        });
    }

    fetchTotalItems() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            return this.props.refetchAllEvents();
        } else {
            return this.props.refetchAllPlannings();
        }
    }

    getCountLabel() {
        let count = get(this.props.selectedEvents, 'length', 0);
        let itemType = count > 1 ? gettext('events') : gettext('event');

        if (this.props.activeFilter === MAIN.FILTERS.PLANNING) {
            count = get(this.props.selectedPlannings, 'length', 0);
            itemType = count > 1 ? gettext('planning items') : gettext('planning item');
        }

        if (this.props.isTotalSelected) {
            count = this.props.activeFilter === MAIN.FILTERS.PLANNING ?
                this.props.totalPlannings : this.props.totalEvents;
        }

        return gettext('{{ count }} {{ type }} selected', {count: count, type: itemType});
    }

    canSelectAll() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            return get(this.props, 'selectedEvents.length') <
                get(this.props, 'eventsInList.length');
        } else {
            return get(this.props, 'selectedPlannings.length') <
                get(this.props, 'plansInList.length');
        }
    }

    canSelectTotal() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            return get(this.props, 'selectedEvents.length') <
                get(this.props, 'totalEvents');
        } else {
            return get(this.props, 'selectedPlannings.length') <
                get(this.props, 'totalPlannings');
        }
    }

    getMultiActionTools() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            return this.getEventTools();
        } else {
            return this.getPlanningTools();
        }
    }

    getPlanningTools() {
        const {
            selectedPlannings,
            privileges,
            session,
            lockedItems,
        } = this.props;

        const showSpike = every(
            selectedPlannings,
            (plan) => planningUtils.canSpikePlanning(plan, session, privileges, lockedItems)
        );

        const showUnspike = every(
            selectedPlannings,
            (plan) => planningUtils.canUnspikePlanning(plan, plan.event, privileges)
        );

        const showExport = !some(selectedPlannings, 'flags.marked_for_not_publication');

        let tools = [];

        if (showExport) {
            tools.push(<Button
                key={1}
                onClick={this.props.exportAsArticle}
                color="primary"
                text={gettext('Export as article')} />);
        }

        if (showSpike) {
            tools.push(<Button
                key={2}
                onClick={this.itemSpike}
                color="alert"
                text={gettext('Spike')}
                icon="icon-trash" />);
        }

        if (showUnspike) {
            tools.push(<Button
                key={3}
                onClick={this.itemUnSpike}
                color="warning"
                icon="icon-unspike"
                text={gettext('Unspike')} />);
        }

        return tools;
    }

    getEventTools() {
        const {
            selectedEvents,
            privileges,
            session,
            lockedItems,
        } = this.props;

        const showSpike = every(
            selectedEvents,
            (event) => eventUtils.canSpikeEvent(event, session, privileges, lockedItems)
        );

        const showUnspike = every(
            selectedEvents,
            (event) => eventUtils.canUnspikeEvent(event, privileges)
        );

        const showCreatePlan = every(
            selectedEvents,
            (event) => eventUtils.canCreatePlanningFromEvent(event, session, privileges, lockedItems)
        );

        let tools = [];

        if (showCreatePlan) {
            tools.push(<Button
                key={1}
                onClick={this.createPlanning}
                color="primary"
                text={gettext('Create planning')} />);
        }

        if (showSpike) {
            tools.push(<Button
                key={2}
                onClick={this.itemSpike}
                color="alert"
                text={gettext('Spike')}
                icon="icon-trash" />);
        }

        if (showUnspike) {
            tools.push(<Button
                key={3}
                onClick={this.itemUnSpike}
                color="warning"
                text={gettext('Unspike')}
                icon="icon-unspike" />);
        }

        return tools;
    }

    getItemList() {
        return this.props.activeFilter === MAIN.FILTERS.EVENTS ?
            this.props.selectedEvents : this.props.selectedPlannings;
    }

    itemSpike() {
        this.props.spikeItems(this.getItemList());
    }

    itemUnSpike() {
        this.props.unspikeItems(this.getItemList());
    }

    createPlanning() {
        this.props.addEventToCurrentAgenda(this.getItemList());
    }

    render() {
        const {
            activeFilter,
            selectedPlanningIds,
            selectedEventIds,
            totalEvents,
            totalPlannings,
        } = this.props;

        const hideSlidingToolBar = (activeFilter === MAIN.FILTERS.PLANNING &&
            get(selectedPlanningIds, 'length') === 0) ||
            (activeFilter === MAIN.FILTERS.EVENTS && get(selectedEventIds, 'length') === 0) ||
            activeFilter === MAIN.FILTERS.COMBINED;

        let totalItems = activeFilter === MAIN.FILTERS.EVENTS ? totalEvents : totalPlannings;

        let innerTools = [(<a key={1} onClick={this.handleDeSelectAll.bind(this)}>{gettext('Deselect All')}</a>)];

        if (this.canSelectTotal() && !this.canSelectAll() && !this.props.isTotalSelected) {
            innerTools.unshift(<span key={4}>{' / '}</span>);
            innerTools.unshift(<a key={5} onClick={this.handleSelectTotal.bind(this)}>
                {gettext(` Select all ${totalItems} items`)}</a>);
        }
        if (this.canSelectAll()) {
            innerTools.unshift(<span key={2}>{' / '}</span>);
            innerTools.unshift(<a key={3} onClick={this.handleSelectAll.bind(this)}>{gettext('Select all')}</a>);
        }

        return (<SlidingToolBar
            onCancel={this.handleDeSelectAll}
            hide={hideSlidingToolBar}
            innerInfo={gettext(this.getCountLabel())}
            innerTools={innerTools}
            tools={this.getMultiActionTools()} />);
    }
}

MultiSelectActionsComponent.propTypes = {
    selectedEvents: PropTypes.array,
    selectAllEvents: PropTypes.func,
    handleSelectTotal: PropTypes.func,
    deSelectAllEvents: PropTypes.func,
    selectedPlannings: PropTypes.array,
    selectAllPlannings: PropTypes.func,
    deSelectAllPlannings: PropTypes.func,
    privileges: PropTypes.object.isRequired,
    session: PropTypes.object.isRequired,
    lockedItems: PropTypes.object,
    activeFilter: PropTypes.string,
    exportAsArticle: PropTypes.func,
    createPlanning: PropTypes.func,
    spikeItems: PropTypes.func,
    unspikeItems: PropTypes.func,
    addEventToCurrentAgenda: PropTypes.func,
    selectedPlanningIds: PropTypes.array,
    selectedEventIds: PropTypes.array,
    refetchAllEvents: PropTypes.func,
    refetchAllPlannings: PropTypes.func,
    totalEvents: PropTypes.number,
    totalPlannings: PropTypes.number,
    setIsTotalSelected: PropTypes.func,
    isTotalSelected: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    activeFilter: selectors.main.activeFilter(state),
    selectedEvents: selectors.multiSelect.selectedEvents(state),
    eventsInList: selectors.events.eventIdsInList(state),
    selectedPlannings: selectors.multiSelect.selectedPlannings(state),
    plansInList: selectors.planning.planIdsInList(state),
    privileges: selectors.general.privileges(state),
    session: selectors.general.session(state),
    lockedItems: selectors.locks.getLockedItems(state),
    selectedEventIds: selectors.multiSelect.selectedEventIds(state),
    selectedPlanningIds: selectors.multiSelect.selectedPlanningIds(state),
    totalEvents: selectors.main.eventsTotalItems(state),
    totalPlannings: selectors.main.planningTotalItems(state),
    isTotalSelected: selectors.multiSelect.isTotalSelected(state),
});

const mapDispatchToProps = (dispatch) => ({
    selectAllEvents: () => dispatch(actions.multiSelect.selectEvents(null, true)),
    deSelectAllEvents: () => dispatch(actions.multiSelect.deSelectEvents(null, true)),
    selectAllPlannings: () => dispatch(actions.multiSelect.selectPlannings(null, true)),
    deSelectAllPlannings: () => dispatch(actions.multiSelect.deSelectPlannings(null, true)),
    addEventToCurrentAgenda: (events) => dispatch(actions.askForAddEventToCurrentAgenda(events)),
    spikeItems: (items) => dispatch(actions.multiSelect.itemBulkSpikeModal(items)),
    unspikeItems: (items) => dispatch(actions.multiSelect.itemBulkUnSpikeModal(items)),
    exportAsArticle: () => dispatch(actions.planning.api.exportAsArticle()),
    refetchAllEvents: () => dispatch(eventsUi.refetch()),
    refetchAllPlannings: () => dispatch(planningUi.refetch()),
    setIsTotalSelected: (item) => dispatch(actions.multiSelect.isTotalSelected(item)),
});


export const MultiSelectActions = connect(mapStateToProps, mapDispatchToProps)(MultiSelectActionsComponent);
