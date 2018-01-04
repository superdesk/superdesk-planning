import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const ActionsSubnavDropdown = (props) => {
    const items = [
        {
            label: 'Action 1',
            action: () => { /* no-op */ },
        },
        {
            label: 'Action 2',
            action: () => { /* no-op */ },
        },
        {divider: true},
        {
            label: gettext('Manage agendas'),
            action: () => {
                props.openAgendas();
            },
        },
    ];

    return (
        <Dropdown
            icon="icon-dots-vertical"
            label={gettext('Actions')}
            items={items}
        />
    );
};

ActionsSubnavDropdown.propTypes = {openAgendas: PropTypes.func};
