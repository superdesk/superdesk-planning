import React from 'react';
import {gettext} from '../utils';
import SubnavDropdown from './SubnavDropdown';

function ActionsSubnavDropdown() {
    const items = [
        {
            label: 'Action 1',
            action: () => { /* no-op */ },
        },
        {
            label: 'Action 2',
            action: () => { /* no-op */ },
        },
        {divider: true},
        {
            label: gettext('Manage agendas'),
            action: () => { /* no-op */ },
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
