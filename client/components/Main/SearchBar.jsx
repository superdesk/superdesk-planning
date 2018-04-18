import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';

export const SearchBar = ({
    addEvent,
    addPlanning,
    openAgendas,
    value,
    search,
    activeFilter,
    createPlanningOnly,
}) => (
    <SubNav>
        <SearchBox label="Search planning" value={value} search={search} activeFilter={activeFilter}/>
        <ActionsSubnavDropdown openAgendas={openAgendas} />
        <CreateNewSubnavDropdown
            addEvent={addEvent}
            addPlanning={addPlanning}
            createPlanningOnly={createPlanningOnly}
        />
    </SubNav>
);

SearchBar.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
    openAgendas: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    search: PropTypes.func.isRequired,
    activeFilter: PropTypes.string.isRequired,
    createPlanningOnly: PropTypes.bool,
};
