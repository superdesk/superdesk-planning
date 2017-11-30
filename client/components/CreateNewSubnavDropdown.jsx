import React from 'react';
import {gettext} from '../utils';
import SubnavDropdown from './SubnavDropdown';

function CreateNewSubnavDropdown() {
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
        <SubnavDropdown
            icon="icon-plus-large"
            label={gettext('Create new')}
            items={items}
        />
    );
}

export default CreateNewSubnavDropdown;
