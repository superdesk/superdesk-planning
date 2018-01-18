import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {ToggleFiltersButton, FiltersBox} from '.';

export const FiltersBar = (props) => (
    <SubNav>
        <ToggleFiltersButton
            filterPanelOpen={props.filterPanelOpen}
            toggleFilterPanel={props.toggleFilterPanel}
        />
        <FiltersBox
            activeFilter={props.activeFilter}
            setFilter={props.setFilter}
            agendas={props.agendas}
            selectAgenda={props.selectAgenda}
            currentAgendaId={props.currentAgendaId}
        />
    </SubNav>
);

FiltersBar.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
    agendas: PropTypes.array.isRequired,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
};
