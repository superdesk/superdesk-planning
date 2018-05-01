import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';
import {AGENDA} from '../../constants';
import {Dropdown} from '../UI/SubNav';

export const AgendaSubnavDropdown = ({
    enabledAgendas,
    disabledAgendas,
    selectAgenda,
    currentAgendaId,
}) => {
    if (get(enabledAgendas, 'length', 0) <= 0 && get(disabledAgendas, 'length', 0) <= 0) {
        return null;
    }

    const items = [
        {
            label: gettext('All Planning Items'),
            action: () => selectAgenda(AGENDA.FILTER.ALL_PLANNING),
        },
        {
            label: gettext('No Agenda Assigned'),
            action: () => selectAgenda(AGENDA.FILTER.NO_AGENDA_ASSIGNED),
        },
        {divider: true},
    ];

    if (get(enabledAgendas, 'length', 0) > 0) {
        enabledAgendas.forEach((agenda) => {
            items.push({
                label: agenda.name,
                id: agenda._id,
                action: () => selectAgenda(agenda._id),
            });
        });

        items.push({divider: true});
    }

    if (get(disabledAgendas, 'length', 0) > 0) {
        disabledAgendas.forEach((agenda) => {
            items.push({
                label: agenda.name,
                id: agenda._id,
                action: () => selectAgenda(agenda._id),
                disabled: true,
                icon: 'icon-lock',
            });
        });
    }

    let buttonLabel;
    let buttonLabelClassName;

    if (currentAgendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED) {
        buttonLabel = gettext('No Agenda Assigned');
    } else if (currentAgendaId === AGENDA.FILTER.ALL_PLANNING) {
        buttonLabel = gettext('All Planning Items');
    } else {
        const currentAgenda = enabledAgendas.find((agenda) => agenda._id === currentAgendaId) ||
        disabledAgendas.find((agenda) => agenda._id === currentAgendaId);

        buttonLabel = get(currentAgenda, 'name', gettext('Select Agenda'));
        buttonLabelClassName = !currentAgenda.is_enabled ? 'dropdown__menu-item--disabled' : '';
    }

    return (
        <Dropdown
            buttonLabelClassName={buttonLabelClassName}
            buttonLabel={gettext('Agenda: {{ name }}', {name: buttonLabel})}
            items={items}
            scrollable={true}
        />
    );
};

AgendaSubnavDropdown.propTypes = {
    enabledAgendas: PropTypes.array.isRequired,
    disabledAgendas: PropTypes.array.isRequired,
    selectAgenda: PropTypes.func.isRequired,
    currentAgendaId: PropTypes.string.isRequired,
};
