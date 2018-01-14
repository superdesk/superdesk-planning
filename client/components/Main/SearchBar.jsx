import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';

export const SearchBar = ({addEvent, addPlanning, openAgendas}) => (
    <SubNav>
        <SearchBox label="Search planning" />
        <ActionsSubnavDropdown
            openAgendas={openAgendas}
        />
        <CreateNewSubnavDropdown
            addEvent={addEvent}
            addPlanning={addPlanning}
        />
    </SubNav>
);

SearchBar.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
    openAgendas: PropTypes.func.isRequired,
};
