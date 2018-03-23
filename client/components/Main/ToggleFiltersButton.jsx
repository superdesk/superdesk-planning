import React from 'react';
import PropTypes from 'prop-types';

export const ToggleFiltersButton = ({filterPanelOpen, toggleFilterPanel}) => {
    const className = 'navbtn navbtn--left navbtn--darker' + (
        filterPanelOpen ? ' navbtn--active' : ''
    );

    return (
        <button onClick={toggleFilterPanel} className={className}
            data-sd-tooltip="Advanced filters" data-flow="right">
            <i className="icon-filter-large" />
        </button>
    );
};

ToggleFiltersButton.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
};
