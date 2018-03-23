import React from 'react';
import PropTypes from 'prop-types';

import {MultiSelectActions} from '../index';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';
import {SubNav} from '../UI/SubNav';

export const SubNavBar = ({
    addEvent,
    addPlanning,
    openAgendas,
    value,
    search,
    activeFilter,
    createPlanningOnly,
    disableAgendaManagement,
}) => (
    <SubNav>
        <MultiSelectActions />
        <SearchBox label="Search planning" value={value} search={search} activeFilter={activeFilter}/>
        <ActionsSubnavDropdown
            openAgendas={openAgendas}
            disableAgendaManagement={disableAgendaManagement}
        />
        <CreateNewSubnavDropdown
            addEvent={addEvent}
            addPlanning={addPlanning}
            createPlanningOnly={createPlanningOnly}
        />
    </SubNav>
);

SubNavBar.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
    openAgendas: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    search: PropTypes.func.isRequired,
    activeFilter: PropTypes.string.isRequired,
    createPlanningOnly: PropTypes.bool,
    disableAgendaManagement: PropTypes.bool,
};
