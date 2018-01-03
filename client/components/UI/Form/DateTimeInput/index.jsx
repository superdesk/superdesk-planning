import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {Row, Label, DateInput, TimeInput} from '../';
import './style.scss';

export const DateTimeInput = ({
    field,
    label,
    value,
    onChange,
    required,
    invalid,
    timeFormat,
    dateFormat,
    readOnly,
    ...props
}) => (
    <Row flex={true} className={{
        'date-time-input__row': true,
        'date-time-input__row--required': required,
        'date-time-input__row--invalid': invalid,
    }}>
        <Label text={label} row={true}/>
        <DateInput
            field={`${field}.date`}
            value={value}
            onChange={onChange}
            noMargin={true}
            invalid={invalid}
            dateFormat={dateFormat}
            readOnly={readOnly}
        />

        <TimeInput
            field={`${field}.time`}
            value={value}
            onChange={onChange}
            noMargin={true}
            invalid={invalid}
            timeFormat={timeFormat}
            readOnly={readOnly}
        />
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
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};

DateTimeInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
