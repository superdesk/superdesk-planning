import { SelectMetaTermsField } from './SelectMetaTermsField/'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    options: selectors.getEventCalendars(state).map((cat) => (
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

export const EventCalendarField = connect(mapStateToProps)(SelectMetaTermsField)
