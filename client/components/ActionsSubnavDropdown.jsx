import React from 'react';
import { gettext } from '../utils';
import SubnavDropdown from './SubnavDropdown';

function ActionsSubnavDropdown() {
    const items = [
        {
            label: 'Action 1',
            action: () => {},
        },
        {
            label: 'Action 2',
            action: () => {},
        },
        {divider: true},
        {
            label: gettext('Manage agendas'),
            action: () => {},
        },
    ];

    return (
        <SubnavDropdown
            icon="icon-dots-vertical"
            label={gettext('Actions')}
            items={items}
        />
    );
}

export default ActionsSubnavDropdown;
