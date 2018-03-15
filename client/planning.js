import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {indexOf} from 'lodash';

import {
    SubNavBar,
    FiltersBar,
    SearchPanel,
    PreviewPanel,
    Editor,
    ListPanel
} from './components/Main';
import {WorkqueueContainer, ModalsContainer} from './components';

import {getItemType, planningUtils} from './utils';

import './planning.scss';

import * as actions from './actions';
import * as selectors from './selectors';
import {EVENTS, PLANNING, ITEM_TYPE} from './constants';

class PlanningAppComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersOpen: false,
            previewOpen: !!props.previewId,
            initialLoad: false,
        };

        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDoubleClick = this.onItemDoubleClick.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.addEvent = this.addEvent.bind(this);
        this.addPlanning = this.addPlanning.bind(this);
        this.handleItemSelection = this.handleItemSelection.bind(this);
    }

    toggleFilterPanel() {
        this.setState({filtersOpen: !this.state.filtersOpen});
    }

    onItemClick(item) {
        this.props.preview(item);
        this.setState({
            previewOpen: true,
            initialLoad: !this.state.previewOpen,
        });
    }

    onItemDoubleClick(item) {
        if (!!this.props.addNewsItemToPlanning &&
                planningUtils.isLockedForAddToPlanning(this.props.editItem)) {
            // Currently edited item is locked for add_to_planning, release lock on it
            // Unlock this item and close editor first
            this.props.cancel(this.props.editItem);
        }

        this.props.edit(item);
    }

    closePreview() {
        this.setState({
            previewOpen: false,
            initialLoad: false,
        });

        this.props.closePreview();
    }

    addEvent() {
        this.props.edit({_type: ITEM_TYPE.EVENT});
    }

    addPlanning() {
        const newPlanning = {_type: ITEM_TYPE.PLANNING};

        if (this.props.addNewsItemToPlanning) {
            this.onItemDoubleClick(newPlanning);
        } else {
            this.props.edit(newPlanning);
        }
    }

    handleItemSelection(item) {
        let selectedList = this.props.selectedEventIds;
        let multiSelectDispatch = this.props.multiSelectEvent;

        if (getItemType(item) === ITEM_TYPE.PLANNING) {
            selectedList = this.props.selectedPlanningIds;
            multiSelectDispatch = this.props.multiSelectPlanning;
        }

        const deSelect = indexOf(selectedList, item._id) !== -1;

        multiSelectDispatch(item._id, deSelect);
    }

    render() {
        const sectionClassName = classNames(
            'sd-content sd-content--margin-b30 sd-page-content--slide-in',
            {'sd-page-content--slide-in--open': !!this.props.editItemType}
        );

        const contentBlockFlags = {
            'open-filters': this.state.filtersOpen,
            'open-preview': this.state.previewOpen && !!this.props.previewId,
        };

        const mainClassName = classNames(
            'sd-page-content__content-block',
            'sd-page-content__content-block--main',
            contentBlockFlags
        );

        const editorClassName = classNames(
            'sd-edit-panel',
            'sd-page-content__content-block',
            'sd-page-content__content-block--right',
            'sd-page-content__content-block--30-slide',
            contentBlockFlags
        );

        const {
            groups,
            addNewsItemToPlanning,
            agendas,
            enabledAgendas,
            disabledAgendas,
            lockedItems,
            dateFormat,
            timeFormat,
            session,
            privileges,
            activeFilter,
            currentWorkspace,
            onAddCoverageClick,
            showRelatedPlannings,
            relatedPlanningsInList,
            loadMore,
            selectedEventIds,
            selectedPlanningIds,
            openAgendas,
            fullText,
            search,
            selectAgenda,
            currentAgendaId,
            filter,
            loadingIndicator,
            users,
            desks,
            isViewFiltered,
            clearSearch
        } = this.props;

        const itemActions = {
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
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName],
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

        const listPanelProps = {
            groups: groups,
            onItemClick: this.onItemClick,
            onDoubleClick: this.onItemDoubleClick,
            agendas: agendas,
            lockedItems: lockedItems,
            dateFormat: dateFormat,
            timeFormat: timeFormat,
            session: session,
            privileges: privileges,
            activeFilter: activeFilter,
            currentWorkspace: currentWorkspace,
            onAddCoverageClick: onAddCoverageClick,
            onMultiSelectClick: this.handleItemSelection,
            selectedEventIds: selectedEventIds,
            selectedPlanningIds: selectedPlanningIds,
            showRelatedPlannings: showRelatedPlannings,
            relatedPlanningsInList: relatedPlanningsInList,
            loadMore: loadMore,
            filter: filter,
            loadingIndicator: loadingIndicator,
            itemActions: itemActions,
            desks: desks,
            users: users,
        };

        return (
            <section className={sectionClassName}>
                <div className={mainClassName}>
                    <SubNavBar
                        addEvent={this.addEvent}
                        addPlanning={this.addPlanning}
                        openAgendas={openAgendas}
                        value={fullText}
                        search={search}
                        activeFilter={activeFilter}
                        createPlanningOnly={!!addNewsItemToPlanning}
                        disableAgendaManagement={!!addNewsItemToPlanning}
                    />
                    <FiltersBar
                        filterPanelOpen={this.state.filtersOpen}
                        toggleFilterPanel={this.toggleFilterPanel}
                        activeFilter={activeFilter}
                        setFilter={filter}
                        enabledAgendas={enabledAgendas}
                        disabledAgendas={disabledAgendas}
                        selectAgenda={selectAgenda}
                        currentAgendaId={currentAgendaId}
                        showFilters={!addNewsItemToPlanning}
                        isViewFiltered={isViewFiltered}
                        clearSearch={clearSearch}
                    />
                    <div className="sd-column-box--3">
                        <SearchPanel toggleFilterPanel={this.toggleFilterPanel} />
                        <ListPanel { ...listPanelProps } />
                        <PreviewPanel
                            edit={this.props.edit}
                            closePreview={this.closePreview}
                            initialLoad={this.state.initialLoad}
                        />
                    </div>
                </div>
                <div className={editorClassName}>
                    <Editor
                        session={this.props.session}
                        privileges={this.props.privileges}
                        lockedItems={this.props.lockedItems}
                        addNewsItemToPlanning={addNewsItemToPlanning}
                        currentWorkspace={currentWorkspace}
                        itemActions={itemActions}
                    />
                </div>
                {!addNewsItemToPlanning && <ModalsContainer />}
                {!addNewsItemToPlanning && <WorkqueueContainer />}
            </section>
        );
    }
}

