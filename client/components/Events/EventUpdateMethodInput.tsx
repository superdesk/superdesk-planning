import React from 'react';
import PropTypes from 'prop-types';
import {SelectInput} from '../UI/Form';
import {gettext} from '../../utils/gettext';

export const EventUpdateMethods = [
    {
        name: gettext('This event only'),
        value: 'single',
    }, {
        name: gettext('This and all future events'),
        value: 'future',
    }, {
        name: gettext('All Events'),
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
