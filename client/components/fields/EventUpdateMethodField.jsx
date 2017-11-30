import React from 'react';
import PropTypes from 'prop-types';
import {SelectField} from './SelectField';

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

export const EventUpdateMethodField = (props) => {
    const ownProps = {
        ...props,
        options: EventUpdateMethods.map((opt) => (
            {
                key: opt.name,
                label: opt.name,
                value: opt,
            }
        )),
    };

    return <SelectField {...ownProps}/>;
};

// eslint-disable-next-line react/no-unused-prop-types
EventUpdateMethodField.propTypes = {
    input: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
};
