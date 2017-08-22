import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { RelatedPlannings, RepeatEventForm, Toggle, EventHistoryContainer, AuditInformation } from '../index'
import { reduxForm, formValueSelector, getFormValues } from 'redux-form'
import { isNil, get, isEqual, remove } from 'lodash'
import { StateLabel } from '../index'
import moment from 'moment'
import {
    ChainValidators,
    EndDateAfterStartDate,
    RequiredFieldsValidatorFactory,
    UntilDateValidator,
    EventMaxEndRepeatCount } from '../../validators'
import './style.scss'
import { PRIVILEGES, EVENTS, GENERIC_ITEM_ACTIONS } from '../../constants'
import * as selectors from '../../selectors'
import { OverlayTrigger } from 'react-bootstrap'
import { tooltips } from '../index'
import PropTypes from 'prop-types'
import { ItemActionsMenu, UnlockItem, UserAvatar } from '../index'
import classNames from 'classnames'
import {
    eventUtils,
    getLockedUser,
    isItemLockedInThisSession,
    isItemLockRestricted,
    isItemSpiked,
    isItemPublic,
} from '../../utils'
import { fieldRenders } from './fieldRenders.jsx'

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
            if (eventUtils.isEventAllDay(newStart, newEnd)) {
                newEnd.minutes(55)
            }
        }

        this.props.change('dates.start', newStart)
        this.props.change('dates.end', newEnd)
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
            onCancelEvent,
            addEventToCurrentAgenda,
            publish,
            unpublish,
            duplicateEvent,
            highlightedEvent,
            session,
            privileges,
            onUnlock,
            startingDate,
            endingDate,
            recurringRule,
            formProfile,
        } = this.props

        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK]

        const eventSpiked = isItemSpiked(initialValues)
        const creationDate = get(initialValues, '_created')
        const updatedDate = get(initialValues, '_updated')
        const existingEvent = !!get(initialValues, '_id')
        const forcedReadOnly = existingEvent && (readOnly || eventSpiked ||
            !isItemLockedInThisSession(initialValues, session))
        const author = get(initialValues, 'original_creator') && users ? users.find((u) => (u._id === initialValues.original_creator)) : null
        const versionCreator = get(initialValues, 'version_creator') && users ? users.find((u) => (u._id === initialValues.version_creator)) : null
        const lockedUser = getLockedUser(initialValues, users)
        const metaDataEditable =  !forcedReadOnly && this.isMetaDataEditable()
        const recurringRulesEditable =  !forcedReadOnly && this.isRecurringRulesEditable()
        const occurrenceOverlaps = eventUtils.doesRecurringEventsOverlap(startingDate, endingDate, recurringRule)
        const lockRestricted =  isItemLockRestricted(initialValues, session)
        const isPublic = isItemPublic(initialValues)
        const canPublish = eventUtils.canPublishEvent(initialValues, session, privileges)
        const canUnpublish = eventUtils.canUnpublishEvent(initialValues, privileges)
        const canEditEvent = eventUtils.canEditEvent(initialValues, session, privileges)

        const RepeatEventFormProps = {
            ...this.props,
            readOnly: !recurringRulesEditable,
        }

        let itemActions = []
        if (existingEvent) {
            const actions = [
                {
                    ...GENERIC_ITEM_ACTIONS.SPIKE,
                    callback: spikeEvent.bind(null, initialValues),
                },
                {
                    ...GENERIC_ITEM_ACTIONS.UNSPIKE,
                    callback: unspikeEvent.bind(null, initialValues),
                },
                {
                    ...GENERIC_ITEM_ACTIONS.HISTORY,
                    callback: this.viewEventHistory.bind(this),
                },
                {
                    ...GENERIC_ITEM_ACTIONS.DUPLICATE,
                    callback: duplicateEvent.bind(null, initialValues),
                },
                {
                    ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                    callback: onCancelEvent.bind(null, initialValues),
                },
                GENERIC_ITEM_ACTIONS.DIVIDER,
                {
                    ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                    callback: addEventToCurrentAgenda.bind(null, initialValues),
                },
            ]

            itemActions = eventUtils.getEventItemActions(initialValues, session, privileges, actions)

            // Cannot spike or create new events if it is a recurring event and
            // only metadata was edited
            if ( this.state.doesRepeat && metaDataEditable && !recurringRulesEditable) {
                remove(itemActions, (action) => action.label === GENERIC_ITEM_ACTIONS.SPIKE.label ||
                    action.label === GENERIC_ITEM_ACTIONS.DUPLICATE.label)
            }
        }

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
                    {!forcedReadOnly && !this.state.previewHistory && (
                        <div className="subnav__actions">
                            <button
                                type="button"
                                className="btn"
                                disabled={submitting}
                                onClick={onBackClick}>
                                Cancel
                            </button>
                            {!isPublic &&
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={pristine || submitting}>
                                    Save
                                </button>
                            }
                            {!isPublic && canPublish &&
                                <button
                                    onClick={handleSubmit(this.handleSaveAndPublish.bind(this))}
                                    type="button"
                                    className="btn btn--success"
                                    disabled={submitting}>
                                    {pristine ? 'Publish' : 'Save and publish'}
                                </button>
                            }
                            {canUnpublish &&
                                <button
                                    onClick={handleSubmit(this.handleSaveAndPublish.bind(this))}
                                    type="button"
                                    className="btn btn--primary"
                                    disabled={pristine || submitting}>
                                    Save and update
                                </button>
                            }
                            {canUnpublish &&
                                <button
                                    onClick={unpublish.bind(null, initialValues)}
                                    type="button"
                                    disabled={submitting}
                                    className="btn btn--hollow">
                                    Unpublish
                                </button>
                            }
                        </div>
                    )}
                    {forcedReadOnly && !this.state.previewHistory && (
                        <div className="subnav__actions">
                            <div>
                                {canPublish &&
                                    <button
                                        onClick={publish.bind(null, initialValues)}
                                        type="button"
                                        className="btn btn--success">
                                        Publish</button>
                                }
                                {canUnpublish &&
                                    <button
                                        onClick={unpublish.bind(null, initialValues)}
                                        type="button"
                                        className="btn btn--hollow">
                                        Unpublish</button>
                                }
                                {canEditEvent && (
                                    <OverlayTrigger
                                        placement="bottom"
                                        overlay={tooltips.editTooltip}>
                                        <button
                                            type='button'
                                            onClick={openEventDetails.bind(null, initialValues)}
                                            className="navbtn navbtn--right">
                                            <i className="icon-pencil"/>
                                        </button>
                                    </OverlayTrigger>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {!this.state.previewHistory &&
                    <div className="EventForm__form">
                    <ItemActionsMenu actions={itemActions} />
                    <div>
                        {lockRestricted && (
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
                    {existingEvent && <StateLabel item={initialValues} verbose={true}/>}
                    { !forcedReadOnly && !metaDataEditable && <span className="error-block">Editing event's metadata disabled</span> }
                    { !forcedReadOnly && !recurringRulesEditable && <span className="error-block">Editing event's recurring rules values disabled</span> }
                    {error && <div className="error-block">{error}</div>}

                    {get(formProfile, 'editor.slugline.enabled') && fieldRenders.renderSlugline(!metaDataEditable)}
                    {get(formProfile, 'editor.name.enabled') && fieldRenders.renderName(!metaDataEditable)}
                    {get(formProfile, 'editor.calendars.enabled') && fieldRenders.renderCalender(!metaDataEditable)}
                    {get(formProfile, 'editor.anpa_category.enabled') && fieldRenders.renderCategory(!metaDataEditable)}
                    {get(formProfile, 'editor.subject.enabled') && fieldRenders.renderSubject(!metaDataEditable)}
                    {get(formProfile, 'editor.definition_short.enabled') && fieldRenders.renderDescription(!metaDataEditable)}
                    {get(formProfile, 'editor.definition_long.enabled') && fieldRenders.renderLongDescription(!metaDataEditable)}
                    {get(formProfile, 'editor.internal_note.enabled') && fieldRenders.renderInternalNote(!metaDataEditable)}
                    {get(formProfile, 'editor.location.enabled') && fieldRenders.renderLocation(!metaDataEditable)}
                    {fieldRenders.renderDate(!recurringRulesEditable, true, occurrenceOverlaps)}
                    {fieldRenders.renderDate(!recurringRulesEditable, false, null, this.oneHourAfterStartingDate())}
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

                    {get(formProfile, 'editor.occur_status.enabled') && fieldRenders.renderOccurStatus(!metaDataEditable)}
                    {get(formProfile, 'editor.links.enabled') && fieldRenders.renderLinks(!metaDataEditable)}
                    {get(formProfile, 'editor.files.enabled') && fieldRenders.renderFiles(!metaDataEditable)}

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
                            <a onClick={this.closeEventHistory.bind(this)} className="close"
                                style={{ opacity:'0.8' }}>
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
    onCancelEvent: PropTypes.func.isRequired,
    addEventToCurrentAgenda: PropTypes.func.isRequired,
    duplicateEvent: PropTypes.func.isRequired,
    isAllDay: PropTypes.bool,
    highlightedEvent: PropTypes.string,
    session: PropTypes.object,
    onUnlock: PropTypes.func,
    privileges: PropTypes.object,
    recurringRule: PropTypes.object,
    formProfile: PropTypes.object,
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    validate: ChainValidators([
        EndDateAfterStartDate,
        RequiredFieldsValidatorFactory(['dates.start', 'dates.end']),
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
    isAllDay: eventUtils.isEventAllDay(
        selector(state, 'dates.start'),
        selector(state, 'dates.end')
    ),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    maxRecurrentEvents: selectors.getMaxRecurrentEvents(state),
    recurringRule: selector(state, 'dates.recurring_rule'),
    formProfile: selectors.getEventsFormsProfile(state),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.saveEventWithConfirmation(event)),
    openEventDetails: (event) => dispatch(actions.events.ui.openEventDetails(event)),
    saveAndPublish: (event) => dispatch(actions.saveAndPublish(event)),
    publish: (event) => dispatch(actions.publishEvent(event)),
    unpublish: (event) => dispatch(actions.unpublishEvent(event)),
    spikeEvent: (event) => dispatch(actions.events.ui.openSpikeModal(event)),
    unspikeEvent: (event) => dispatch(actions.events.ui.openUnspikeModal(event)),
    addEventToCurrentAgenda: (event) => dispatch(actions.addEventToCurrentAgenda(event)),
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
    onCancelEvent: (event) => dispatch(actions.events.ui.openCancelModal(event)),
})

export const EventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
