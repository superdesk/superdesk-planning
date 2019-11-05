import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

/**
 * @ngdoc react
 * @name TermsList
 * @description Displays a list of terms: subject, categories
 */
const TermsList = ({terms, displayField, onClick, readOnly}) => (
    (get(terms, 'length', 0) > 0 && <div className={classNames(
        'terms-list',
        {'terms-list--disabled': readOnly}
    )}>
        <ul>
            {terms.map((term, index) => (
                <li key={index} onClick={(!readOnly && onClick) ? onClick.bind(null, index, term) : null}>
                    {(!readOnly && onClick) && <i className="icon-close-small"/>}
                    {get(term, displayField) || term}
                </li>
            ))}
        </ul>
    </div>) || null
);

TermsList.propTypes = {
    terms: PropTypes.array.isRequired,
    displayField: PropTypes.string,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool,
};

TermsList.defaultProps = {terms: []};

export default TermsList;
