import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {ToggleFiltersButton, FiltersBox} from './';

export const FiltersBar = (props) => (
    <SubNav>
        <ToggleFiltersButton {...props} />
        <FiltersBox {...props} />
    </SubNav>
);

FiltersBar.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
};
