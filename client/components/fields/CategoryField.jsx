import { SelectMetaTermsField } from './SelectMetaTermsField/'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    options: state.vocabularies.categories.map((cat) => (
        {
            label: cat.name,
            value: cat,
        }
    )),
    value: (ownProps.input.value || []).map((cat) => (
        {
            label: cat.name,
            value: cat,
        }
    )),
})

export const CategoryField = connect(mapStateToProps)(SelectMetaTermsField)
