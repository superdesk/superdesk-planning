import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Checkbox
 * @description Component to show checkbox input in styles including radiobutton
 */
export const Checkbox = ({
    field,
    value,
    checkedValue,
    label,
    labelPosition,
    readOnly,
    onChange,
    type,
    testId,
    tabIndex,
}) => {
    const isRadio = type === 'radio';
    const onClick = readOnly ?
        null :
        (event) => {
            event.stopPropagation();
            onChange(field, isRadio ? checkedValue : !value, event.shiftKey);
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
            <a
                className="sd-check__wrapper"
                onClick={onClick}
                data-test-id={testId}
                tabIndex={tabIndex}
            >
                <span className={className}>
                    <label className={readOnly ? 'sd-label--disabled' : ''}>
                        {label}
                    </label>
                </span>
            </a>
        );
    } else if (labelPosition === 'left') {
        checkbox = (
            <a
                className="sd-check__wrapper"
                onClick={onClick}
                data-test-id={testId}
                tabIndex={tabIndex}
            >
                <label className={readOnly ? 'sd-label--disabled' : ''}>
                    {label}
                </label>
                <span className={className} />
            </a>
        );
    } else {
        checkbox = (
            <a
                className="sd-check__wrapper"
                onClick={onClick}
                data-test-id={testId}
                tabIndex={tabIndex}
            >
                <span className={className} />
                <label className={readOnly ? 'sd-label--disabled' : ''}>
                    {label}
                </label>
            </a>
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
    testId: PropTypes.string,
    tabIndex: PropTypes.number,
};

Checkbox.defaultProps = {
    value: false,
    checkedValue: '',
    readOnly: false,
    labelPosition: 'right',
    type: 'checkbox',
};
