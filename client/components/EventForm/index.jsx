import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {reduxForm, formValueSelector, getFormValues} from 'redux-form';
import {get} from 'lodash';
import {
    ChainValidators,
    EndDateAfterStartDate,
    RequiredFieldsValidatorFactory,
    MaxLengthValidatorFactory,
    UntilDateValidator,
    EventMaxEndRepeatCount} from '../../validators';
import './style.scss';
import {PRIVILEGES, EVENTS, GENERIC_ITEM_ACTIONS, TOOLTIPS, MODALS, FORM_NAMES} from '../../constants';
import * as selectors from '../../selectors';
import PropTypes from 'prop-types';
import {
    eventUtils,
    getLockedUser,
    isItemLockedInThisSession,
    isItemSpiked,
    isItemPublic,
} from '../../utils';
import {fieldRenders} from './fieldRenders.jsx';

import {
    RelatedPlannings,
    EventHistoryContainer,
    AuditInformation,
    ItemActionsMenu,
    StateLabel,
    EventScheduleForm,
    EventScheduleSummary,
    ToggleBox,
    LockContainer,
    Autosave,
} from '../index';

/**
* Form for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
export class Component extends React.Component {
    constructor(props) {
        super(props);
        this.state = {previewHistory: false};

        this.cancelForm = this.cancelForm.bind(this);
        this.saveAndClose = this.saveAndClose.bind(this);
    }

    viewEventHistory() {
        this.setState({previewHistory: true});
    }

    closeEventHistory() {
        this.setState({previewHistory: false});
    }

    handleSaveAndPublish(event) {
        this.props.saveAndPublish(event, this.props.pristine);
    }

    saveAndClose() {
        const {handleSubmit, valid, onBackClick} = this.props;
        const rtn = handleSubmit();

        if (valid) {
            rtn.then(onBackClick);
        }
    }

    cancelForm() {
        if (!this.props.pristine) {
            return this.props.openCancelModal(this.saveAndClose, this.props.onBackClick);
        }

        return this.props.onBackClick();
    }

    getEventActions(readOnly, lockRestricted, session, privileges) {
        const {
            initialValues,
            spikeEvent,
            unspikeEvent,
            duplicateEvent,
            onCancelEvent,
            updateTime,
            onRescheduleEvent,
            convertToRecurringEvent,
            addEventToCurrentAgenda,
            onPostponeEvent,
            lockedItems,
        } = this.props;

        if (!get(initialValues, '_id')) {
            return [];
        }

        const actions = [
            {
                ...GENERIC_ITEM_ACTIONS.SPIKE,
                callback: spikeEvent.bind(null, initialValues),
            },
            {
                ...EVENTS.ITEM_ACTIONS.UNSPIKE,
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
        ];

        // Don't show these actions if editing
        if (readOnly && !lockRestricted) {
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
                },
                {
                    ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
                    callback: onPostponeEvent.bind(null, initialValues),
                }
            );
        }

        actions.push(
            GENERIC_ITEM_ACTIONS.DIVIDER,
            {
                ...EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                callback: addEventToCurrentAgenda.bind(null, initialValues),
            }
        );

        return eventUtils.getEventItemActions(
            initialValues,
            session,
            privileges,
            actions,
            lockedItems
        );
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
            publish,
            unpublish,
            highlightedEvent,
            session,
            privileges,
            onUnlock,
            formProfile,
            onMinimize,
            currentSchedule,
            lockedItems,
            existingLocationSearchResults,
        } = this.props;

        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK];

        const eventSpiked = isItemSpiked(initialValues);
        const creationDate = get(initialValues, '_created');
        const updatedDate = get(initialValues, '_updated');
        const existingEvent = !!get(initialValues, '_id');
        const forcedReadOnly = existingEvent && (readOnly || eventSpiked ||
            !isItemLockedInThisSession(initialValues, session));
        const author = get(initialValues, 'original_creator') && users ?
            users.find((u) => (u._id === initialValues.original_creator)) : get(initialValues, 'ingest_provider');
        const versionCreator = get(initialValues, 'version_creator') && users ?
            users.find((u) => (u._id === initialValues.version_creator)) : null;
        const lockedUser = getLockedUser(initialValues, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(initialValues, session, lockedItems);
        const isPublic = isItemPublic(initialValues);
        const canPublish = eventUtils.canPublishEvent(initialValues, session, privileges, lockedItems);
        const canUnpublish = eventUtils.canUnpublishEvent(initialValues, session, privileges, lockedItems);
        const canEditEvent = eventUtils.canEditEvent(initialValues, session, privileges, lockedItems);
        const canUpdateEvent = eventUtils.canUpdateEvent(initialValues, session, privileges, lockedItems);

        const itemActions = this.getEventActions(
            forcedReadOnly,
            lockRestricted,
            session,
            privileges
        );

        return (
            <form onSubmit={handleSubmit} className="EventForm Form">
                <Autosave formName={FORM_NAMES.EventForm}/>
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
                                onClick={this.cancelForm}>
                                Close
                            </button>
                            {!isPublic && canEditEvent &&
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={pristine || submitting}>
                                    Save
                                </button>
                            }
                            {!isPublic && canPublish &&
                                <button
                                    onClick={pristine ?
                                        handleSubmit(publish.bind(null, initialValues)) :
                                        handleSubmit(this.handleSaveAndPublish.bind(this))
                                    }
                                    type="button"
                                    className="btn btn--success"
                                    disabled={submitting}>
                                    {(existingEvent && pristine) ? 'Publish' : 'Save and publish'}
                                </button>
                            }
                            {canUpdateEvent &&
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
                                    <button
                                        type="button"
                                        onClick={openEventDetails.bind(null, initialValues)}
                                        className="navbtn navbtn--right tooltipVisibleElement"
                                        data-sd-tooltip={TOOLTIPS.edit} data-flow="down">
                                        <i className="icon-pencil"/>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {!this.state.previewHistory &&
                        <ItemActionsMenu
                            actions={itemActions}
                            buttonClass="navbtn navbtn--right"
                        />
                    }
                </div>
                {!this.state.previewHistory &&
                    <div className="EventForm__form">
                        <div>
                            {lockRestricted &&
                            <LockContainer
                                lockedUser={lockedUser}
                                users={users}
                                showUnlock={unlockPrivilege}
                                withLoggedInfo={true}
                                onUnlock={onUnlock.bind(null, initialValues)}
                            />
                            }
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
                        {get(formProfile, 'editor.slugline.enabled') && fieldRenders.renderSlugline(
                            {
                                readOnly: forcedReadOnly,
                                fieldSchema: formProfile.schema.slugline,
                            }
                        )}
                        {get(formProfile, 'editor.name.enabled') && fieldRenders.renderName(
                            {
                                readOnly: forcedReadOnly,
                                fieldSchema: get(formProfile, 'schema.name'),
                            }
                        )}
                        {get(formProfile, 'editor.definition_short.enabled') && fieldRenders.renderDescription(
                            {
                                readOnly: forcedReadOnly,
                                fieldSchema: get(formProfile, 'schema.definition_short'),
                            }
                        )}
                        {get(formProfile, 'editor.occur_status.enabled') && fieldRenders.renderOccurStatus(
                            {
                                readOnly: forcedReadOnly,
                                fieldSchema: get(formProfile, 'schema.occur_status'),
                            }
                        )}
                        {!existingEvent &&
                        <EventScheduleForm
                            readOnly={false}
                            currentSchedule={currentSchedule}
                            initialSchedule={initialValues.dates}
                            change={this.props.change}
                            pristine={pristine}
                        />
                        }
                        {get(formProfile, 'editor.location.enabled') && fieldRenders.renderLocation(
                            {
                                readOnly: forcedReadOnly,
                                fieldSchema: get(formProfile, 'schema.location'),
                                existingLocationSearchResults: existingLocationSearchResults,
                            }
                        )}
                        {get(formProfile, 'editor.contacts.enabled') && fieldRenders.renderContact(
                            {
                                readOnly: forcedReadOnly,
                                fieldSchema: get(formProfile, 'schema.contacts'),
                            }
                        )}
                        <ToggleBox title="Details" isOpen={false}>
                            {get(formProfile, 'editor.calendars.enabled') && fieldRenders.renderCalender(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.calendars'),
                                }
                            )}
                            {get(formProfile, 'editor.anpa_category.enabled') && fieldRenders.renderCategory(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.anpa_category'),
                                }
                            )}
                            {get(formProfile, 'editor.subject.enabled') && fieldRenders.renderSubject(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.subject'),
                                }
                            )}
                            {get(formProfile, 'editor.definition_long.enabled') && fieldRenders.renderLongDescription(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.definition_long'),
                                }
                            )}
                            {get(formProfile, 'editor.internal_note.enabled') && fieldRenders.renderInternalNote(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.internal_note'),
                                }
                            )}
                        </ToggleBox>
                        {get(formProfile, 'editor.files.enabled') &&
                        <ToggleBox title="Attached Files" isOpen={false}>
                            {fieldRenders.renderFiles(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.files'),
                                }
                            )}
                        </ToggleBox>
                        }
                        {get(formProfile, 'editor.links.enabled') &&
                        <ToggleBox title="External Links" isOpen={false}>
                            {fieldRenders.renderLinks(
                                {
                                    readOnly: forcedReadOnly,
                                    fieldSchema: get(formProfile, 'schema.links'),
                                }
                            )}
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
        );
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
    onPostponeEvent: PropTypes.func.isRequired,
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
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func,
    valid: PropTypes.bool,
    existingLocationSearchResults: PropTypes.array,
};

// Decorate the form component
export const FormComponent = reduxForm({
    form: FORM_NAMES.EventForm, // a unique name for this form
    validate: ChainValidators([
        EndDateAfterStartDate,
        RequiredFieldsValidatorFactory(['dates.start', 'dates.end']),
        MaxLengthValidatorFactory(),
        UntilDateValidator,
        EventMaxEndRepeatCount,
    ]),
    enableReinitialize: true, // the form will reinitialize every time the initialValues prop changes
})(Component);


const selector = formValueSelector(FORM_NAMES.EventForm); // same as form name
const mapStateToProps = (state) => ({
    highlightedEvent: selectors.getHighlightedEvent(state),
    users: selectors.getUsers(state),
    readOnly: selectors.getEventReadOnlyState(state),
    formValues: getFormValues(FORM_NAMES.EventForm)(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    maxRecurrentEvents: selectors.getMaxRecurrentEvents(state),
    formProfile: selectors.getEventsFormsProfile(state),
    currentSchedule: selector(state, 'dates'),
    existingLocationSearchResults: selector(state, '_locationSearchResults'),
    lockedItems: selectors.getLockedItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (event) => dispatch(actions.events.ui.saveWithConfirmation(event, true, false)),
    openEventDetails: (event) => dispatch(actions.events.ui.openEventDetails(event)),
    saveAndPublish: (event, pristine) => dispatch(actions.events.ui.saveWithConfirmation(event, !pristine, true)),
    publish: (event) => dispatch(actions.events.ui.saveWithConfirmation(event, false, true)),
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
    onPostponeEvent: (event) => dispatch(actions.events.ui.openPostponeModal(event)),
    openCancelModal: (actionCallback, ignoreCallback) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            title: 'Save changes?',
            body: 'There are some unsaved changes, do you want to save it now?',
            okText: 'Save',
            showIgnore: true,
            action: actionCallback,
            ignore: ignoreCallback,
        },
    })),
});

export const EventForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true})(FormComponent);
