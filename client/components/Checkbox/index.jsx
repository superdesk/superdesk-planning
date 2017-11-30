import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

function Checkbox({value, checkedValue, onChange, label, labelPosition, readOnly, type}) {
    const isRadio = type === 'radio';
    const onClick = (e) => {
        e.stopPropagation();
        onChange({target: {value: isRadio ? checkedValue : !value}});
    };
    const classNameLabel = readOnly ? 'sd-label--disabled' : '';
    const className = classNames(
        'sd-checkbox',
        {'sd-checkbox--radio': isRadio},
        {checked: isRadio ? value === checkedValue : value},
        {'sd-checkbox--disabled': readOnly}
    );

    let checkbox;

    if (labelPosition === 'inside') {
        checkbox = <span className="sd-check__wrapper" disabled={readOnly}>
            <span className={ className + ' sd-checkbox--button-style'}
                onClick={!readOnly && onClick}>
                <label className={classNameLabel}>{label}</label>
            </span></span>;
    } else if (labelPosition === 'left') {
        checkbox = <span className="sd-check__wrapper" disabled={readOnly}>
            <label className={classNameLabel}>{label}</label>
            <span className={className} onClick={!readOnly && onClick} />
        </span>;
    } else {
        checkbox = <span className="sd-check__wrapper" disabled={readOnly}>
            <span className={className} onClick={!readOnly && onClick} />
            <label className={classNameLabel}>{label}</label>
        </span>;
    }

    return checkbox;
}

Checkbox.propTypes = {
    value: PropTypes.any,
    checkedValue: PropTypes.string,
    onChange: PropTypes.func,
    label: PropTypes.string,
    labelPosition: PropTypes.oneOf(['left', 'right', 'inside']),
    readOnly: PropTypes.bool,
    type: PropTypes.oneOf(['radio', 'checkbox']),
};

Checkbox.defaultProps = {
    value: '',
    checkedValue: '',
    readOnly: false,
    labelPosition: 'right',
    type: 'checkbox',
};

export default Checkbox;
