import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function ToggleFiltersButton({leftFilterOpen, toggleFilter}) {
    const className = classNames('navbtn navbtn--left navbtn--darker', {
        'navbtn--active': leftFilterOpen,
    });
    return (
        <button onClick={toggleFilter} className={className}>
            <i className="icon-filter-large" />
        </button>
    );
}

ToggleFiltersButton.propTypes = {
    leftFilterOpen: PropTypes.bool.isRequired,
    toggleFilter: PropTypes.func.isRequired,
};

export default ToggleFiltersButton;
