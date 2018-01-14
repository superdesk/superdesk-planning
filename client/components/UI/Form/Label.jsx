import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {gettextCatalog} from '../../../utils';

export const Label = ({text, row, light}) => (
    !text ? null : (
        <label className={classNames({
            'sd-line-input__label': !row,
            'form-label': row,
            'form-label--light': row && light
        })}>
            {gettextCatalog(text)}
        </label>
    )
);

Label.propTypes = {
    text: PropTypes.string,
    row: PropTypes.bool,
    light: PropTypes.bool,
};

Label.defaultProps = {
    row: false,
    light: false,
};
