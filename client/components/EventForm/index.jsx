import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { fields } from '../../components'
import { RelatedPlannings, RepeatEventForm } from '../index'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'
import { isNil, get } from 'lodash'
import moment from 'moment'
import { ChainValidators, EndDateAfterStartDate, RequiredFieldsValidatorFactory, UntilDateValidator } from '../../validators'
import './style.scss'
import { ITEM_STATE } from '../../constants'

/**
* Form for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
export class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = { doesRepeat: false }
    }

    componentWillReceiveProps(nextProps) {
        const { doesRepeat } = nextProps
        if (doesRepeat) {
            this.setState({ doesRepeat: true })
        }
    }

    componentDidMount() {
        this.props.reset()
    }

    oneHourAfterStartingDate() {
        if (this.props.startingDate) {
            return moment(this.props.startingDate).add(1, 'h')
        }
    }

    handleDoesRepeatChange(event) {
        if (!event.target.checked) {
            // if unchecked, remove the recurring rules
            this.props.change('dates.recurring_rule', null)
        } else {
            // if checked, set default recurring rule
            this.props.change('dates.recurring_rule',
                {
                    frequency: 'YEARLY',
                    interval: 1,
                })
        }
        // update the state to hide the recurrent date form
        this.setState({ doesRepeat: event.target.checked })
    }

    render() {
        const {
            pristine,
            submitting,
            onBackClick,
            handleSubmit,
            error,
            startingDate,
            endingDate,
            initialValues,
        } = this.props
        const eventSpiked = get(initialValues, 'state', 'active') === ITEM_STATE.SPIKED

        return (
            <form onSubmit={handleSubmit} className="EventForm">
                <div className="subnav">
                    {pristine && (
                    <div className="subnav__button-stack--square-buttons">
                        <div className="navbtn" title="Back to list">
                            <button onClick={onBackClick} type="button">
                                <i className="icon-chevron-left-thin"/>
                            </button>
                        </div>
                    </div>
                    )}
                    <span className="subnav__page-title">Event details</span>
                    {(!pristine && !submitting) && (
                        <div>
                            {!eventSpiked &&
                                <button type="submit" className="btn btn--primary">
                                    Save
                                </button>
                            }
                            <button type="button" className="btn" onClick={onBackClick}>Cancel</button>
                        </div>
                    )}
                </div>
                <div className="EventForm__form">
                    {error && <div className="error-block">{error}</div>}
                    <div>
                        <label htmlFor="name">What</label>
                    </div>
                    <div>
                        <Field name="name"
                               component={fields.InputField}
                               type="text"/>
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
                        <label htmlFor="dates.start">From</label>
                    </div>
                    <div>
                        <Field name="dates.start"
                               component={fields.DayPickerInput}
                               selectsStart={true}
                               startDate={startingDate}
                               endDate={endingDate}
                               withTime={true}/>
                    </div>
                    <div>
                        <label htmlFor="dates.end">To</label>
                    </div>
                    <div>
                        <Field name="dates.end"
                               defaultDate={this.oneHourAfterStartingDate()}
                               component={fields.DayPickerInput}
                               selectsEnd={true}
                               startDate={startingDate}
                               endDate={endingDate}
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
                        <Field name="occur_status"
                               component={fields.OccurStatusField}
                               label="Event Occurence Status"/>
                    </div>
                    <div>
                        <label htmlFor="files">Attached files</label>
                        <FieldArray name="files" component={fields.FilesFieldArray} />
                    </div>
                    <div>
                        <label htmlFor="links">External links</label>
                        <FieldArray name="links" component={fields.LinksFieldArray} />
                    </div>
                    {initialValues && initialValues._plannings &&
                        initialValues._plannings.length > 0 &&
                        <div>
                            <label htmlFor="links">Related planning items</label>
                            <RelatedPlannings plannings={initialValues._plannings}
                                openPlanningItem={true}/>
                        </div>
                    }
                </div>
            </form>
        )
    }
}

Component.propTypes = {
    startingDate: React.PropTypes.object,
    endingDate: React.PropTypes.object,
    onBackClick: React.PropTypes.func,
    error: React.PropTypes.object,
    handleSubmit: React.PropTypes.func,
    change: React.PropTypes.func,
    doesRepeat: React.PropTypes.bool,
    pristine: React.PropTypes.bool,
    submitting: React.PropTypes.bool,
    initialValues: React.PropTypes.object,
    reset: React.PropTypes.func,
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    validate: ChainValidators([
        EndDateAfterStartDate,
        RequiredFieldsValidatorFactory(['name', 'dates.start', 'dates.end']),
        UntilDateValidator,
    ]),
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
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
    ),
})

export const EventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
