import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {ITEM_TYPE} from '../../constants';
import {SubNavBar, FiltersBar} from '../../components/Main';
import {ArchiveItem} from '../../components/Archive';

export const PlanningSubNavComponent = ({
    filtersOpen,
    toggleFilterPanel,
    addEvent,
    addPlanning,
    openAgendas,
    openFeaturedPlanningModal,
    fullText,
    search,
    activeFilter,
    filter,
    enabledAgendas,
    disabledAgendas,
    selectAgenda,
    currentAgendaId,
    isViewFiltered,
    clearSearch,
    withArchiveItem,
    archiveItem,
    showFilters,
    createPlanningOnly,
    enabledCalendars,
    disabledCalendars,
    selectCalendar,
    currentCalendarId,
    currentStartFilter,
    setStartFilter,
    privileges,
}) => (
    <div>
        {withArchiveItem && <ArchiveItem item={archiveItem} />}
        <SubNavBar
            addEvent={addEvent}
            addPlanning={addPlanning}
            openAgendas={openAgendas}
            openFeaturedPlanningModal={openFeaturedPlanningModal}
            value={fullText}
            search={search}
            activeFilter={activeFilter}
            isViewFiltered={isViewFiltered}
            clearSearch={clearSearch}
            createPlanningOnly={createPlanningOnly}
            currentStartFilter={currentStartFilter}
            setStartFilter={setStartFilter}
            privileges={privileges}
        />
        <FiltersBar
            filterPanelOpen={filtersOpen}
            toggleFilterPanel={toggleFilterPanel}
            activeFilter={activeFilter}
            setFilter={filter}
            enabledAgendas={enabledAgendas}
            disabledAgendas={disabledAgendas}
            selectAgenda={selectAgenda}
            currentAgendaId={currentAgendaId}
            showFilters={showFilters}
            enabledCalendars={enabledCalendars}
            disabledCalendars={disabledCalendars}
            selectCalendar={selectCalendar}
            currentCalendarId={currentCalendarId}
        />
    </div>
);

PlanningSubNavComponent.propTypes = {
    filtersOpen: PropTypes.bool,
    toggleFilterPanel: PropTypes.func,
    addEvent: PropTypes.func,
    addPlanning: PropTypes.func,
    openAgendas: PropTypes.func,
    fullText: PropTypes.string,
    search: PropTypes.func.isRequired,
    activeFilter: PropTypes.string.isRequired,
    filter: PropTypes.func.isRequired,
    enabledAgendas: PropTypes.array,
    disabledAgendas: PropTypes.array,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
    isViewFiltered: PropTypes.bool,
    clearSearch: PropTypes.func,
    withArchiveItem: PropTypes.bool,
    showFilters: PropTypes.bool,
    createPlanningOnly: PropTypes.bool,
    archiveItem: PropTypes.object,
    enabledCalendars: PropTypes.array,
    disabledCalendars: PropTypes.array,
    selectCalendar: PropTypes.func,
    currentCalendarId: PropTypes.string,
    currentStartFilter: PropTypes.object,
    setStartFilter: PropTypes.func,
    privileges: PropTypes.object,
    openFeaturedPlanningModal: PropTypes.func,
};

PlanningSubNavComponent.defaultProps = {showFilters: true};

const mapStateToProps = (state) => ({
    fullText: selectors.main.fullText(state),
    activeFilter: selectors.main.activeFilter(state),
    enabledAgendas: selectors.general.enabledAgendas(state),
    disabledAgendas: selectors.general.disabledAgendas(state),
    currentAgendaId: selectors.planning.currentAgendaId(state),
    isViewFiltered: selectors.main.isViewFiltered(state),
    enabledCalendars: selectors.events.enabledCalendars(state),
    disabledCalendars: selectors.events.disabledCalendars(state),
    currentCalendarId: selectors.events.currentCalendarId(state),
    currentStartFilter: selectors.main.currentStartFilter(state),
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    openAgendas: () => dispatch(actions.openAgenda()),
    search: (searchText) => dispatch(actions.main.search(searchText)),
    filter: (filterType) => dispatch(actions.main.filter(filterType)),
    selectAgenda: (agendaId) => dispatch(actions.selectAgenda(agendaId)),
    clearSearch: () => dispatch(actions.main.clearSearch()),
    addEvent: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT)),
    addPlanning: () => dispatch(actions.main.createNew(ITEM_TYPE.PLANNING)),
    selectCalendar: (calendarId) => dispatch(actions.events.ui.selectCalendar(calendarId)),
    setStartFilter: (start) => dispatch(actions.main.setStartFilter(start)),
    openFeaturedPlanningModal: () => dispatch(actions.planning.ui.openFeaturedPlanningModal()),
});

export const PlanningSubNav = connect(mapStateToProps, mapDispatchToProps)(PlanningSubNavComponent);
