import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';

export const ActionsSubnavDropdown = (props) => {
    let items = [{
        label: gettext('Manage agendas'),
        action: props.openAgendas,
    }];

    if (props.privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT]) {
        items.push({
            label: gettext('Manage Event & Planning Filters'),
            action: props.openEventsPlanningFiltersModal,
        });
    }

    if (props.privileges[PRIVILEGES.FEATURED_STORIES]) {
        items.push({
            label: gettext('Featured stories'),
            action: props.openFeaturedPlanningModal,
        });
    }

    return (
        <Dropdown
            icon="icon-dots-vertical"
            label={gettext('Actions')}
            items={items}
            alignRight={true}
            tooltip={gettext('Actions')}
        />
    );
};

ActionsSubnavDropdown.propTypes = {
    openFeaturedPlanningModal: PropTypes.func,
    openAgendas: PropTypes.func,
    openEventsPlanningFiltersModal: PropTypes.func,
    privileges: PropTypes.object,
};
