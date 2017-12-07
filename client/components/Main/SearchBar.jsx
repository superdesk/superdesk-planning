import React from 'react';

import {SubNav} from '../UI/SubNav';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';

export const SearchBar = () => (
    <SubNav>
        <SearchBox label="Search planning" />
        <ActionsSubnavDropdown />
        <CreateNewSubnavDropdown />
    </SubNav>
);
