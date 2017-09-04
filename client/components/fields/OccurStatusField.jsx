import { SelectField } from './SelectField'
import { connect } from 'react-redux'

const mapStateToProps = (state) => ({
    options: state.vocabularies.eventoccurstatus.map((state) => (
        {
            key: state.qcode,
            label: state.label,
            value: state,
        }
    )),

    getOptionFromValue: (value, options) => options.find(
        option => option.key === value.qcode
    ),
})

export const OccurStatusField = connect(mapStateToProps)(SelectField)
