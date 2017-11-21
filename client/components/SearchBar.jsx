import React from 'react';

import Subnav from './Subnav';
import SearchBox from './SearchBox';
import ActionsSubnavDropdown from './ActionsSubnavDropdown';
import CreateNewSubnavDropdown from './CreateNewSubnavDropdown';

function SearchBar() {
    return (
        <Subnav>
            <SearchBox />
            <ActionsSubnavDropdown />
            <CreateNewSubnavDropdown />
        </Subnav>
    );
}

export default SearchBar;
