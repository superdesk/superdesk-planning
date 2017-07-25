import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { RelatedPlannings, RepeatEventForm, fields, Toggle, EventHistoryContainer, AuditInformation } from '../index'
import { Field, FieldArray, reduxForm, formValueSelector, getFormValues } from 'redux-form'
import { isNil, get, isEqual, remove } from 'lodash'
import { PubStatusLabel } from '../index'
import moment from 'moment'
import {
    ChainValidators,
    EndDateAfterStartDate,
    RequiredFieldsValidatorFactory,
    UntilDateValidator,
    EventMaxEndRepeatCount } from '../../validators'
import './style.scss'
import { ITEM_STATE, EVENTS } from '../../constants'
import * as selectors from '../../selectors'
import { OverlayTrigger } from 'react-bootstrap'
import { tooltips } from '../index'
import PropTypes from 'prop-types'
import { ItemActionsMenu, UnlockItem, UserAvatar } from '../index'
import { isEventAllDay, doesRecurringEventsOverlap } from '../../utils'
import classNames from 'classnames'

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
            openUnlockPopup: false,
            recurringRuleEdited: false,
        }
    }

    componentWillReceiveProps(nextProps) {
        const { doesRepeat } = nextProps
        const recurringRuleNextState = this.getNextRecurringRuleState(nextProps)

        if (doesRepeat || this.state.recurringRuleEdited !== recurringRuleNextState) {
            this.setState({
                doesRepeat: true,
                recurringRuleEdited: recurringRuleNextState,
            })
        }
    }

    componentDidMount() {
        this.props.reset()
    }

    getNextRecurringRuleState(nextProps) {
        const recurringRuleFields = [
            'dates.start',
            'dates.end',
            'dates.recurring_rule',
        ]

        // CTRL-Z was done to bring form back to pristine: reset its state value
        if (nextProps.pristine || !get(this.props.initialValues, 'dates.recurring_rule') ||
            !nextProps.doesRepeat)
            return false

        // Return true if any recurring-rules field got changed
        return recurringRuleFields.some((field) => {
            if (!isEqual(get(nextProps.formValues, field), get(this.props.initialValues, field))) {
                return true
            }
        })
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

    handleSaveAndPublish(event) {
        this.props.saveAndPublish(event)
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

    getLockedUser(event) {
        return get(event, 'lock_user') && Array.isArray(this.props.users) ?
            this.props.users.find((u) => (u._id === event.lock_user)) : null
    }

    toggleOpenUnlockPopup() {
        this.setState({ openUnlockPopup: !this.state.openUnlockPopup })
    }

    isMetaDataEditable() {
        // Editable if form is new event or pristine or non recurring event
        // or recurring rules not edited
        return (!get(this.props.initialValues, '_id') || !this.props.doesRepeat || this.props.pristine || !this.state.recurringRuleEdited)
    }

    isRecurringRulesEditable() {
        // Editable if form is new event or pristine or recurring event
        // or recurring rules edited
        return (!get(this.props.initialValues, '_id') || !get(this.props.initialValues, 'dates.recurring_rule') || this.props.pristine || this.state.recurringRuleEdited)
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
            duplicateEvent,
            highlightedEvent,
            lockedInThisSession,
            unlockPrivilege,
            onUnlock,
            startingDate,
            endingDate,
            recurringRule,
        } = this.props
        const eventSpiked = get(initialValues, 'state', 'active') === ITEM_STATE.SPIKED
        const creationDate = get(initialValues, '_created')
        const updatedDate = get(initialValues, '_updated')
        const id = get(initialValues, '_id')
        const forcedReadOnly = !isNil(id) && (readOnly || eventSpiked || !lockedInThisSession)
        const author = get(initialValues, 'original_creator') && users ? users.find((u) => (u._id === initialValues.original_creator)) : null
        const versionCreator = get(initialValues, 'version_creator') && users ? users.find((u) => (u._id === initialValues.version_creator)) : null
        const isPublished = get(initialValues, 'state') === EVENTS.STATE.PUBLISHED
        const lockedUser = this.getLockedUser(initialValues)
        const metaDataEditable =  !forcedReadOnly && this.isMetaDataEditable()
        const recurringRulesEditable =  !forcedReadOnly && this.isRecurringRulesEditable()
        const occurrenceOverlaps = doesRecurringEventsOverlap(startingDate, endingDate, recurringRule)

        const RepeatEventFormProps = {
            ...this.props,
            readOnly: !recurringRulesEditable,
        }

        let itemActions = []
        const populateItemActions = () => {
            if (eventSpiked) {
                itemActions = [
                    {
                        label: 'View Event History',
                        callback: this.viewEventHistory.bind(this),
                    },
                ]

                if (!lockedUser || lockedInThisSession) {
                    itemActions.unshift({
                        label: 'Unspike Event',
                        callback: unspikeEvent.bind(null, initialValues),
                    })
                }
            } else if (id) {
                itemActions = [
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

                if (!isPublished && (!lockedUser || lockedInThisSession)) {
                    itemActions.unshift({
                        label: 'Spike Event',
                        callback: () => spikeEvent(initialValues),
                    })
                }

                // Cannot spike or create new events if it is a recurring event and
                // only metadata was edited
                if ( metaDataEditable && !recurringRulesEditable) {
                    remove(itemActions, (action) => action.label === 'Spike Event' ||
                        action.label === 'Duplicate Event')
                }
            }
        }

        populateItemActions()

        return (
            <form onSubmit={handleSubmit} className="EventForm">
                <div className="subnav">
                    {pristine && forcedReadOnly && (
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
                    {!forcedReadOnly && (
                        <div>
                            <button type="button" className="btn" onClick={onBackClick}>Cancel</button>
                            <button type="submit" className="btn btn--primary" disabled={pristine || submitting}>
                                Save
                            </button>
                            {!isPublished &&
                                <button
                                    onClick={handleSubmit(this.handleSaveAndPublish.bind(this))}
                                    type="button"
                                    className="btn btn--success"
                                    disabled={submitting}>
                                    Save and publish
                                </button>
                            }
                        </div>
                    )}
                    {!this.state.previewHistory && (
                        <div className="subnav__actions">
                            <div>
                                {forcedReadOnly && !isPublished && !eventSpiked &&
                                    <button
                                        onClick={() => publish(id)}
                                        type="button"
                                        className="btn btn--success">
                                        Publish</button>
                                }
                                {isPublished &&
                                    <button
                                        onClick={() => unpublish(id)}
                                        type="button"
                                        className="btn btn--hollow">
                                        Unpublish</button>
                                }
                                {forcedReadOnly && !eventSpiked && (<OverlayTrigger placement="bottom" overlay={tooltips.editTooltip}>
                                    <button
                                        type='button'
                                        onClick={openEventDetails.bind(null, initialValues)}
                                        className="navbtn navbtn--right">
                                        <i className="icon-pencil"/>
                                    </button>
                                </OverlayTrigger>)}
                            </div>
                        </div>)
                    }
                </div>
                {!this.state.previewHistory &&
                    <div className="EventForm__form">
                    <PubStatusLabel status={get(initialValues, 'state')} verbose={true}/>
                    <ItemActionsMenu actions={itemActions} />
                    <div>
                        {(!lockedInThisSession && lockedUser)
                            && (
                            <div className={classNames('dropdown',
                                'dropdown--dropright',
                                { 'open': this.state.openUnlockPopup })} >
                                <div className="lock-avatar">
                                    <button type='button' onClick={this.toggleOpenUnlockPopup.bind(this)}>
                                        <UserAvatar user={lockedUser} withLoggedInfo={true} />
                                    </button>
                                    {this.state.openUnlockPopup && <UnlockItem user={lockedUser}
                                        showUnlock={unlockPrivilege}
                                        onCancel={this.toggleOpenUnlockPopup.bind(this)}
                                        onUnlock={onUnlock.bind(this, initialValues)}/>}
                                </div>
                            </div>
                        )}
                        <AuditInformation
                            createdBy={author}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate} />
                    </div>
                    { !forcedReadOnly && !metaDataEditable && <span className="error-block">Editing event's metadata disabled</span> }
                    { !forcedReadOnly && !recurringRulesEditable && <span className="error-block">Editing event's recurring rules values disabled</span> }
                    {error && <div className="error-block">{error}</div>}
                    <div>
                        <label htmlFor="slugline">Slugline</label>
                    </div>
                    <div>
                        <Field name="slugline"
                            component={fields.InputField}
                            type="text"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <label htmlFor="name">Name</label>
                    </div>
                    <div>
                        <Field name="name"
                            component={fields.InputField}
                            type="text"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <Field name="anpa_category"
                            component={fields.CategoryField}
                            label="Category"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <Field name="subject"
                            component={fields.SubjectField}
                            label="Subject"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <Field name="definition_short"
                            component={fields.InputField}
                            type="text"
                            label="Short Description"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <Field name="definition_long"
                            component={fields.InputTextAreaField}
                            multiLine={true}
                            label="Description"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <Field name="internal_note"
                            component={fields.InputTextAreaField}
                            label="Internal Note"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <Field name="location[0]"
                            component={fields.GeoLookupInput}
                            label="Location"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <label htmlFor="dates.start">From</label>
                    </div>
                    <div>
                        <Field name="dates.start"
                               component={fields.DayPickerInput}
                               withTime={true}
                               readOnly={!recurringRulesEditable}/>&nbsp;
                        { occurrenceOverlaps && (
                            <span className="error-block">Events Overlap!</span>
                        )}
                    </div>
                    <div>
                        <label htmlFor="dates.end">To</label>
                    </div>
                    <div>
                        <Field name="dates.end"
                               defaultDate={this.oneHourAfterStartingDate()}
                               component={fields.DayPickerInput}
                               withTime={true}
                               readOnly={!recurringRulesEditable}/>
                    </div>
                    <label>
                        <Toggle
                            value={this.props.isAllDay}
                            onChange={this.handleAllDayChange.bind(this)}
                            readOnly={!recurringRulesEditable}/> All Day
                    </label>
                    <div>
                        <label>
                            <Toggle
                                name="doesRepeat"
                                value={this.state.doesRepeat}
                                onChange={this.handleDoesRepeatChange.bind(this)}
                                readOnly={!recurringRulesEditable}/> Repeat
                        </label>
                        {
                            this.state.doesRepeat &&
                            // as <RepeatEventForm/> contains fields, we provide the props in this form
                            // see http://redux-form.com/6.2.0/docs/api/Props.md
                            <RepeatEventForm { ...RepeatEventFormProps } />
                        }
                    </div>
                    <div>
                        <Field name="occur_status"
                            component={fields.OccurStatusField}
                            label="Event Occurence Status"
                            readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <label htmlFor="files">Attached files</label>
                        <FieldArray name="files" component={fields.FilesFieldArray} readOnly={!metaDataEditable}/>
                    </div>
                    <div>
                        <label htmlFor="links">External links</label>
                        <FieldArray name="links" component={fields.LinksFieldArray} readOnly={!metaDataEditable} />
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
                        <EventHistoryContainer highlightedEvent={highlightedEvent}
                            closeEventHistory={this.closeEventHistory.bind(this)}/>
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
    highlightedEvent: PropTypes.string,
    lockedInThisSession: PropTypes.bool,
    onUnlock: PropTypes.func,
    unlockPrivilege: PropTypes.bool,
    recurringRule: PropTypes.object,
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    validate: ChainValidators([
        EndDateAfterStartDate,
        RequiredFieldsValidatorFactory(['name', 'dates.start', 'dates.end']),
        UntilDateValidator,
        EventMaxEndRepeatCount,
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
    lockedInThisSession: selectors.isEventDetailLockedInThisSession(state),
    unlockPrivilege: selectors.getPrivileges(state).planning_unlock ? true : false,
    maxRecurrentEvents: selectors.getMaxRecurrentEvents(state),
    recurringRule: selector(state, 'dates.recurring_rule'),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.saveEventWithConfirmation(event)),
    openEventDetails: (event) => dispatch(actions.events.ui.openEventDetails(event)),
    saveAndPublish: (event) => dispatch(actions.saveAndPublish(event)),
    publish: (eventId) => dispatch(actions.publishEvent(eventId)),
    unpublish: (eventId) => dispatch(actions.unpublishEvent(eventId)),
    spikeEvent: (event) => dispatch(actions.events.ui.openSpikeModal(event)),
    unspikeEvent: (event) => dispatch(actions.unspikeEvent(event)),
    addEventToCurrentAgenda: (event) => dispatch(actions.addEventToCurrentAgenda(event)),
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
})

export const EventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
