import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {Row, DateInput, TimeInput} from '..';
import './style.scss';
import Button from '../../Button';
import {gettext} from '../../../../utils';

export const DateTimeInput = ({
    field,
    label,
    value,
    onChange,
    required,
    invalid,
    message,
    timeFormat,
    dateFormat,
    readOnly,
    canClear,
    ...props
}) => (
    <Row flex={true} className={{
        'date-time-input__row': true,
        'date-time-input__row--required': required,
        'date-time-input__row--invalid': invalid,
    }}>
        <DateInput
            field={`${field}.date`}
            value={value}
            onChange={onChange}
            noMargin={true}
            invalid={invalid}
            dateFormat={dateFormat}
            readOnly={readOnly}
            label={label}
        />

        <TimeInput
            field={`${field}.time`}
            value={value}
            onChange={onChange}
            noMargin={true}
            invalid={invalid}
            message={message}
            timeFormat={timeFormat}
            readOnly={readOnly}
        />
        {canClear && <Button
            onClick={() => onChange(field, null)}
            icon="icon-close-small"
            size="small"
            iconOnly={true}
            title={gettext('Clear date and time')}
            className="btn--icon-only-circle"
        />}
    </Row>
);

DateTimeInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,

    hint: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    message: PropTypes.string,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    canClear: PropTypes.bool,
};

DateTimeInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    canClear: false,
};
