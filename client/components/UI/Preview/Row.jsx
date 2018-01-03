import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Row = ({label, value, className, children}) => (
    <div className={classNames('form__row', className)}>
        {label && <label className="form-label form-label--light">{label}</label>}
        {value && <p className={'sd-text__' + className}>{value}</p>}
        {children}
    </div>
);

Row.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};
