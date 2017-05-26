import { SelectField } from './SelectField'
import { connect } from 'react-redux'
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


const mapStateToProps = (state, ownProps) => ({
    multi: false,
    clearable: false,
    options: states.map((s) => (
        {
            label: s.label,
            value: s,
        }
    )),
    value: ownProps.input.value ? {
        label: ownProps.input.value.label,
        value: ownProps.input.value,
    } : states[0],
})

export const EventStateField = connect(mapStateToProps)(SelectField)
