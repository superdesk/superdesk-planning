import React from 'react'
import { SelectField } from './SelectField'
import { ITEM_STATE } from '../../constants'

const states = [{
    label: 'Exclude spiked events',
    value: ITEM_STATE.ACTIVE,
}, {
    label: 'Include spiked events',
    value: ITEM_STATE.ALL,
}, {
    label: 'Spiked only events',
    value: ITEM_STATE.SPIKED,
}]

export const EventStateField = (props) => {
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

EventStateField.propTypes = { input: React.PropTypes.object.isRequired }
