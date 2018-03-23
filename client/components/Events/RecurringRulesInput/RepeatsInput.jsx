import React from 'react';
import PropTypes from 'prop-types';

import {Select, LineInput, Label} from '../../UI/Form';

export const repeatChoices = [
    {label: 'Yearly', key: 'YEARLY'},
    {label: 'Monthly', key: 'MONTHLY'},
    {label: 'Weekly', key: 'WEEKLY'},
    {label: 'Daily', key: 'DAILY'}
];

export const RepeatsInput = ({label, field, onChange, value, readOnly, ...props}) => (
    <LineInput {...props} isSelect={true} readOnly={readOnly}>
        <Label text={label} />
        <Select
            field={field}
            options={repeatChoices}
            onChange={onChange}
            value={value}
            readOnly={readOnly}
        />
    </LineInput>
);

RepeatsInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    noLabel: PropTypes.bool,
};

RepeatsInput.defaultProps = {
    field: 'dates.recurring_rule.frequency',
    label: 'Repeats',
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    noLabel: false,
};