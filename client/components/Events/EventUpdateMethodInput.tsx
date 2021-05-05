import React from 'react';
import PropTypes from 'prop-types';

import {EVENTS} from '../../constants';
import {SelectInput} from '../UI/Form';

export const EventUpdateMethodInput = (props) => (
    <SelectInput
        {...props}
        options={EVENTS.UPDATE_METHODS}
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
