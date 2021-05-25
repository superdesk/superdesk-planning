import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {appConfig} from 'appConfig';

import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';
import {showModal} from '../../actions/modal';
import {MODALS} from '../../constants/modals';

const ActionsSubnavDropdownComponent = (props) => {
    let items = [
        {
            label: gettext('Manage agendas'),
            action: props.openAgendas,
        },
    ];

    if (appConfig.event_templates_enabled === true && props.privileges[PRIVILEGES.EVENT_TEMPLATES]) {
        items.push({
            label: gettext('Manage event templates'),
            action: () => props.dispatch(showModal({
                modalType: MODALS.MANAGE_EVENT_TEMPLATES,
            })),
        });
    }

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
            aria-label={gettext('Actions')}
        />
    );
};

ActionsSubnavDropdownComponent.propTypes = {
    openFeaturedPlanningModal: PropTypes.func,
    openAgendas: PropTypes.func,
    openEventsPlanningFiltersModal: PropTypes.func,
    privileges: PropTypes.object,
    dispatch: PropTypes.func,
};

export const ActionsSubnavDropdown = connect()(ActionsSubnavDropdownComponent);