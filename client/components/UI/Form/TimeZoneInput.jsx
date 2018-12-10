import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import {get} from 'lodash';
import {SelectMetaTermsInput, Row} from './';
import './style.scss';

/**
 * @ngdoc react
 * @name TimeZoneInput
 * @description Component to choose timezone
 */
export const TimeZoneInput = ({field, label, value, onChange, invalid, required, ...props}) => {
    const onChangeHandler = (field, val) => {
        if (val.length > 1) {
            onChange(field, get(val.find((v) => get(v, 'qcode') !== value), 'qcode'));
        } else {
            onChange(field, get(val, '[0].qcode'));
        }
    };

    const timeZones = moment.tz.names().map((t) => ({
        qcode: t,
        name: t,
    }));

    return (
        <Row flex={true} className={{
            'date-time-input__row': true,
            'date-time-input__row--required': required,
            'date-time-input__row--invalid': invalid,
        }}>

            <SelectMetaTermsInput
                label={label}
                {...props} invalid={invalid} required={required}
                field={field}
                options={timeZones}
                onChange={onChangeHandler}
                value={value ? [{
                    qcode: value,
                    name: value,
                }] : [] } />
        </Row>);
};

TimeZoneInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    noMargin: PropTypes.bool,
};
