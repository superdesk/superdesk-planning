import React from 'react'
import PropTypes from 'prop-types'
import { formValueSelector, isValid, isSubmitting, isPristine } from 'redux-form'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { PlanningForm } from '../index'
import {
    PlanningHistoryContainer,
    AuditInformation,
    StateLabel,
} from '../../components'
import * as selectors from '../../selectors'
import { get } from 'lodash'
import { UserAvatar, UnlockItem } from '../'
import classNames from 'classnames'
import './style.scss'
import { ItemActionsMenu } from '../index'
import {
    getCreator,
    getLockedUser,
    planningUtils,
    isItemSpiked,
    isItemPublic,
} from '../../utils'
import {
    GENERIC_ITEM_ACTIONS,
    PRIVILEGES,
    EVENTS,
    TOOLTIPS,
    PLANNING,
    WORKSPACE,
    MODALS,
} from '../../constants'

export class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            openUnlockPopup: false,
            previewHistory: false,

            // Local state for the type of save to do
            saveActions: {
                save: true,
                publish: false,
                unpublish: false,
            },
        }

        this.handleSave = this.handleSave.bind(this)
        this.saveAndClose = this.saveAndClose.bind(this)
        this.cancelForm = this.cancelForm.bind(this)
    }

    onSubmit(planning) {
        return this.props.onPlanningFormSave(planning, this.state.saveActions)
    }

    handleSave() {
        // Runs Validation on the form, then runs the above `onSubmit` function
        return this.refs.PlanningForm.getWrappedInstance().submit()
        .then(() => {
            // Restore the saveActions to save only
            this.setState({
                saveActions: {
                    save: true,
                    publish: false,
                    unpublish: false,
                },
            })
        })
    }

    handleSaveAndPublish() {
        // If the form data has not changed, `Publish Only` otherwise `Save & Publish`
        return this.setState({
            saveActions: {
                save: !(this.props.pristine || this.props.readOnly),
                publish: true,
                unpublish: false,
            },
        }, this.handleSave)
    }

    handleSaveAndUnpublish() {
        // If the form data has not changed, `Unpublish Only` otherwise `Save & Unpublish`
        return this.setState({
            saveActions: {
                save: !(this.props.pristine || this.props.readOnly),
                publish: false,
                unpublish: true,
            },
        }, this.handleSave)
    }

    toggleOpenUnlockPopup() {
        this.setState({ openUnlockPopup: !this.state.openUnlockPopup })
    }

    viewPlanningHistory() {
        this.setState({ previewHistory: true })
    }

    closePlanningHistory() {
        this.setState({ previewHistory: false })
    }

    saveAndClose() {
        const { valid, closePlanningEditor, planning } = this.props
        const rtn = this.handleSave()
        if (valid) {
            rtn.then(closePlanningEditor.bind(this, planning))
        }
    }

    cancelForm() {
        const {
            planning,
            pristine,
            openCancelModal,
            closePlanningEditor,
            currentWorkspace,
        } = this.props

        if (!pristine && currentWorkspace === WORKSPACE.PLANNING) {
            openCancelModal(this.saveAndClose, closePlanningEditor.bind(this, planning))
        } else {
            closePlanningEditor(planning)
        }
    }

    getPlanningActions() {
        const {
            planning,
            event,
            session,
            privileges,
            lockedItems,
            currentWorkspace,
            onSpike,
            onUnspike,
            onDuplicate,
            onCancelPlanning,
            onCancelAllCoverage,
            onCancelEvent,
            onUpdateEventTime,
            onRescheduleEvent,
            onConvertToRecurringEvent,
            onPostponeEvent,
        } = this.props

        if (currentWorkspace !== WORKSPACE.PLANNING || !get(planning, '_id')) {
            return []
        }

        const actions = [{
                ...GENERIC_ITEM_ACTIONS.SPIKE,
                callback: onSpike.bind(null, planning),
            },
            {
                ...GENERIC_ITEM_ACTIONS.UNSPIKE,
                callback: onUnspike.bind(null, planning),
            },
            {
                ...GENERIC_ITEM_ACTIONS.HISTORY,
                callback: this.viewPlanningHistory.bind(this),
            },
            {
                ...GENERIC_ITEM_ACTIONS.DUPLICATE,
                callback: onDuplicate.bind(null, planning),
            },
            {
                ...PLANNING.ITEM_ACTIONS.CANCEL_PLANNING,
                callback: onCancelPlanning.bind(null, planning),
            },
            {
                ...PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE,
                callback: onCancelAllCoverage.bind(null, planning),
            },
            GENERIC_ITEM_ACTIONS.DIVIDER,
            {
                ...EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                callback: onCancelEvent.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.UPDATE_TIME,
                callback: onUpdateEventTime.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
                callback: onRescheduleEvent.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
                callback: onConvertToRecurringEvent.bind(null, event),
            },
            {
                ...EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
                callback: onPostponeEvent.bind(null, event),
            },
        ]

        return planningUtils.getPlanningItemActions(
            planning,
            event,
            session,
            privileges,
            actions,
            lockedItems
        )
    }

    /*eslint-disable complexity*/
    render() {
        const {
            closePlanningEditor,
            openPlanningEditor,
            planning,
            event,
            pristine,
            submitting,
            readOnly,
            lockedInThisSession,
            users,
            notForPublication,
            session,
            privileges,
            lockedItems,
            currentWorkspace,
        } = this.props

        const existingPlan = !!get(planning, '_id')

        const creationDate = get(planning, '_created')
        const updatedDate = get(planning, '_updated')

        const author = getCreator(planning, 'original_creator', users)
        const versionCreator = getCreator(planning, 'version_creator', users)

        const lockedUser = getLockedUser(planning, lockedItems, this.props.users)
        const planningSpiked = isItemSpiked(planning)
        const eventSpiked = isItemSpiked(event)

        const inPlanning = currentWorkspace === WORKSPACE.PLANNING

        const unlockPrivilege = !!privileges[PRIVILEGES.PLANNING_UNLOCK]

        const itemActions = this.getPlanningActions()

        // If the planning or event or agenda item is spiked,
        // or we don't hold a lock, enforce readOnly
        const forceReadOnly = existingPlan && (
            readOnly ||
            eventSpiked ||
            planningSpiked ||
            !lockedInThisSession
        )

        const showSave = planningUtils.canSavePlanning(planning, event, privileges)
        const showPublish = planningUtils.canPublishPlanning(planning, event, privileges, session, lockedItems)
        const showUnpublish = planningUtils.canUnpublishPlanning(planning, event, privileges, session, lockedItems)
        const isPublic = isItemPublic(planning)
        const showEdit = inPlanning && planningUtils.canEditPlanning(
            planning,
            event,
            privileges,
            lockedInThisSession,
            lockedUser
        )

        return (
            <div className="EditPlanningPanel">
                <header className="subnav">
                    <div className={classNames('dropdown',
                        'dropdown--drop-right',
                        'pull-left',
                        { open: this.state.openUnlockPopup })}>
                        {((!lockedInThisSession || !inPlanning) && lockedUser && forceReadOnly)
                            && (
                            <div className="lock-avatar">
                                <button type='button' onClick={this.toggleOpenUnlockPopup.bind(this)}>
                                    <UserAvatar user={lockedUser} withLoggedInfo={true} />
                                </button>
                                {this.state.openUnlockPopup && <UnlockItem user={lockedUser}
                                    showUnlock={unlockPrivilege}
                                    onCancel={this.toggleOpenUnlockPopup.bind(this)}
                                    onUnlock={this.props.unlockItem.bind(this, planning)}/>}
                            </div>
                            )}
                    </div>
                    {!this.state.previewHistory &&
                        <div className="EditPlanningPanel__actions">
                            {!forceReadOnly &&
                                <button
                                    className="btn"
                                    type="reset"
                                    onClick={this.cancelForm}
                                    disabled={submitting}>
                                    Close
                                </button>
                            }

                            {!isPublic && !forceReadOnly && showSave &&
                                <button
                                    className="btn btn--primary"
                                    onClick={this.handleSave.bind(this)}
                                    type="submit"
                                    disabled={pristine || submitting}>
                                    Save
                                </button>
                            }

                            {!isPublic && showPublish &&
                                <button
                                    onClick={this.handleSaveAndPublish.bind(this)}
                                    type="button"
                                    className="btn btn--success"
                                    disabled={!existingPlan || submitting || notForPublication}>
                                    {pristine ? 'Publish' : 'Save and publish'}
                                </button>
                            }

                            {!forceReadOnly && showUnpublish &&
                                <button
                                    onClick={this.handleSaveAndPublish.bind(this)}
                                    type="button"
                                    className="btn btn--primary"
                                    disabled={pristine || submitting || notForPublication}>
                                    Save and update
                                </button>
                            }

                            {inPlanning && showUnpublish &&
                                <button
                                    onClick={this.handleSaveAndUnpublish.bind(this)}
                                    type="button"
                                    className="btn btn--hollow"
                                    disabled={submitting || notForPublication}>
                                    Unpublish
                                </button>
                            }

                            {forceReadOnly && showEdit &&
                                <button
                                    className={'EditPlanningPanel__actions__edit navbtn navbtn--right'
                                        + ' tooltipVisibleElement'}
                                    onClick={openPlanningEditor.bind(this, get(planning, '_id'))}
                                    data-sd-tooltip={TOOLTIPS.edit} data-flow='down'>
                                    <i className="icon-pencil"/>
                                </button>
                            }

                            {forceReadOnly &&
                                <button
                                    className={'EditPlanningPanel__actions__edit navbtn navbtn--right'
                                        + ' tooltipVisibleElement'}
                                    onClick={closePlanningEditor.bind(null, null)}
                                    data-sd-tooltip={TOOLTIPS.close} data-flow='down'>
                                    <i className="icon-close-small"/>
                                </button>
                            }
                        </div>
                    }
                </header>

                {!this.state.previewHistory &&
                    <div className="EditPlanningPanel__body">
                        <div>
                            <AuditInformation
                                createdBy={author}
                                updatedBy={versionCreator}
                                createdAt={creationDate}
                                updatedAt={updatedDate} />
                            {itemActions.length > 0 &&
                                <ItemActionsMenu actions={itemActions} />
                            }
                        </div>
                        <StateLabel item={planning} verbose={true}/>
                        <div className="state">
                            {planningSpiked &&
                                <span className="PlanningSpiked label label--alert">planning spiked</span>
                            }
                            {eventSpiked &&
                                <span className="EventSpiked label label--alert">event spiked</span>
                            }
                        </div>
                        <PlanningForm
                            ref="PlanningForm"
                            onSubmit={this.onSubmit.bind(this)}
                            event={event}
                            readOnly={forceReadOnly}
                            initialValues={planning}
                        />
                    </div>
                }
                {this.state.previewHistory &&
                    <div className="history-preview">
                        <div className="close-history">
                            <a onClick={this.closePlanningHistory.bind(this)} className="close">
                                <i className="icon-close-small" />
                            </a>
                        </div>
                        <PlanningHistoryContainer
                            currentPlanningId={planning._id}
                            closePlanningHistory={this.closePlanningHistory.bind(this)}
                        />
                    </div>
                }
            </div>
        )
    }
    /*eslint-enable*/
}

