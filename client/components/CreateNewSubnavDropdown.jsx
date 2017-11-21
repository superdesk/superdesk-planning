import React from 'react';
import SubnavDropdown from './SubnavDropdown';

class CreateNewSubnavDropdown extends React.Component {
    render() {
        return (
            <SubnavDropdown
                icon="icon-plus-large"
                label={gettext('Create new')}
            />
        );
    }
}

export default CreateNewSubnavDropdown;
