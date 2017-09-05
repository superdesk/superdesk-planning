import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { reduxForm, formValueSelector, getFormValues } from 'redux-form'
import { get } from 'lodash'
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
import PropTypes from 'prop-types'
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

import {
    RelatedPlannings,
    EventHistoryContainer,
    AuditInformation,
    ItemActionsMenu,
    UnlockItem,
    UserAvatar,
    StateLabel,
    tooltips,
    EventScheduleForm,
    EventScheduleSummary,
    ToggleBox,
} from '../index'

/**
* Form for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
export class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            previewHistory: false,
            openUnlockPopup: false,
        }
    }

    componentDidMount() {
        this.props.reset()
    }

    viewEventHistory() {
        this.setState({ previewHistory: true })
    }

    closeEventHistory() {
        this.setState({ previewHistory: false })
    }

    handleSaveAndPublish(event) {
        this.props.saveAndPublish(event)
    }

    toggleOpenUnlockPopup() {
        this.setState({ openUnlockPopup: !this.state.openUnlockPopup })
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
            onRescheduleEvent,
            addEventToCurrentAgenda,
            publish,
            unpublish,
            duplicateEvent,
            updateTime,
            convertToRecurringEvent,
            highlightedEvent,
            session,
            privileges,
            onUnlock,
            formProfile,
            onMinimize,
            currentSchedule,
        } = this.props

        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK]

        const eventSpiked = isItemSpiked(initialValues)
        const creationDate = get(initialValues, '_created')
        const updatedDate = get(initialValues, '_updated')
        const existingEvent = !!get(initialValues, '_id')
        const forcedReadOnly = existingEvent && (readOnly || eventSpiked ||
            !isItemLockedInThisSession(initialValues, session))
        const author = get(initialValues, 'original_creator') && users ?
            users.find((u) => (u._id === initialValues.original_creator)) : get(initialValues, 'ingest_provider')
        const versionCreator = get(initialValues, 'version_creator') && users ? users.find((u) => (u._id === initialValues.version_creator)) : null
        const lockedUser = getLockedUser(initialValues, users)
        const lockRestricted =  isItemLockRestricted(initialValues, session)
        const isPublic = isItemPublic(initialValues)
        const canPublish = eventUtils.canPublishEvent(initialValues, session, privileges)
        const canUnpublish = eventUtils.canUnpublishEvent(initialValues, privileges)
        const canEditEvent = eventUtils.canEditEvent(initialValues, session, privileges)

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
            ]

            // Don't show these actions if editing
            if (forcedReadOnly && !lockRestricted) {
                actions.push(
                    {
                        ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                        callback: onCancelEvent.bind(null, initialValues),
                    },
                    {
                        ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
                        callback: updateTime.bind(null, initialValues),
                    },
                    {
                        ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
                        callback: onRescheduleEvent.bind(null, initialValues),
                    },
                    {
                        ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
                        callback: convertToRecurringEvent.bind(null, initialValues),
                    })
            }

            actions.push(
                GENERIC_ITEM_ACTIONS.DIVIDER,
                {
                    ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                    callback: addEventToCurrentAgenda.bind(null, initialValues),
                })

            itemActions = eventUtils.getEventItemActions(initialValues, session, privileges, actions)
        }

        return (
            <form onSubmit={handleSubmit} className="EventForm Form">
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
                            <button title="Minimize" className="navbtn navbtn--right" onClick={onMinimize.bind(this)}>
                                <i className="big-icon--minimize" />
                            </button>
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

                    {!this.state.previewHistory &&
                        <ItemActionsMenu
                            actions={itemActions}
                            buttonClass='navbtn navbtn--right'
                        />
                    }
                </div>
                {!this.state.previewHistory &&
                    <div className="EventForm__form">
                    <div>
                        {lockRestricted && (
                            <div className={classNames('dropdown',
                                'dropdown--dropright',
                                { open: this.state.openUnlockPopup })} >
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
                    {error && <div className="error-block">{error}</div>}

                    {existingEvent &&
                        <EventScheduleSummary schedule={currentSchedule}/>
                    }

                    {get(formProfile, 'editor.slugline.enabled') && fieldRenders.renderSlugline(forcedReadOnly)}
                    {get(formProfile, 'editor.name.enabled') && fieldRenders.renderName(forcedReadOnly)}
                    {get(formProfile, 'editor.definition_short.enabled') && fieldRenders.renderDescription(forcedReadOnly)}
                    {get(formProfile, 'editor.occur_status.enabled') && fieldRenders.renderOccurStatus(forcedReadOnly)}

                    {!existingEvent &&
                        <EventScheduleForm
                            readOnly={false}
                            currentSchedule={currentSchedule}
                            initialSchedule={initialValues.dates}
                            change={this.props.change}
                            pristine={pristine}
                        />
                    }

                    {get(formProfile, 'editor.location.enabled') && fieldRenders.renderLocation(forcedReadOnly)}

                    <ToggleBox title="Details" isOpen={false}>
                        {get(formProfile, 'editor.calendars.enabled') && fieldRenders.renderCalender(forcedReadOnly)}
                        {get(formProfile, 'editor.anpa_category.enabled') && fieldRenders.renderCategory(forcedReadOnly)}
                        {get(formProfile, 'editor.subject.enabled') && fieldRenders.renderSubject(forcedReadOnly)}
                        {get(formProfile, 'editor.definition_long.enabled') && fieldRenders.renderLongDescription(forcedReadOnly)}
                        {get(formProfile, 'editor.internal_note.enabled') && fieldRenders.renderInternalNote(forcedReadOnly)}
                    </ToggleBox>

                    {get(formProfile, 'editor.files.enabled') &&
                        <ToggleBox title="Attached Files" isOpen={false}>
                            {fieldRenders.renderFiles(forcedReadOnly)}
                        </ToggleBox>
                    }

                    {get(formProfile, 'editor.links.enabled') &&
                        <ToggleBox title="External Links" isOpen={false}>
                            {fieldRenders.renderLinks(forcedReadOnly)}
                        </ToggleBox>
                    }

                    {initialValues && initialValues._plannings &&
                        initialValues._plannings.length > 0 &&
                        <ToggleBox title="Related Planning Items" isOpen={false}>
                            <RelatedPlannings plannings={initialValues._plannings}
                                openPlanningItem={true}/>
                        </ToggleBox>
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
    onBackClick: PropTypes.func,
    error: PropTypes.object,
    handleSubmit: PropTypes.func,
    change: PropTypes.func,
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
    onRescheduleEvent: PropTypes.func.isRequired,
    addEventToCurrentAgenda: PropTypes.func.isRequired,
    duplicateEvent: PropTypes.func.isRequired,
    updateTime: PropTypes.func.isRequired,
    convertToRecurringEvent: PropTypes.func.isRequired,
    highlightedEvent: PropTypes.string,
    session: PropTypes.object,
    onUnlock: PropTypes.func,
    privileges: PropTypes.object,
    formProfile: PropTypes.object,
    onMinimize: PropTypes.func,
    currentSchedule: PropTypes.object,
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
    users: selectors.getUsers(state),
    readOnly: selectors.getEventReadOnlyState(state),
    formValues: getFormValues('addEvent')(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    maxRecurrentEvents: selectors.getMaxRecurrentEvents(state),
    formProfile: selectors.getEventsFormsProfile(state),
    currentSchedule: selector(state, 'dates'),
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
    updateTime: (event) => dispatch(actions.events.ui.updateTime(event)),
    convertToRecurringEvent: (event) => dispatch(actions.events.ui.convertToRecurringEvent(event)),
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
    onCancelEvent: (event) => dispatch(actions.events.ui.openCancelModal(event)),
    onMinimize: () => dispatch(actions.events.ui.minimizeEventDetails()),
    onRescheduleEvent: (event) => dispatch(actions.events.ui.openRescheduleModal(event)),
})

export const EventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(FormComponent)
