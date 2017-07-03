import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { RelatedPlannings, RepeatEventForm, fields, Toggle, EventHistoryContainer } from '../index'
import { Field, FieldArray, reduxForm, formValueSelector, getFormValues } from 'redux-form'
import { isNil, get } from 'lodash'
import { PubStatusLabel } from '../index'
import moment from 'moment'
import { ChainValidators, EndDateAfterStartDate, RequiredFieldsValidatorFactory, UntilDateValidator } from '../../validators'
import './style.scss'
import { ITEM_STATE, EVENTS } from '../../constants'
import * as selectors from '../../selectors'
import { OverlayTrigger } from 'react-bootstrap'
import { tooltips } from '../index'
import PropTypes from 'prop-types'
import { ItemActionsMenu } from '../index'
import { isEventAllDay } from '../../utils'

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
            previewHistory: false,
        }
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
        if (this.props.startingDate && !this.props.endingDate) {
            return moment(this.props.startingDate).add(1, 'h')
        }
    }

    viewEventHistory() {
        this.setState({ previewHistory: true })
    }

    closeEventHistory() {
        this.setState({ previewHistory: false })
    }

    handleDoesRepeatChange(event) {
        // let doesRepeat = !event.target.value
        if (!event.target.value) {
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
        this.setState({ doesRepeat: event.target.value })
    }

    handleAllDayChange(event) {
        let newStart
        let newEnd

        if (event.target.value) {
            // If allDay is enabled, then set the event to all day
            newStart = get(this.props, 'startingDate', moment()).clone().startOf('day')
            newEnd = get(this.props, 'endingDate', moment()).clone().endOf('day')
        } else {
            // If allDay is disabled, then set the new dates to the initial values
            // since last save
            newStart = get(this.props, 'initialValues.dates.start', moment()).clone()
            newEnd = get(this.props, 'initialValues.dates.end', moment().clone().add(1, 'h'))

            // If the initial values were all day, then set the end minutes to 55
            // So that the allDay toggle is turned off
            if (isEventAllDay(newStart, newEnd)) {
                newEnd.minutes(55)
            }
        }

        this.props.change('dates.start', newStart)
        this.props.change('dates.end', newEnd)
    }

    render() {
        const {
            pristine,
            submitting,
            onBackClick,
            handleSubmit,
            error,
            initialValues,
            users,
            readOnly,
            openEventDetails,
            spikeEvent,
            unspikeEvent,
            addEventToCurrentAgenda,
            publish,
            unpublish,
            saveAndPublish,
            duplicateEvent,
            highlightedEvent,
        } = this.props
        const eventSpiked = get(initialValues, 'state', 'active') === ITEM_STATE.SPIKED
        const updatedReadOnly = readOnly || eventSpiked
        const creationDate = get(initialValues, '_created')
        const updatedDate = get(initialValues, '_updated')
        const id = get(initialValues, '_id')
        const author = get(initialValues, 'original_creator') && users ? users.find((u) => (u._id === initialValues.original_creator)) : null
        const versionCreator = get(initialValues, 'version_creator') && users ? users.find((u) => (u._id === initialValues.version_creator)) : null
        const isPublished = get(initialValues, 'pubstatus') === EVENTS.PUB_STATUS.USABLE
        let itemActions = []
        if (eventSpiked) {
            itemActions = [
                {
                    label: 'Unspike Event',
                    callback: unspikeEvent.bind(null, initialValues),
                },
                {
                    label: 'View Event History',
                    callback: this.viewEventHistory.bind(this),
                },
            ]
        } else if (id) {
            itemActions = [
                {
                    label: 'Spike Event',
                    callback: () => spikeEvent(initialValues),
                },
                {
                    label: 'Create Planning Item',
                    callback: () => addEventToCurrentAgenda(initialValues),
                },
                {
                    label: 'Duplicate Event',
                    callback: () => duplicateEvent(initialValues),
                },
                {
                    label: 'View Event History',
                    callback: this.viewEventHistory.bind(this),
                },
            ]
        }
        return (
            <form onSubmit={handleSubmit} className="EventForm">
                <div className="subnav">
                    {pristine && (
                        <div className="subnav__button-stack--square-buttons">
                            <div className="navbtn" title="Back to list">
                                <button onClick={onBackClick} type="button" className="backlink" />
                            </div>
                        </div>
                    )}
                    <span className="subnav__page-title">
                        {!this.state.previewHistory && 'Event details'}
                        {this.state.previewHistory && 'Event history'}
                    </span>
                    {(!pristine && !submitting) && (
                        <div>
                            <button type="button" className="btn" onClick={onBackClick}>Cancel</button>
                            {!updatedReadOnly &&
                                <button type="submit" className="btn btn--primary">
                                    Save
                                </button>
                            }
                            {!updatedReadOnly && !isPublished &&
                                <button onClick={() => saveAndPublish(id)} type="button" className="btn btn--highlight">
                                    Save and publish
                                </button>
                            }
                        </div>
                    )}
                    { updatedReadOnly && !this.state.previewHistory && (
                        <div className="subnav__actions">
                            <div>
                                {!isPublished &&
                                    <button
                                        onClick={() => publish(id)}
                                        type="button"
                                        className="btn btn--highlight">
                                        Publish</button>
                                }
                                {isPublished &&
                                    <button
                                        onClick={() => unpublish(id)}
                                        type="button"
                                        className="btn btn--hollow">
                                        Unpublish</button>
                                }
                                {!eventSpiked && (<OverlayTrigger placement="bottom" overlay={tooltips.editTooltip}>
                                    <button onClick={openEventDetails.bind(null, id)}>
                                        <i className="icon-pencil"/>
                                    </button>
                                </OverlayTrigger>)}
                            </div>
                        </div>)
                    }
                </div>
                {!this.state.previewHistory &&
                    <div className="EventForm__form">
                    <div className="TimeAndAuthor">
                        {creationDate && author &&
                            <div>Created {moment(creationDate).fromNow()} by <span className='TimeAndAuthor__author'> {author.display_name}</span>
                            </div>
                        }
                        {updatedDate && versionCreator &&
                            <div>Updated {moment(updatedDate).fromNow()} by <span className='TimeAndAuthor__author'> {versionCreator.display_name}</span>
                            </div>
                        }
                    </div>
                    <PubStatusLabel status={get(initialValues, 'pubstatus')} verbose={true}/>
                    <ItemActionsMenu actions={itemActions} />
                    {error && <div className="error-block">{error}</div>}
                    <div>
                        <label htmlFor="slugline">Slugline</label>
                    </div>
                    <div>
                        <Field name="slugline"
                            component={fields.InputField}
                            type="text"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <label htmlFor="name">Name</label>
                    </div>
                    <div>
                        <Field name="name"
                            component={fields.InputField}
                            type="text"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <Field name="anpa_category"
                            component={fields.CategoryField}
                            label="Category"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <Field name="subject"
                            component={fields.SubjectField}
                            label="Subject"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <Field name="definition_short"
                            component={fields.InputTextAreaField}
                            label="Description"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <Field name="location[0]"
                            component={fields.GeoLookupInput}
                            label="Location"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <label htmlFor="dates.start">From</label>
                    </div>
                    <div>
                        <Field name="dates.start"
                               component={fields.DayPickerInput}
                               withTime={true}
                               readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <label htmlFor="dates.end">To</label>
                    </div>
                    <div>
                        <Field name="dates.end"
                               defaultDate={this.oneHourAfterStartingDate()}
                               component={fields.DayPickerInput}
                               withTime={true}
                               readOnly={updatedReadOnly}/>
                    </div>
                    <label>
                        <Toggle
                            value={this.props.isAllDay}
                            onChange={this.handleAllDayChange.bind(this)}
                            readOnly={updatedReadOnly}/> All Day
                    </label>
                    <div>
                        <label>
                            <Toggle
                                name="doesRepeat"
                                value={this.state.doesRepeat}
                                onChange={this.handleDoesRepeatChange.bind(this)}
                                readOnly={updatedReadOnly}/> Repeat
                        </label>
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
                            label="Event Occurence Status"
                            readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <label htmlFor="files">Attached files</label>
                        <FieldArray name="files" component={fields.FilesFieldArray} readOnly={updatedReadOnly}/>
                    </div>
                    <div>
                        <label htmlFor="links">External links</label>
                        <FieldArray name="links" component={fields.LinksFieldArray} readOnly={updatedReadOnly} />
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
                }
                {this.state.previewHistory &&
                    <div className="history-preview">
                        <div className="close-history">
                            <a onClick={this.closeEventHistory.bind(this)} className="close">
                                <i className="icon-close-small" />
                            </a>
                        </div>
                        <EventHistoryContainer highlightedEvent={highlightedEvent} />
                    </div>
                }
            </form>
        )
    }
}

