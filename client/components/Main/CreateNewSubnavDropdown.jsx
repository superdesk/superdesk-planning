import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';

export const CreateNewSubnavDropdown = ({addEvent, addPlanning, createPlanningOnly, privileges}) => {
    const items = [];

    if (privileges[PRIVILEGES.PLANNING_MANAGEMENT]) {
        items.push({
            label: gettext('Planning Item'),
            icon: 'icon-plus-sign icon--blue',
            action: addPlanning,
        });
    }

    if (!createPlanningOnly && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]) {
        items.push({
            label: gettext('Event'),
            icon: 'icon-plus-sign icon--blue',
            action: addEvent,
        });
    }

    return (items.length === 0 ? null :
        <Dropdown
            icon="icon-plus-large"
            label={gettext('Create new')}
            items={items}
            alignRight={true}
            disableSelection={createPlanningOnly}
            defaultAction={addPlanning}
            tooltip={createPlanningOnly ? gettext('Create new planning item') : gettext('Create new item')} />
    );
};

CreateNewSubnavDropdown.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
    createPlanningOnly: PropTypes.bool,
    privileges: PropTypes.object,
};
