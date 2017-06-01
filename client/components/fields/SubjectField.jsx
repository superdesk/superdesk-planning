import { SelectMetaTermsField } from './SelectMetaTermsField/'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    options: state.subjects.map((sub) => (
        {
            label: sub.name,
            value: sub,
        }
    )),
    value: (ownProps.input.value || []).map((sub) => (
        {
            label: sub.name,
            value: sub,
        }
    )),
})

export const SubjectField = connect(mapStateToProps)(SelectMetaTermsField)
