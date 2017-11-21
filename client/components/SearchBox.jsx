import React from 'react';
import { gettext } from '../utils';

function SearchBox() {
    return (
        <div className="sd-searchbar sd-searchbar--focused">
            <label htmlFor="search-input" className="sd-searchbar__icon" style={{marginBottom: 0}} />
            <input id="search-input"
                className="sd-searchbar__input"
                type="text"
                placeholder={gettext('Search planning')}
            />
            <button className="sd-searchbar__search-btn">
                <i className="big-icon--chevron-right" />
            </button>
        </div>
    );
}

export default SearchBox;
