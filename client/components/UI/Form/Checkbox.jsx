import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {gettext} from '../../../utils';

export const Checkbox = ({
    field,
    value,
    checkedValue,
    label,
    labelPosition,
    readOnly,
    onChange,
    type,
}) => {
    const isRadio = type === 'radio';
    const onClick = readOnly ?
        null :
        (event) => {
            event.stopPropagation();
            onChange(field, isRadio ? checkedValue : !value);
        };

    const className = classNames(
        'sd-checkbox',
        {
            'sd-checkbox--disabled': readOnly,
            'sd-checkbox--button-style': labelPosition === 'inside',
            'sd-checkbox--radio': isRadio,
            checked: isRadio ? value === checkedValue : value,
        }
    );

    let checkbox;

    if (labelPosition === 'inside') {
        checkbox = (
            <span className="sd-check__wrapper" disabled={readOnly} onClick={onClick}>
                <span className={className}>
                    <label className={readOnly ? 'sd-label--disabled' : ''}>
                        {gettext(label)}
                    </label>
                </span>
            </span>
        );
    } else if (labelPosition === 'left') {
        checkbox = (
            <span className="sd-check__wrapper" disabled={readOnly} onClick={onClick}>
                <label className={readOnly ? 'sd-label--disabled' : ''}>
                    {gettext(label)}
                </label>
                <span className={className}/>
            </span>
        );
    } else {
        checkbox = (
            <span className="sd-check__wrapper" disabled={readOnly} onClick={onClick}>
                <span className={className}/>
                <label className={readOnly ? 'sd-label--disabled' : ''}>
                    {gettext(label)}
                </label>
            </span>
        );
    }

    return checkbox;
};

Checkbox.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    labelPosition: PropTypes.oneOf(['left', 'right', 'inside']),
    value: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string,
    ]),
    checkedValue: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    type: PropTypes.oneOf(['radio', 'checkbox']),
};

Checkbox.defaultProps = {
    value: false,
    checkedValue: '',
    readOnly: false,
    labelPosition: 'right',
    type: 'checkbox',
};
