import React from 'react';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const CreateNewSubnavDropdown = () => {
    const items = [
        {
            label: gettext('Planning Item'),
            icon: 'icon-plus-sign icon--blue',
            action: () => { /* no-op */ },
        },
        {
            label: gettext('Event'),
            icon: 'icon-plus-sign icon--blue',
            action: () => { /* no-op */ },
        },
    ];

    return (
        <Dropdown
            icon="icon-plus-large"
            label={gettext('Create new')}
            items={items}
        />
    );
};
