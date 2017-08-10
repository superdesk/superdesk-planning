import React from 'react'
import { SelectField } from './SelectField'
import { SPIKED_STATE } from '../../constants'

const states = [{
    label: 'Exclude spiked events',
    value: SPIKED_STATE.NOT_SPIKED,
}, {
    label: 'Include spiked events',
    value: SPIKED_STATE.BOTH,
}, {
    label: 'Spiked only events',
    value: SPIKED_STATE.SPIKED,
}]

export const SpikeStateField = (props) => {
    const ownProps = {
        ...props,
        multi: false,
        clearable: false,
        options: states.map((s) => (
            {
                label: s.label,
                value: s,
            }
        )),
        value: props.input.value ? {
            label: props.input.value.label,
            value: props.input.value,
        } : states[0],
    }
    return (<SelectField {...ownProps}/>)
}

SpikeStateField.propTypes = { input: React.PropTypes.object.isRequired }
