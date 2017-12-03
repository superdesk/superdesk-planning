import React from 'react';
import PropTypes from 'prop-types';
import {SelectField} from './SelectField';
import {SPIKED_STATE} from '../../constants';

const states = [{
    label: 'Exclude spike',
    value: SPIKED_STATE.NOT_SPIKED,
}, {
    label: 'Include spike',
    value: SPIKED_STATE.BOTH,
}, {
    label: 'Spiked only',
    value: SPIKED_STATE.SPIKED,
}];

export const SpikeStateField = (props) => {
    const ownProps = {
        ...props,
        options: states.map((s) => (
            {
                key: s.label,
                label: s.label,
                value: s,
            }
        )),

        getOptionFromValue: (value, options) => options.find(
            (option) => option.key === value.label
        ),
    };

    return (<SelectField {...ownProps}/>);
};

// eslint-disable-next-line react/no-unused-prop-types
SpikeStateField.propTypes = {input: PropTypes.object.isRequired};
