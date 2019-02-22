import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils/index';
import {Dropdown} from '../UI/SubNav/index';

export const DesksSubnavDropdown = ({userDesks, selectedDeskId, selectAssignmentsFrom}) => {
    if (get(userDesks, 'length', 0) <= 0) {
        return null;
    }

    const myAssignmentsText = gettext('My Assignments');
    const items = [
        {
            label: myAssignmentsText,
            id: 'myAssignments',
            action: () => selectAssignmentsFrom(null),
        },
        {divider: true},
    ];

    userDesks.forEach((desk) => {
        items.push({
            label: desk.name,
            id: desk._id,
            action: () => selectAssignmentsFrom(desk._id),
        });
    });

    let buttonLabel = gettext('Select Assignments From: ');
    let currentDesk = userDesks.find((desk) => desk._id === selectedDeskId || '');

    buttonLabel += currentDesk ? get(currentDesk, 'name') : myAssignmentsText;

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
    selectAssignmentsFrom: PropTypes.func,
};
