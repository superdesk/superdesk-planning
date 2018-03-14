import React from 'react';
import PropTypes from 'prop-types';
import {Button} from '../UI';
import {SubNav} from '../UI/SubNav';
import {ToggleFiltersButton, FiltersBox} from '.';
import {gettext} from '../../utils';

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
        />
        {props.isViewFiltered &&
        <Button
            text={gettext('Clear Filters')}
            className="btn__clear-filters"
            hollow={true}
            color="alert"
            onClick={props.clearSearch}
        />}
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
    clearSearch: PropTypes.func
};