PlanningAppComponent.propTypes = {
    groups: PropTypes.array,
    editItem: PropTypes.object,
    editItemType: PropTypes.string,
    previewId: PropTypes.string,
    edit: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    preview: PropTypes.func.isRequired,
    filter: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    activeFilter: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    enabledAgendas: PropTypes.array,
    disabledAgendas: PropTypes.array,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    openAgendas: PropTypes.func,
    onAddCoverageClick: PropTypes.func,
    addNewsItemToPlanning: PropTypes.object,
    currentWorkspace: PropTypes.string,
    closeEditor: PropTypes.func,
    loadingIndicator: PropTypes.bool,
    desks: PropTypes.array,
    users: PropTypes.array,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
    closePreview: PropTypes.func.isRequired,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    loadMore: PropTypes.func,
    fullText: PropTypes.string,
    search: PropTypes.func.isRequired,
    multiSelectEvent: PropTypes.func,
    multiSelectPlanning: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    isViewFiltered: PropTypes.bool,
    clearSearch: PropTypes.func
};

const mapStateToProps = (state) => ({
    groups: selectors.main.itemGroups(state),
    users: selectors.getUsers(state),
    desks: selectors.getDesks(state),
    editItem: selectors.forms.currentItem(state),
    editItemType: selectors.forms.currentItemType(state),
    previewId: selectors.main.previewId(state),
    lockedItems: selectors.locks.getLockedItems(state),
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    activeFilter: selectors.main.activeFilter(state),
    agendas: selectors.getAgendas(state),
    enabledAgendas: selectors.getEnabledAgendas(state),
    disabledAgendas: selectors.getDisabledAgendas(state),
    currentAgendaId: selectors.getCurrentAgendaId(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    relatedPlanningsInList: selectors.eventsPlanning.getRelatedPlanningsInList(state),
    fullText: selectors.main.fullText(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
    selectedEventIds: selectors.multiSelect.selectedEventIds(state),
    selectedPlanningIds: selectors.multiSelect.selectedPlanningIds(state),
    loadingIndicator: selectors.main.loadingIndicator(state),
    isViewFiltered: selectors.main.isViewFiltered(state)
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    closeEditor: () => dispatch(actions.main.closeEditor()),
    edit: (item) => dispatch(actions.main.lockAndEdit(item)),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item)),
    preview: (item) => dispatch(actions.main.openPreview(item)),
    filter: (filterType) => dispatch(actions.main.filter(filterType)),
    selectAgenda: (agendaId) => dispatch(actions.selectAgenda(agendaId)),
    openAgendas: () => dispatch(actions.openAgenda()),
    closePreview: () => dispatch(actions.main.closePreview()),
    showRelatedPlannings: (event) => dispatch(actions.eventsPlanning.ui.showRelatedPlannings(event)),
    loadMore: (filterType) => dispatch(actions.main.loadMore(filterType)),
    search: (searchText) => dispatch(actions.main.search(searchText)),
    onAddCoverageClick: (item) => dispatch(actions.planning.ui.onAddCoverageClick(
        item, ownProps.addNewsItemToPlanning)),
    multiSelectEvent: (eventId, deselect = false) => {
        if (deselect) {
            return dispatch(actions.multiSelect.deSelectEvents(eventId));
        }

        return dispatch(actions.multiSelect.selectEvents(eventId));
    },
    multiSelectPlanning: (planningId, deselect = false) => {
        if (deselect) {
            return dispatch(actions.multiSelect.deSelectPlannings(planningId));
        }

        return dispatch(actions.multiSelect.selectPlannings(planningId));
    },
    clearSearch: () => dispatch(actions.main.clearSearch()),
    // Event Item actions:
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: (event) => dispatch(actions.events.ui.duplicate(event)),
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: (event, planningDate) =>
        dispatch(actions.addEventToCurrentAgenda(event, planningDate)),
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: (event) => dispatch(actions.events.ui.openUnspikeModal(event)),
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: (event) => dispatch(actions.events.ui.openSpikeModal(event)),
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: (event) => dispatch(actions.events.ui.openCancelModal(event)),
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: (event) => dispatch(actions.events.ui.openPostponeModal(event)),
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: (event) => dispatch(actions.events.ui.updateTime(event)),
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
        (event) => dispatch(actions.events.ui.openRescheduleModal(event)),
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
        (event) => dispatch(actions.events.ui.convertToRecurringEvent(event)),
    [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
        (event) => dispatch(actions.events.ui.openRepetitionsModal(event)),

    // Planning Item actions
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
        (planning) => (dispatch(actions.planning.ui.duplicate(planning))),
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
        (planning) => (dispatch(actions.planning.ui.spike(planning))),
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
        (planning) => (dispatch(actions.planning.ui.unspike(planning))),
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
        (planning) => dispatch(actions.planning.ui.openCancelPlanningModal(planning)),
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
        (planning) => dispatch(actions.planning.ui.openCancelAllCoverageModal(planning))
});

export const PlanningApp = connect(mapStateToProps, mapDispatchToProps)(PlanningAppComponent);
