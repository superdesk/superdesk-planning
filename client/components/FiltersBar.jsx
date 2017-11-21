import React from 'react';
import PropTypes from 'prop-types';

import Subnav from './Subnav';
import FiltersBox from './FiltersBox';
import ToggleFiltersButton from './ToggleFiltersButton';

function FiltersBar({leftFilterOpen, toggleFilter}) {
    return (
        <Subnav>
            <ToggleFiltersButton
                leftFilterOpen={leftFilterOpen}
                toggleFilter={toggleFilter}
            />
            <FiltersBox />
        </Subnav>
    );
}

FiltersBar.propTypes = {
    leftFilterOpen: PropTypes.bool.isRequired,
    toggleFilter: PropTypes.func.isRequired,
};

export default FiltersBar;
