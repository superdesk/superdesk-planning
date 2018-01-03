import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';

export const SearchBar = ({addEvent, openAgendas}) => (
    <SubNav>
        <SearchBox label="Search planning" />
        <ActionsSubnavDropdown
            openAgendas={openAgendas}
        />
        <CreateNewSubnavDropdown
            addEvent={addEvent}
        />
    </SubNav>
);

SearchBar.propTypes = {
    addEvent: PropTypes.func.isRequired,
    openAgendas: PropTypes.func.isRequired,
};
