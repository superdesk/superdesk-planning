import React from 'react';
import {gettext} from '../../utils';

import {Dropdown} from '../UI/SubNav';

export const AgendaSubnavDropdown = () => {
    const items = [
        {label: 'Agenda 1'},
        {label: 'Agenda 2'},
    ];

    return (
        <Dropdown
            buttonLabel={gettext('Select agenda')}
            label={gettext('Agendas')}
            items={items}
        />
    );
};
