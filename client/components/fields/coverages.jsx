import React from 'react';
import PropTypes from 'prop-types';

import {PlanningDateTime} from '../Planning';

export const coverages = ({
    item,
    date,
    users,
    desks,
    activeFilter,
    contentTypes,
    contacts,
}) => (
    <PlanningDateTime
        item={item}
        date={date}
        users={users}
        desks={desks}
        activeFilter={activeFilter}
        contentTypes={contentTypes}
        contacts={contacts}
    />
);

coverages.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    date: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    activeFilter: PropTypes.string,
    contentTypes: PropTypes.array,
    contacts: PropTypes.object,
};
