import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {appConfig} from 'appConfig';
import {planningApi} from '../../superdeskApi';

import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';
import {showModal} from '../../actions/modal';
import {MODALS} from '../../constants/modals';

const ActionsSubnavDropdownComponent = (props) => {
    let items = [];

    if (props.privileges[PRIVILEGES.AGENDA_MANAGEMENT]) {
        items.push({
            label: gettext('Manage agendas'),
            action: props.openAgendas,
        });
    }

    if (props.privileges[PRIVILEGES.MANAGE_CONTENT_PROFILES]) {
        items.push({
            label: gettext('Manage planning profiles'),
            action: planningApi.contentProfiles.showManagePlanningProfileModal,
        });
        items.push({
            label: gettext('Manage event profiles'),
            action: planningApi.contentProfiles.showManageEventProfileModal,
        });
    }

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
        items.length > 0 && (
            <Dropdown
                icon="icon-dots-vertical"
                label={gettext('Actions')}
                items={items}
                alignRight={true}
                tooltip={gettext('Actions')}
                aria-label={gettext('Actions')}
            />
        )
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
