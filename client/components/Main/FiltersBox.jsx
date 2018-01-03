import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

import {Spacer} from '../UI/SubNav';
import {Checkbox} from '../UI/Form';
import {AgendaSubnavDropdown} from './';
import {StretchBar} from '../UI/SubNav';

import {MAIN} from '../../constants';

export const FiltersBox = ({activeFilter, setFilter, agendas, selectAgenda, currentAgendaId}) => {
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
            {activeFilter === MAIN.FILTERS.PLANNING && (
                <AgendaSubnavDropdown
                    agendas={agendas}
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
    agendas: PropTypes.array.isRequired,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
};
