import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {every} from 'lodash';
import {eventUtils, planningUtils, gettext} from '../utils';
import {MAIN} from '../constants';
import {SlidingToolBar} from './UI/SubNav';
import {Button} from './UI';
import {IEventItem, ILockedItems, IPlanningItem, IPrivileges, ISession} from 'interfaces';
import {addSomeEventsAsRelatedToPlanningEditor, canAddSomeEventsAsRelatedToPlanningEditor} from '../utils/events';
import {superdeskApi} from '../superdeskApi';

interface IReduxState {
    selectedEvents: Array<any>;
    eventsInList: Array<any>;
    selectedPlannings: Array<IPlanningItem>;
    privileges: IPrivileges;
    session: ISession;
    lockedItems: ILockedItems;
    activeFilter: any;
    selectedPlanningIds: Array<string>;
    selectedEventIds: Array<string>;
    plansInList: any;
}

interface IDispatchProps {
    selectAllEvents(): void;
    deSelectAllEvents(): void;
    selectAllPlannings(): void;
    deSelectAllPlannings(): void;
    addToWorkflow(items): void;
    exportAsArticle(items, download): void;
    spikeItems(items): void;
    unspikeItems(items): void;
    addEventToCurrentAgenda(events): void;
}

type IProps = IReduxState & IDispatchProps;

export class MultiSelectActionsComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.exportArticle = this.exportArticle.bind(this);
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
    }

    getCountLabel() {
        let count = this.props.selectedEvents?.length ?? 0;
        let itemType = count > 1 ? gettext('events') : gettext('event');

        if (this.props.activeFilter === MAIN.FILTERS.PLANNING) {
            count = this.props.selectedPlannings?.length ?? 0;
            itemType = count > 1 ? gettext('planning items') : gettext('planning item');
        }

        return gettext('{{ count }} {{ type }} selected', {count: count, type: itemType});
    }

    canSelectAll() {
        if (this.props.activeFilter === MAIN.FILTERS.EVENTS) {
            return (this.props.selectedEvents?.length ?? 0) < (this.props.eventsInList?.length ?? 0);
        } else {
            return (this.props.selectedPlannings?.length ?? 0) < (this.props.plansInList?.length ?? 0);
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
            (planningItem) => {
                const events: Array<IEventItem> = [planningItem.event]; // TAG: MULTIPLE_PRIMARY_EVENTS

                return planningUtils.canUnspikePlanning(planningItem, events, privileges);
            }
        );

        const showExport = selectedPlannings.every((planning) => planning.flags.marked_for_not_publication !== true);

        let tools = [];

        if (selectedPlannings.every((planning) => planning.lock_action == null)) {
            tools.push(
                <Button
                    key={0}
                    hollow={true}
                    onClick={() => {
                        this.props.addToWorkflow(this.getItemList());
                    }}
                    text={gettext('Add to workflow')}
                />
            );
        }
        if (showExport) {
            tools.push(
                <Button
                    key={1}
                    hollow={true}
                    onClick={this.exportArticle}
                    text={gettext('Export')}
                />
            );
        }

        if (showSpike) {
            tools.push(
                <Button
                    key={2}
                    onClick={this.itemSpike}
                    color="alert"
                    hollow={true}
                    text={gettext('Spike')}
                    icon="icon-trash"
                />
            );
        }

        if (showUnspike) {
            tools.push(
                <Button
                    key={3}
                    onClick={this.itemUnSpike}
                    color="warning"
                    icon="icon-unspike"
                    text={gettext('Unspike')}
                />
            );
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

        const {gettextPlural} = superdeskApi.localization;

        let tools = [(
            <Button
                key={0}
                onClick={this.exportArticle}
                hollow
                text={gettext('Export')}
            />
        ), (
            <Button
                key={1}
                onClick={this.exportArticle.bind(null, true)}
                color="primary"
                text={gettext('Download')}
            />
        )];

        if (showCreatePlan) {
            tools.push(
                <Button
                    key={2}
                    onClick={this.createPlanning}
                    color="primary"
                    text={gettext('Create planning')}
                />
            );
        }

        if (showSpike) {
            tools.push(
                <Button
                    key={3}
                    onClick={this.itemSpike}
                    color="alert"
                    hollow={true}
                    text={gettext('Spike')}
                    icon="icon-trash"
                />
            );
        }

        if (showUnspike) {
            tools.push(
                <Button
                    key={4}
                    onClick={this.itemUnSpike}
                    color="warning"
                    text={gettext('Unspike')}
                    icon="icon-unspike"
                />
            );
        }

        if (canAddSomeEventsAsRelatedToPlanningEditor(selectedEvents.map(({_id}) => _id))) {
            tools.push(
                <Button
                    key={5}
                    onClick={() => {
                        addSomeEventsAsRelatedToPlanningEditor(selectedEvents.map(({_id}) => _id));
                    }}
                    hollow
                    text={gettextPlural(selectedEvents.length, 'Add as related event', 'Add as related events')}
                />
            );
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

    exportArticle(download) {
        this.props.exportAsArticle(this.getItemList(), download === true);
    }

    render() {
        const {
            activeFilter,
            selectedPlanningIds,
            selectedEventIds,
        } = this.props;

        const hideSlidingToolBar =
            (
                activeFilter === MAIN.FILTERS.PLANNING &&
                selectedPlanningIds.length === 0
            )
            || (
                activeFilter === MAIN.FILTERS.EVENTS && selectedEventIds.length === 0
            )
            || activeFilter === MAIN.FILTERS.COMBINED;

        if (hideSlidingToolBar) {
            return null;
        }

        let innerTools = [(<a key={1} onClick={this.handleDeSelectAll.bind(this)}>{gettext('Deselect All')}</a>)];

        if (this.canSelectAll()) {
            innerTools.unshift(<span key={2}>{' / '}</span>);
            innerTools.unshift(<a key={3} onClick={this.handleSelectAll.bind(this)}>{gettext('Select all')}</a>);
        }

        return (
            <SlidingToolBar
                onCancel={this.handleDeSelectAll}
                hide={hideSlidingToolBar}
                innerInfo={gettext(this.getCountLabel())}
                innerTools={innerTools}
                tools={this.getMultiActionTools()}
            />
        );
    }
}

const mapStateToProps = (state): IReduxState => ({
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
});

const mapDispatchToProps = (dispatch): IDispatchProps => ({
    selectAllEvents: () => dispatch(actions.multiSelect.selectEvents(null, true)),
    deSelectAllEvents: () => dispatch(actions.multiSelect.deSelectEvents(null, true)),
    selectAllPlannings: () => dispatch(actions.multiSelect.selectPlannings(null, true)),
    deSelectAllPlannings: () => dispatch(actions.multiSelect.deSelectPlannings(null, true)),
    addEventToCurrentAgenda: (events) => dispatch(actions.askForAddEventToCurrentAgenda(events)),
    spikeItems: (items) => dispatch(actions.multiSelect.itemBulkSpikeModal(items)),
    unspikeItems: (items) => dispatch(actions.multiSelect.itemBulkUnSpikeModal(items)),
    exportAsArticle: (items, download) => dispatch(actions.multiSelect.exportAsArticle(items, download)),
    addToWorkflow: (items) => dispatch(actions.multiSelect.bulkAddPlanningCoveragesToWorkflow(items)),
});


export const MultiSelectActions = connect(mapStateToProps, mapDispatchToProps)(MultiSelectActionsComponent);
