import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';
import {connect} from 'react-redux';
import {showModal} from '../../actions/modal';
import {MODALS} from '../../constants/modals';
import {getDeployConfig} from '../../selectors/config';

const ActionsSubnavDropdownComponent = (props) => {
    let items = [
        {
            label: gettext('Manage agendas'),
            action: props.openAgendas,
        },
    ];

    if (props.deployConfig.event_templates_enabled === true) {
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
        />
    );
};

ActionsSubnavDropdownComponent.propTypes = {
    openFeaturedPlanningModal: PropTypes.func,
    deployConfig: PropTypes.object,
    openAgendas: PropTypes.func,
    openEventsPlanningFiltersModal: PropTypes.func,
    privileges: PropTypes.object,
    dispatch: PropTypes.func,
};

function mapStateToProps(state) {
    return {
        deployConfig: getDeployConfig(state),
    };
}

export const ActionsSubnavDropdown = connect(mapStateToProps)(ActionsSubnavDropdownComponent);