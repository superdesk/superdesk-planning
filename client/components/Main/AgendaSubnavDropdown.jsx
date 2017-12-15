import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../utils';
import {AGENDA} from '../../constants';

import {Dropdown} from '../UI/SubNav';

export const AgendaSubnavDropdown = ({agendas, selectAgenda, currentAgendaId}) => {
    if (get(agendas, 'length', 0) <= 0) {
        return null;
    }

    const items = agendas.map((agenda) => ({
        label: agenda.name,
        id: agenda._id,
        action: () => selectAgenda(agenda._id)
    }));

    items.push({divider: true});
    items.push({
        label: 'No Agenda Assigned',
        action: () => selectAgenda(AGENDA.FILTER.NO_AGENDA_ASSIGNED)
    });
    items.push({
        label: 'All Planning Items',
        action: () => selectAgenda(AGENDA.FILTER.ALL_PLANNING)
    });

    let buttonLabel;

    if (currentAgendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED) {
        buttonLabel = 'No Agenda Assigned';
    } else if (currentAgendaId === AGENDA.FILTER.ALL_PLANNING) {
        buttonLabel = 'All Planning';
    } else {
        const currentAgenda = agendas.find((agenda) => agenda._id === currentAgendaId);

        buttonLabel = get(currentAgenda, 'name', 'Select agenda');
    }

    return (
        <Dropdown
            buttonLabel={gettext(`Agenda: ${buttonLabel}`)}
            label={gettext('Agendas')}
            items={items}
        />
    );
};

AgendaSubnavDropdown.propTypes = {
    agendas: PropTypes.array.isRequired,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
};
