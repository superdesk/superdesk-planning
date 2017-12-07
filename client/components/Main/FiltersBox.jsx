import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {Spacer, Checkbox} from '../UI/SubNav';
import {AgendaSubnavDropdown} from './';

import {MAIN} from '../../constants';

export const FiltersBox = ({activeFilter, setFilter}) => {
    const filters = [
        {
            label: gettext('Events & Planning'),
            filter: MAIN.FILTERS.COMBINED,
        },
        {
            label: gettext('Events only'),
            filter: MAIN.FILTERS.EVENTS,
        },
        {
            label: gettext('Planning only'),
            filter: MAIN.FILTERS.PLANNING,
        },
    ];

    return (
        <div className="subnav__stretch-bar">
            {filters.map((filter) => (
                <Checkbox
                    key={filter.filter}
                    label={filter.label}
                    checked={filter.filter === activeFilter}
                    onClick={() => setFilter(filter.filter)}
                />
            ))}

            {activeFilter === MAIN.FILTERS.PLANNING && (
                <Spacer />
            )}
            {activeFilter === MAIN.FILTERS.PLANNING && (
                <AgendaSubnavDropdown />
            )}
        </div>
    );
};

FiltersBox.propTypes = {
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
};
