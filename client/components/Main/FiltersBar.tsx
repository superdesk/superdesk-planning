import React from 'react';
import PropTypes from 'prop-types';
import {SubNav} from '../UI/SubNav';
import {ToggleFiltersButton, FiltersBox, CalendarNavigation} from '.';
import {MAIN} from '../../constants/main';

export const FiltersBar = (props) => (
    <SubNav
        responsive={true}
        compact={props.activeFilter !== MAIN.FILTERS.COMBINED}
        testId="subnav-filters"
    >
        <ToggleFiltersButton
            filterPanelOpen={props.filterPanelOpen}
            toggleFilterPanel={props.toggleFilterPanel}
        />
        <FiltersBox
            activeFilter={props.activeFilter}
            setFilter={props.setFilter}
            showFilters={props.showFilters}
        />
        <CalendarNavigation />
    </SubNav>
);

FiltersBar.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
    showFilters: PropTypes.bool,
};