EditPlanningPanel.propTypes = {
    closePlanningEditor: PropTypes.func.isRequired,
    openPlanningEditor: PropTypes.func.isRequired,
    planning: PropTypes.object,
    event: PropTypes.object,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    readOnly: PropTypes.bool,
    unlockItem: PropTypes.func,
    lockedInThisSession: PropTypes.bool,
    notForPublication: PropTypes.bool,

    privileges: PropTypes.object,
    session: PropTypes.object,

    onDuplicate: PropTypes.func,
    onSpike: PropTypes.func,
    onUnspike: PropTypes.func,
    onCancelEvent: PropTypes.func,
    onUpdateEventTime: PropTypes.func,
    onRescheduleEvent: PropTypes.func,
    onConvertToRecurringEvent: PropTypes.func,
    lockedItems: PropTypes.object,
    onPostponeEvent: PropTypes.func,
    valid: PropTypes.bool,
    onCancelPlanning: PropTypes.func,
    onCancelAllCoverage: PropTypes.func,
    openCancelModal: PropTypes.func.isRequired,
    currentWorkspace: PropTypes.string,
    onPlanningFormSave: PropTypes.func,
}

const selector = formValueSelector('planning') // Selector for the Planning form
const mapStateToProps = (state) => ({
    planning: selectors.getCurrentPlanning(state),
    event: selectors.getCurrentPlanningEvent(state),
    users: selectors.getUsers(state),
    readOnly: selectors.getPlanningItemReadOnlyState(state),
    lockedInThisSession: selectors.isCurrentPlanningLockedInThisSession(state),
    notForPublication: selector(state, 'flags.marked_for_not_publication'),
    privileges: selectors.getPrivileges(state),
    session: selectors.getSessionDetails(state),
    lockedItems: selectors.getLockedItems(state),
    pristine: isPristine('planning')(state),
    valid: isValid('planning')(state),
    submitting: isSubmitting('planning')(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
})

const mapDispatchToProps = (dispatch) => ({
    closePlanningEditor: (planning) => dispatch(actions.planning.ui.closeEditor(planning)),
    openPlanningEditor: (planning) => (dispatch(actions.planning.ui.openEditor({ _id: planning }))),
    unlockItem: (planning) => (dispatch(actions.planning.ui.unlockAndOpenEditor(planning))),

    onDuplicate: (planning) => (dispatch(actions.planning.ui.duplicate(planning))),
    onSpike: (planning) => (dispatch(actions.planning.ui.spike(planning))),
    onUnspike: (planning) => (dispatch(actions.planning.ui.unspike(planning))),
    onCancelEvent: (event) => dispatch(actions.events.ui.openCancelModal(event)),
    onUpdateEventTime: (event) => dispatch(actions.events.ui.updateTime(event)),
    onRescheduleEvent: (event) => dispatch(actions.events.ui.openRescheduleModal(event)),
    onConvertToRecurringEvent: (event) => dispatch(actions.events.ui.convertToRecurringEvent(event)),
    onPostponeEvent: (event) => dispatch(actions.events.ui.openPostponeModal(event)),
    onCancelPlanning: (planning) => dispatch(actions.planning.ui.openCancelPlanningModal(planning)),
    onCancelAllCoverage: (planning) => dispatch(actions.planning.ui.openCancelAllCoverageModal(planning)),
    openCancelModal: (actionCallBack, ignoreCallBack) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            title: 'Save changes?',
            body: 'There are some unsaved changes, do you want to save it now?',
            okText: 'Save',
            showIgnore: true,
            action: actionCallBack,
            ignore: ignoreCallBack,
        },
    })),

    onPlanningFormSave: (planning, saveActions) =>
        dispatch(actions.planning.ui.onPlanningFormSave(planning, saveActions)),
})

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(EditPlanningPanel)
