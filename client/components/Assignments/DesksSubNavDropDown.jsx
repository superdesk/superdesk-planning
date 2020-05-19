import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../utils';
import {ALL_DESKS} from '../../constants';
import {Dropdown} from '../UI/SubNav';

export const DesksSubnavDropdown = ({userDesks, selectedDeskId, selectAssignmentsFrom, showAllDeskOption}) => {
    if (get(userDesks, 'length', 0) <= 0) {
        return null;
    }

    const myAssignmentsText = gettext('My Assignments');
    const allDesksText = gettext('All Desks');

    const items = [{
        label: myAssignmentsText,
        id: 'myAssignments',
        action: () => selectAssignmentsFrom(null),
    }];

    if (showAllDeskOption) {
        items.push({
            label: allDesksText,
            id: ALL_DESKS,
            action: () => selectAssignmentsFrom(ALL_DESKS),
        });
    }

    items.push({divider: true});

    userDesks.forEach((desk) => {
        items.push({
            label: desk.name,
            id: desk._id,
            action: () => selectAssignmentsFrom(desk._id),
        });
    });

    let buttonLabel = gettext('Select Assignments From: ');
    let currentDesk = userDesks.find((desk) => desk._id === selectedDeskId || '');

    if (selectedDeskId === ALL_DESKS) {
        buttonLabel += allDesksText;
    } else if (currentDesk) {
        buttonLabel += get(currentDesk, 'name');
    } else {
        buttonLabel += myAssignmentsText;
    }

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
    showAllDeskOption: PropTypes.bool,
};

DesksSubnavDropdown.defaultProps = {showAllDeskOption: false};
