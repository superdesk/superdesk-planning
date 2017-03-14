import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { fields } from '../../components'
import { RepeatEventForm } from '../index'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'
import { isNil } from 'lodash'
import moment from 'moment'
import { ChainValidators, EndDateAfterStartDate, RequiredFieldsValidatorFactory, UntilDateAfterStartDate} from '../../validators'
import './style.scss'

/**
* Form for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
export class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            doesRepeat: false,
        }
    }

    componentWillReceiveProps(props) {
        const { doesRepeat } = props
        if (doesRepeat) {
            this.setState({ doesRepeat: true })
        }
    }

    oneHourAfterStartingDate() {
        if (this.props.startingDate) {
            return moment(this.props.startingDate).add(1, 'h')
        }
    }

    handleDoesRepeatChange(event) {
        if (!event.target.checked) {
            // if unchecked, remove the recurring rules
            this.props.change('dates.recurring_rule', {})
        }
        // update the state to hide the recurrent date form
        this.setState({ doesRepeat: event.target.checked })
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
                    <Field name="anpa_category"
                           component={fields.CategoryField}
                           label="Category"/>
                </div>
                <div>
                    <Field name="definition_short"
                           component={fields.InputTextAreaField}
                           label="Description"/>
                </div>
                <div>
                    <Field name="location[0]"
                           component={fields.GeoLookupInput}
                           label="Location"/>
                </div>
                <div>
                    <label htmlFor="dates.start">When</label>
                </div>
                <div>
                    <Field name="dates.start"
                           component={fields.DayPickerInput}
                           selectsStart={true}
                           startDate={this.props.startingDate}
                           endDate={this.props.endingDate}
                           withTime={true}/>
                    &nbsp;to&nbsp;
                    <Field name="dates.end"
                           defaultDate={this.oneHourAfterStartingDate()}
                           component={fields.DayPickerInput}
                           selectsEnd={true}
                           startDate={this.props.startingDate}
                           endDate={this.props.endingDate}
                           withTime={true}/>
                </div>
                <div>
                    <label htmlFor="repeat">Repeat ...</label>
                    <input
                        name="doesRepeat"
                        type="checkbox"
                        value={true}
                        checked={this.state.doesRepeat}
                        onChange={this.handleDoesRepeatChange.bind(this)}/>
                    {
                        this.state.doesRepeat &&
                        // as <RepeatEventForm/> contains fields, we provide the props in this form
                        // see http://redux-form.com/6.2.0/docs/api/Props.md
                        <RepeatEventForm {...this.props} />
                    }
                </div>
                <div>
                    <label htmlFor="files">Attached files</label>
                    <FieldArray name="files" component={fields.FilesFieldArray} />
                </div>
                <div>
                    <label htmlFor="links">Event Links</label>
                    <FieldArray name="links" component={fields.LinksFieldArray} />
                </div>
                {this.props.error && <div><strong>{this.props.error}</strong></div>}
            </form>
        )
    }
}

Component.propTypes = {
    startingDate: React.PropTypes.object,
    endingDate: React.PropTypes.object,
    error: React.PropTypes.object,
    handleSubmit: React.PropTypes.func,
    change: React.PropTypes.func,
    doesRepeat: React.PropTypes.bool,
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    validate: ChainValidators([EndDateAfterStartDate, RequiredFieldsValidatorFactory(['name', 'dates.start']),
        UntilDateAfterStartDate]),
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const selector = formValueSelector('addEvent') // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end'),
    doesRepeat: !isNil(selector(state, 'dates.recurring_rule.frequency')),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        // save the event through the API
        dispatch(actions.uploadFilesAndSaveEvent(event))
    )
})

export const AddEventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
