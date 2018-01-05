import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';

export const SearchBar = (props) => (
    <SubNav>
        <SearchBox label="Search planning" />
        <ActionsSubnavDropdown openAgendas={props.openAgendas}/>
        <CreateNewSubnavDropdown />
    </SubNav>
);

SearchBar.propTypes = {openAgendas: PropTypes.func};
