import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style.scss';

export default function Toggle({value, onChange, readOnly, className}) {
    const onClick = () => onChange({target: {value: !value}});
    const classes = classNames(
        'sd-toggle',
        'sd-line-input__input',
        {
            checked: value,
            disabled: readOnly
        },
        className
    );

    return (
        <span className={classes} onClick={!readOnly && onChange ? onClick : null}>
            <span className="inner"/>
        </span>
    );
}

Toggle.propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    className: PropTypes.string,
};

Toggle.defaultProps = {
    value: false,
    readOnly: false,
};
