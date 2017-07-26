import { SelectField } from './SelectField'
import { connect } from 'react-redux'

export const EventUpdateMethods = [
    {
        name: 'This event only',
        value: 'single',
    }, {
        name: 'This and all future events',
        value: 'future',
    }, {
        name: 'All events',
        value: 'all',
    },
]

const mapStateToProps = (state, ownProps) => ({
    multi: false,
    clearable: false,
    options: EventUpdateMethods.map((opt) => (
        {
            label: opt.name,
            value: opt,
        }
    )),
    value: {
        label: ownProps.input.value.name,
        value: ownProps.input.value,
    },
})

export const EventUpdateMethodField = connect(mapStateToProps)(SelectField)
