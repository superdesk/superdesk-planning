import React from 'react';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const ActionsSubnavDropdown = () => {
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
        <Dropdown
            icon="icon-dots-vertical"
            label={gettext('Actions')}
            items={items}
        />
    );
};
