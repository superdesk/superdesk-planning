import React from 'react';
import PropTypes from 'prop-types';
import {SelectField} from './SelectField';

const choices = [{
    label: 'Yearly',
    value: 'YEARLY',
}, {
    label: 'Monthly',
    value: 'MONTHLY',
}, {
    label: 'Weekly',
    value: 'WEEKLY',
}, {
    label: 'Daily',
    value: 'DAILY',
}];

export const RepeatsField = (props) => {
    const ownProps = {
        ...props,
        options: choices.map((s) => (
            {
                key: s.label,
                label: s.label,
                value: s.value,
            }
        )),
    };

    return (<SelectField {...ownProps}/>);
};

// eslint-disable-next-line react/no-unused-prop-types
RepeatsField.propTypes = {input: PropTypes.object.isRequired};
