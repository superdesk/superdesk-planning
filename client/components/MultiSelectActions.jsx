import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {every, get} from 'lodash';
import {eventUtils, planningUtils, gettext} from '../utils';
import {MAIN} from '../constants';
import {SlidingToolBar} from './UI/SubNav';
import {Button} from './UI';

export class MultiSelectActionsComponent extends React.PureComponent {
    constructor(props) {
        super(props);

        this.itemSpike = this.itemSpike.bind(this);
        this.itemUnSpike = this.itemUnSpike.bind(this);
        this.createPlanning = this.createPlanning.bind(this);
        this.handleDeSelectAll = this.handleDeSelectAll.bind(this);
    }

    handleSelectAll() {
        if (this.props.activeFilter == MAIN.FILTERS.EVENTS) {
            this.props.selectAllEvents();
        } else {
            this.props.selectAllPlannings();
        }
    }

    handleDeSelectAll() {
        if (this.props.activeFilter == MAIN.FILTERS.EVENTS) {
            this.props.deSelectAllEvents();
        } else {
            this.props.deSelectAllPlannings();
        }
    }

    getCountLabel() {
        let count = get(this.props.selectedEvents, 'length', 0);
        let itemType = 'event';

        if (this.props.activeFilter == MAIN.FILTERS.PLANNING) {
            count = get(this.props.selectedPlannings, 'length', 0);
            itemType = 'planning item';
        }

        return count + ' ' + (count > 1 ? itemType + 's' : itemType) + ' selected';
    }

    canSelectAll() {
        if (this.props.activeFilter == MAIN.FILTERS.EVENTS) {
            return get(this.props, 'selectedEvents.length') <
                get(this.props, 'eventsInList.length');
        } else {
            return get(this.props, 'selectedPlannings.length') <
                get(this.props, 'plansInList.length');
        }
    }

    getMultiActionTools() {
        if (this.props.activeFilter == MAIN.FILTERS.EVENTS) {
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

        let tools = [<Button
            key={1}
            onClick={this.props.exportAsArticle}
            color="primary"
            text={gettext('Export as article')} />];

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
        } = this.props;

        const hideSlidingToolBar = (activeFilter === MAIN.FILTERS.PLANNING &&
            get(selectedPlanningIds, 'length') === 0) ||
            (activeFilter === MAIN.FILTERS.EVENTS && get(selectedEventIds, 'length') === 0) ||
            activeFilter === MAIN.FILTERS.COMBINED;

        let innerTools = [(<a key={1} onClick={this.handleDeSelectAll.bind(this)}>{gettext('Deselect All')}</a>)];

        if (this.canSelectAll()) {
            innerTools.unshift(<a key={2} onClick={this.handleSelectAll.bind(this)}>{gettext('Select all / ')}</a>);
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
};

const mapStateToProps = (state) => ({
    activeFilter: selectors.main.activeFilter(state),
    selectedEvents: selectors.multiSelect.selectedEvents(state),
    eventsInList: selectors.events.eventIdsInList(state),
    selectedPlannings: selectors.multiSelect.selectedPlannings(state),
    plansInList: selectors.planning.planIdsInList(state),
    privileges: selectors.getPrivileges(state),
    session: selectors.getSessionDetails(state),
    lockedItems: selectors.locks.getLockedItems(state),
    selectedEventIds: selectors.multiSelect.selectedEventIds(state),
    selectedPlanningIds: selectors.multiSelect.selectedPlanningIds(state),
});

const mapDispatchToProps = (dispatch) => ({
    selectAllEvents: () => dispatch(actions.multiSelect.selectEvents(null, true)),
    deSelectAllEvents: () => dispatch(actions.multiSelect.deSelectEvents(null, true)),
    selectAllPlannings: () => dispatch(actions.multiSelect.selectPlannings(null, true)),
    deSelectAllPlannings: () => dispatch(actions.multiSelect.deSelectPlannings(null, true)),
    addEventToCurrentAgenda: (events) => dispatch(actions.askForAddEventToCurrentAgenda(events)),
    spikeItems: (items) => dispatch(actions.multiSelect.itemBulkSpikeModal(items)),
    unspikeItems: (items) => dispatch(actions.multiSelect.itemBulkUnSpikeModal(items)),
    exportAsArticle: () => dispatch(actions.planning.api.exportAsArticle())
});


export const MultiSelectActions = connect(mapStateToProps, mapDispatchToProps)(MultiSelectActionsComponent);