Component.propTypes = {
    startingDate: PropTypes.object,
    endingDate: PropTypes.object,
    onBackClick: PropTypes.func,
    error: PropTypes.object,
    handleSubmit: PropTypes.func,
    change: PropTypes.func,
    doesRepeat: PropTypes.bool,
    pristine: PropTypes.bool,
    submitting: PropTypes.bool,
    initialValues: PropTypes.object,
    reset: PropTypes.func,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    readOnly: PropTypes.bool,
    openEventDetails: PropTypes.func,
    publish: PropTypes.func.isRequired,
    unpublish: PropTypes.func.isRequired,
    saveAndPublish: PropTypes.func.isRequired,
    spikeEvent: PropTypes.func.isRequired,
    unspikeEvent: PropTypes.func.isRequired,
    addEventToCurrentAgenda: PropTypes.func.isRequired,
    duplicateEvent: PropTypes.func.isRequired,
    isAllDay: PropTypes.bool,
    highlightedEvent: React.PropTypes.string,
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
    highlightedEvent: selectors.getHighlightedEvent(state),
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end'),
    doesRepeat: !isNil(selector(state, 'dates.recurring_rule.frequency')),
    users: selectors.getUsers(state),
    readOnly: selectors.getEventReadOnlyState(state),
    formValues: getFormValues('addEvent')(state),
    isAllDay: isEventAllDay(
        selector(state, 'dates.start'),
        selector(state, 'dates.end')
    ),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => (
        // if needed, show a confirmation dialog
        dispatch(actions.askConfirmationBeforeSavingEvent(event))
        // save the event through the API
            .then(() => dispatch(actions.uploadFilesAndSaveEvent(event)))
    ),
    openEventDetails: (event) => dispatch(actions.openEventDetails(event)),
    publish: (eventId) => dispatch(actions.publishEvent(eventId)),
    unpublish: (eventId) => dispatch(actions.unpublishEvent(eventId)),
    saveAndPublish: (eventId) => dispatch(actions.unpublishEvent(eventId)),
    spikeEvent: (event) => dispatch(actions.spikeEvent(event)),
    unspikeEvent: (event) => dispatch(actions.unspikeEvent(event)),
    addEventToCurrentAgenda: (event) => dispatch(actions.addEventToCurrentAgenda(event)),
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
})

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    saveAndPublish: () => (
        dispatchProps.onSubmit(stateProps.formValues)
            .then((events) => dispatchProps.publish(events[0]._id))
    ),
})

export const EventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    { withRef: true })(FormComponent)
