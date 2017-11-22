import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../utils';

import SubnavSpacer from './SubnavSpacer';
import SubnavCheckbox from './SubnavCheckbox';
import AgendaSubnavDropdown from './AgendaSubnavDropdown';

const EVENTS_FILTER = 'EVENTS';
const PLANNING_FILTER = 'PLANNING';

function FiltersBox({ activeFilter, setFilter }) {
    const filters = [
        {
            label: gettext('Events & Planning'),
            filter: null,
        },
        {
            label: gettext('Events only'),
            filter: EVENTS_FILTER,
        },
        {
            label: gettext('Planning only'),
            filter: PLANNING_FILTER,
        },
    ];

    return (
        <div className="subnav__stretch-bar">
            {filters.map((filter) => (
                <SubnavCheckbox
                    key={filter.filter}
                    label={filter.label}
                    checked={filter.filter === activeFilter}
                    onClick={() => setFilter(filter.filter)}
                />
            ))}

            {activeFilter === PLANNING_FILTER && (
                <SubnavSpacer />
            )}
            {activeFilter === PLANNING_FILTER && (
                <AgendaSubnavDropdown />
            )}
        </div>
    );
}

FiltersBox.propTypes = {
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
};

export default FiltersBox;
