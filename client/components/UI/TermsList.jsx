import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

const TermsList = ({terms, displayField, onClick}) => (
    <div className="terms-list">
        <ul>
            {terms.map((term, index) => (
                <li key={index} onClick={onClick ? onClick.bind(null, index) : null}>
                    {onClick && <i className="icon-close-small"/>}
                    {get(term, displayField) || term}
                </li>
            ))}
        </ul>
    </div>
);

TermsList.propTypes = {
    terms: PropTypes.array.isRequired,
    displayField: PropTypes.string,
    onClick: PropTypes.func,
};

export default TermsList;
