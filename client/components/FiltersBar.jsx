import React from 'react';
import PropTypes from 'prop-types';

import Subnav from './Subnav';
import FiltersBox from './FiltersBox';
import ToggleFiltersButton from './ToggleFiltersButton';

function FiltersBar(props) {
    return (
        <Subnav>
            <ToggleFiltersButton {...props} />
            <FiltersBox {...props} />
        </Subnav>
    );
}

FiltersBar.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
};

export default FiltersBar;
