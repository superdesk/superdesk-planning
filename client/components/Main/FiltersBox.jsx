import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {Spacer} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import {AgendaSubnavDropdown} from './';
import {StretchBar} from '../UI/SubNav';

import {MAIN} from '../../constants';

export const FiltersBox = ({
    activeFilter,
    setFilter,
    enabledAgendas,
    disabledAgendas,
    selectAgenda,
    currentAgendaId,
    showFilters,
}) => {
    const filters = !showFilters ? [] :
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
            {filters.map((filter) => (
                <Checkbox
                    key={filter.filter}
                    label={filter.label}
                    value={activeFilter}
                    checkedValue={filter.filter}
                    onChange={(field, value) => setFilter(value)}
                    type="radio"
                    labelPosition="inside"
                />
            ))}

            {activeFilter === MAIN.FILTERS.PLANNING && (
                <Spacer />
            )}
            {(activeFilter === MAIN.FILTERS.PLANNING) && (
                <AgendaSubnavDropdown
                    enabledAgendas={enabledAgendas}
                    disabledAgendas={disabledAgendas}
                    selectAgenda={selectAgenda}
                    currentAgendaId={currentAgendaId}
                />
            )}
        </StretchBar>
    );
};

FiltersBox.propTypes = {
    activeFilter: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
    enabledAgendas: PropTypes.array,
    disabledAgendas: PropTypes.array,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
    showFilters: PropTypes.bool,
};

FiltersBox.defaultProps = {showFilters: true};