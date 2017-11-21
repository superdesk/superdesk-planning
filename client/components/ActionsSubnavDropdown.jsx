import React from 'react';
import { gettext } from '../utils';
import SubnavDropdown from './SubnavDropdown';

class ActionsSubnavDropdown extends React.Component {
    render() {
        return (
            <SubnavDropdown
                icon="icon-dots-vertical"
                label={gettext('Actions')}
            />
        )
    }
}

export default ActionsSubnavDropdown;
