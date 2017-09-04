import { SelectField } from './SelectField'
import { connect } from 'react-redux'
import { get } from 'lodash'

const mapStateToProps = (state) => ({
    options: get(state, 'vocabularies.coverage_providers', []).map((state) => (
        {
            key: state.qcode,
            label: state.name,
            value: state.qcode,
        }
    )),

    getOptionFromValue: (value, options) => options.find(
        option => option.key === value
    ),
})

export const CoverageProviderField = connect(mapStateToProps)(SelectField)
