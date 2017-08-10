import { SelectField } from './SelectField'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: false,
    clearable: false,
    options: state.vocabularies.eventoccurstatus.map((s) => (
        {
            label: s.label,
            value: s,
        }
    )),
    value: {
        label: ownProps.input.value.label,
        value: ownProps.input.value,
    },
})

export const OccurStatusField = connect(mapStateToProps)(SelectField)
