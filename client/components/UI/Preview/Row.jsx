import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Row = ({label, value, className, children, noPadding, enabled}) => (
    enabled ?
        <div
            className={classNames(
                'form__row',
                {'form__row--no-padding': noPadding}
            )}
        >
            {label && <label className="form-label form-label--light">{label}</label>}
            {value && <p className={'sd-text__' + className}>{value}</p>}
            {children}
        </div> :
        null
);

Row.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.node,
    ]),
    className: PropTypes.string,
    children: PropTypes.node,
    noPadding: PropTypes.bool,
    enabled: PropTypes.bool,
};

Row.defaultProps = {
    noPadding: false,
    enabled: true,
};
