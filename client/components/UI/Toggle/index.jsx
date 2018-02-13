import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {KEYCODES} from '../../../constants';
import {onEventCapture} from '../../../utils';
import './style.scss';

export default function Toggle({value, onChange, readOnly, className}) {
    const handleKeyDown = (event) => {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            onChange({target: {value: !value}});
        }
    };
    const onClick = () => onChange({target: {value: !value}});
    const classes = classNames(
        'sd-toggle',
        'sd-line-input__input',
        {
            checked: value,
            disabled: readOnly,
            'sd-toggle--checked': value,
            'sd-toggle--disabled': readOnly
        },
        className
    );

    return (
        <span
            role="button"
            tabIndex={0}
            className={classes}
            onClick={!readOnly && onChange ? onClick : null}
            onKeyDown= {!readOnly ? handleKeyDown : null}>
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
