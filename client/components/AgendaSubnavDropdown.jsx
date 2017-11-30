import React from 'react';
import {gettext} from '../utils';

import SubnavDropdown from './SubnavDropdown';

function AgendaSubnavDropdown() {
    const items = [
        {label: 'Agenda 1'},
        {label: 'Agenda 2'},
    ];

    return (
        <SubnavDropdown
            buttonLabel={gettext('Select agenda')}
            label={gettext('Agendas')}
            items={items}
        />
    );
}

export default AgendaSubnavDropdown;
