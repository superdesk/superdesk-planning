import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const CreateNewSubnavDropdown = ({addEvent, addPlanning}) => {
    const items = [
        {
            label: gettext('Planning Item'),
            icon: 'icon-plus-sign icon--blue',
            action: addPlanning,
        },
        {
            label: gettext('Event'),
            icon: 'icon-plus-sign icon--blue',
            action: addEvent,
        },
    ];

    return (
        <Dropdown
            icon="icon-plus-large"
            label={gettext('Create new')}
            items={items}
            alignRight={true}
        />
    );
};

CreateNewSubnavDropdown.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
};
