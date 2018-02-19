import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const ActionsSubnavDropdown = (props) => {
    if (props.disableAgendaManagement) {
        return null;
    }

    const items = [{
        label: gettext('Manage agendas'),
        action: props.openAgendas,
    }];

    return (
        <Dropdown
            icon="icon-dots-vertical"
            label={gettext('Actions')}
            items={items}
            alignRight={true}
        />
    );
};

ActionsSubnavDropdown.propTypes = {
    openAgendas: PropTypes.func,
    disableAgendaManagement: PropTypes.bool,
};
