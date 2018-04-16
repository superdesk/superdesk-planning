import React from 'react';
import PropTypes from 'prop-types';
import {SubNav} from '../UI/SubNav';
import {ToggleFiltersButton, FiltersBox, CalendarNavigation} from '.';

export const FiltersBar = (props) => (
    <SubNav>
        <ToggleFiltersButton
            filterPanelOpen={props.filterPanelOpen}
            toggleFilterPanel={props.toggleFilterPanel}
        />
        <FiltersBox
            activeFilter={props.activeFilter}
            setFilter={props.setFilter}
            enabledAgendas={props.enabledAgendas}
            disabledAgendas={props.disabledAgendas}
            selectAgenda={props.selectAgenda}
            currentAgendaId={props.currentAgendaId}
            showFilters={props.showFilters}
            enabledCalendars={props.enabledCalendars}
            disabledCalendars={props.disabledCalendars}
            selectCalendar={props.selectCalendar}
            currentCalendarId={props.currentCalendarId}
        />
        <CalendarNavigation />
    </SubNav>
);

FiltersBar.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
    enabledAgendas: PropTypes.array,
    disabledAgendas: PropTypes.array,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
    addNewsItemToPlanning: PropTypes.object,
    showFilters: PropTypes.bool,
    showAgendaSelection: PropTypes.bool,
    isViewFiltered: PropTypes.bool,
    clearSearch: PropTypes.func,
    enabledCalendars: PropTypes.array,
    disabledCalendars: PropTypes.array,
    selectCalendar: PropTypes.func,
    currentCalendarId: PropTypes.string,
};
