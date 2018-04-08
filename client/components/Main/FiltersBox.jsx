import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {Spacer} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import {AgendaSubnavDropdown} from './';
import {CalendarSubnavDropdown} from '../Events';
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
    enabledCalendars,
    disabledCalendars,
    selectCalendar,
    currentCalendarId,
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

            {showFilters && (activeFilter === MAIN.FILTERS.PLANNING || activeFilter === MAIN.FILTERS.EVENTS) && (
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
            {(activeFilter === MAIN.FILTERS.EVENTS) && (
                <CalendarSubnavDropdown
                    enabledCalendars={enabledCalendars}
                    disabledCalendars={disabledCalendars}
                    selectCalendar={selectCalendar}
                    currentCalendarId={currentCalendarId}
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
    enabledCalendars: PropTypes.array,
    disabledCalendars: PropTypes.array,
    selectCalendar: PropTypes.func,
    currentCalendarId: PropTypes.string,
};

FiltersBox.defaultProps = {showFilters: true};