import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';
import {EVENTS_PLANNING} from '../../constants';
import {Dropdown} from '../UI/SubNav';

export const EventsPlanningFiltersSubnavDropdown = ({
    filters,
    selectFilter,
    currentFilterId,
}) => {
    if (get(filters, 'length', 0) <= 0) {
        return null;
    }

    const items = [
        {
            label: gettext('All Events & Planning'),
            action: () => selectFilter(EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING),
        },
        {divider: true},
    ];

    if (get(filters, 'length', 0) > 0) {
        filters.forEach((filter) => {
            items.push({
                label: filter.name,
                id: filter._id,
                action: () => selectFilter(filter._id),
            });
        });
    }

    let buttonLabel;

    if (currentFilterId === EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING || currentFilterId == null) {
        buttonLabel = gettext('All Events & Planning');
    } else {
        const currentFilter = filters.find((filter) => filter._id === currentFilterId);

        buttonLabel = get(currentFilter, 'name');
    }

    return (
        <Dropdown
            buttonLabel={gettext('Filter: {{ name }}', {name: buttonLabel})}
            items={items}
            scrollable={true}
        />
    );
};

EventsPlanningFiltersSubnavDropdown.propTypes = {
    filters: PropTypes.array.isRequired,
    selectFilter: PropTypes.func.isRequired,
    currentFilterId: PropTypes.string,
};
