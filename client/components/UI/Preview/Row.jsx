import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Row = ({label, value, className, children, noPadding}) => (
    <div
        className={classNames(
            'form__row',
            {'form__row--no-padding': noPadding}
        )}
    >
        {label && <label className="form-label form-label--light">{label}</label>}
        {value && <p className={'sd-text__' + className}>{value}</p>}
        {children}
    </div>
);

Row.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    className: PropTypes.string,
    children: PropTypes.node,
    noPadding: PropTypes.bool,
};

Row.defaultProps = {
    noPadding: false,
};
