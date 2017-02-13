import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { RequiredFieldsValidator } from '../../utils'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { fields } from '../../components'
import './style.scss'

export class Component extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
    }

    theDayAfterStartingDate() {
        let nextDay
        if (this.props.startingDate) {
            nextDay = moment(this.props.startingDate).add(1, 'd')
        }

        return nextDay
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit} className="AddEventForm">
                <div>
                    <Field name="name"
                           component={fields.InputField}
                           type="text"
                           label="What"/>
                </div>
                <div>
                    <Field name="location[0]"
                           component={fields.GeoLookupInput}
                           label="Location"/>
                </div>
                <div>
                    <Field name="dates.start"
                           component={fields.DayPickerInput}
                           withTime={true}/>
                    &nbsp;to&nbsp;
                    <Field name="dates.end"
                           defaultDate={this.theDayAfterStartingDate()}
                           component={fields.DayPickerInput}
                           withTime={true}/>
                </div>
                {this.props.error && <div><strong>{this.props.error}</strong></div>}
            </form>
        )
    }
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'advancedSearch', // a unique name for this form
    validate: RequiredFieldsValidator([]),
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const selector = formValueSelector('advancedSearch') // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end')
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        dispatch(actions.fetchEvents({keyword}))
    )
})

export const AdvancedSearchForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
