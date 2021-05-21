import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {Button as NavButton} from '../UI/Nav';

export const ToggleFiltersButton = ({filterPanelOpen, toggleFilterPanel}) => (
    <NavButton
        left={true}
        darker={true}
        active={filterPanelOpen}
        onClick={toggleFilterPanel}
        data-sd-tooltip={gettext('Advanced filters')}
        text={gettext('Advanced filters')}
        data-flow="right"
        data-test-id="toggle-filters"
    >
        <i aria-hidden="true" className="icon-filter-large" />
    </NavButton>
);

ToggleFiltersButton.propTypes = {
    filterPanelOpen: PropTypes.bool.isRequired,
    toggleFilterPanel: PropTypes.func.isRequired,
};
