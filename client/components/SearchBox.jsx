import React from 'react';
import { gettext } from '../utils';

function SearchBox() {
    return (
        <div className="sd-searchbar sd-searchbar--focused">
            <label htmlFor="search-input" className="sd-searchbar__icon" />
            <input type="text" id="search-input"
                className="sd-searchbar__input"
                placeholder={gettext('Search planning')}
            />
            <button className="sd-searchbar__search-btn">
                <i className="big-icon--chevron-right" />
            </button>
        </div>
    );
}

export default SearchBox;
