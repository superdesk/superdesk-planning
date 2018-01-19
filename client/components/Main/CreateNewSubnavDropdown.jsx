import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const CreateNewSubnavDropdown = ({addEvent, addPlanning, createPlanningOnly}) => {
    let items = [
        {
            label: gettext('Planning Item'),
            icon: 'icon-plus-sign icon--blue',
            action: addPlanning,
        }
    ];

    if (!createPlanningOnly) {
        items.push({
            label: gettext('Event'),
            icon: 'icon-plus-sign icon--blue',
            action: addEvent,
        });
    }

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
    createPlanningOnly: PropTypes.bool,
};
