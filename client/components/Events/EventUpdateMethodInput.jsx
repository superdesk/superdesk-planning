import React from 'react';
import PropTypes from 'prop-types';
import {SelectInput} from '../UI/Form';

export const EventUpdateMethods = [
    {
        name: 'This event only',
        value: 'single',
    }, {
        name: 'This and all future events',
        value: 'future',
    }, {
        name: 'All events',
        value: 'all',
    },
];

export const EventUpdateMethodInput = (props) => (
    <SelectInput
        {...props}
        options={EventUpdateMethods}
        keyField="value"
        labelField="name"
    />
);

EventUpdateMethodInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};
