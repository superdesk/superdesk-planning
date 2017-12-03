import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';


export const TermsList = ({terms, displayField}) => (
    <div className="terms-list">
        <ul>
            {terms.map((term, index) => (
                <li key={index}>
                    {get(term, displayField)}
                </li>
            ))}
        </ul>
    </div>
);

TermsList.propTypes = {
    terms: PropTypes.array.isRequired,
    displayField: PropTypes.string.isRequired,
};

