import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';

const SearchBox = ({label}) => (
    <div className="sd-searchbar sd-searchbar--focused">
        <label htmlFor="search-input" className="sd-searchbar__icon" />
        <input type="text" id="search-input"
            className="sd-searchbar__input"
            placeholder={gettext(label)}
        />
        <button className="sd-searchbar__search-btn">
            <i className="big-icon--chevron-right" />
        </button>
    </div>
);

SearchBox.propTypes = {
    label: PropTypes.string.isRequired
};

export default SearchBox;
