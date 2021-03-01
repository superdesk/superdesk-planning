import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {Spacer} from '../UI/SubNav';
import {Checkbox, CheckboxGroup} from '../UI/Form';
import {StretchBar} from '../UI/SubNav';
import {FilterSubnavDropdown} from './FilterSubnavDropdown';

import {MAIN} from '../../constants';

export const FiltersBox = ({
    activeFilter,
    setFilter,
    showFilters,
}) => {
    const filters = !showFilters ?
        [] :
        [
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
        <StretchBar>
            <CheckboxGroup>
                {filters.map((filter) => (
                    <Checkbox
                        key={filter.filter}
                        label={filter.label}
                        value={activeFilter}
                        checkedValue={filter.filter}
                        onChange={(field, value) => setFilter(value)}
                        type="radio"
                        labelPosition="inside"
                        testId={`view-${filter.filter}`}
                    />
                ))}
            </CheckboxGroup>
        </StretchBar>
    );
};

FiltersBox.propTypes = {
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
    showFilters: PropTypes.bool,
};

FiltersBox.defaultProps = {showFilters: true};
