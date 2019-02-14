import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const DesksSubnavDropdown = ({userDesks, selectedDeskId, selectDesk}) => {
    if (get(userDesks, 'length', 0) <= 0) {
        return null;
    }

    const items = [];

    if (get(userDesks, 'length', 0) > 0) {
        userDesks.forEach((desk) => {
            items.push({
                label: desk.name,
                id: desk._id,
                action: () => selectDesk(desk._id),
            });
        });
    }

    let buttonLabel;
    let currentDesk = userDesks.find((desk) => desk._id === selectedDeskId || '');

    buttonLabel = currentDesk ? gettext('Desk: {{name}}', {name: get(currentDesk, 'name')}) : gettext('Select Desk');

    return (
        <Dropdown
            buttonLabel={buttonLabel}
            items={items}
            scrollable={true}
        />
    );
};

DesksSubnavDropdown.propTypes = {
    userDesks: PropTypes.array,
    selectedDeskId: PropTypes.string,
    selectDesk: PropTypes.func,
};
