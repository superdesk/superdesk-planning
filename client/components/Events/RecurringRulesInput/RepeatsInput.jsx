import React from 'react';
import PropTypes from 'prop-types';

import {Select, LineInput, Label} from '../../UI/Form';
import {gettext} from '../../../utils/gettext';

export const repeatChoices = [
    {label: gettext('Yearly'), key: 'YEARLY'},
    {label: gettext('Monthly'), key: 'MONTHLY'},
    {label: gettext('Weekly'), key: 'WEEKLY'},
    {label: gettext('Daily'), key: 'DAILY'},
];

export const RepeatsInput = ({label, field, onChange, value, readOnly, ...props}) => (
    <LineInput {...props} isSelect={true} readOnly={readOnly}>
        <Label text={label} />
        <Select
            field={field}
            options={repeatChoices.map((option) => ({
                label: gettext(option.label),
                key: option.key,
            }))}
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