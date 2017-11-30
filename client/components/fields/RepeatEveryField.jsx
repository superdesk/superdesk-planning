import React from 'react';
import PropTypes from 'prop-types';
import {SelectField} from './SelectField';

const frequencies = {
    YEARLY: 'years',
    MONTHLY: 'months',
    WEEKLY: 'weeks',
    DAILY: 'days',
};

export const RepeatEveryField = (props) => {
    const {frequency} = props;

    const getLabel = (n) => {
        const label = n === 0 && frequency ?
            frequencies[frequency].slice(0, -1) :
            frequencies[frequency];

        return `${n} ${label}`;
    };

    const ownProps = {
        ...props,
        options: Array(...{length: 30}).map(Number.call, Number)
            .map((n) => (
                {
                    key: `${n + 1}`,
                    value: `${n + 1}`,
                    label: getLabel(n + 1),
                }
            )),
    };

    return (<SelectField {...ownProps}/>);
};

RepeatEveryField.propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    input: PropTypes.object.isRequired,
    frequency: PropTypes.string.isRequired,
};
