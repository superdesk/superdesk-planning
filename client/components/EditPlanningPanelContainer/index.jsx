import React from 'react'
import PropTypes from 'prop-types'
import { reduxForm } from 'redux-form'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { PlanningForm } from '../index'
import { EventMetadata, PlanningHistoryContainer, AuditInformation } from '../../components'
import * as selectors from '../../selectors'
import { ITEM_STATE } from '../../constants'
import { get } from 'lodash'
import { OverlayTrigger } from 'react-bootstrap'
import { tooltips } from '../index'
import { UserAvatar, UnlockItem } from '../'
import classNames from 'classnames'
import './style.scss'
import { ItemActionsMenu } from '../index'
import { getCreator, getLockedUser } from '../../utils'

export class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            openUnlockPopup: false,
            previewHistory: false,
        }
    }

    handleSave() {
        this.refs.PlanningForm.getWrappedInstance().submit()
    }

    toggleOpenUnlockPopup() {
        this.setState({ openUnlockPopup: !this.state.openUnlockPopup })
    }

    getLockedUser(planning) {
        return get(planning, 'lock_user') && Array.isArray(this.props.users) ?
            this.props.users.find((u) => (u._id === planning.lock_user)) : null
    }

    viewPlanningHistory() {
        this.setState({ previewHistory: true })
    }

    closePlanningHistory() {
        this.setState({ previewHistory: false })
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
            planningManagementPrivilege,
        } = this.props

        const creationDate = get(planning, '_created')
        const updatedDate = get(planning, '_updated')

        const author = getCreator(planning, 'original_creator', users)
        const versionCreator = getCreator(planning, 'version_creator', users)

        const planningSpiked = planning ? get(planning, 'state', 'active') === ITEM_STATE.SPIKED : false
        const eventSpiked = event ? get(event, 'state', 'active') === ITEM_STATE.SPIKED : false
        const lockedUser = getLockedUser(planning, this.props.users)

        let itemActions = []

        itemActions = [
            {
                label: 'View Planning History',
                callback: this.viewPlanningHistory.bind(this),
            },
        ]

        // If the planning or event or agenda item is spiked,
        // or we don't hold a lock, enforce readOnly
        let forceReadOnly = readOnly
        if (!lockedInThisSession || eventSpiked || planningSpiked) {
            forceReadOnly = true
        }

        return (
            <div className="EditPlanningPanel">
                <header>
                    <div className={classNames('TimeAndAuthor',
                        'dropdown',
                        'dropdown--drop-right',
                        'pull-left',
                        { 'open': this.state.openUnlockPopup })}>
                        {(!lockedInThisSession && lockedUser)
                            && (
                            <div className="lock-avatar">
                                <button type='button' onClick={this.toggleOpenUnlockPopup.bind(this)}>
                                    <UserAvatar user={lockedUser} withLoggedInfo={true} />
                                </button>
                                {this.state.openUnlockPopup && <UnlockItem user={lockedUser}
                                    showUnlock={this.props.unlockPrivilege}
                                    onCancel={this.toggleOpenUnlockPopup.bind(this)}
                                    onUnlock={this.props.unlockItem.bind(this, planning)}/>}
                            </div>
                            )}
                        <AuditInformation
                            createdBy={author}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate} />
                    </div>
                    { !forceReadOnly && <div className="EditPlanningPanel__actions">
                            <button
                                className="btn"
                                type="reset"
                                onClick={closePlanningEditor.bind(this, planning)}
                                disabled={submitting}>Cancel</button>
                            {!planningSpiked && !eventSpiked &&
                                <button
                                    className="btn btn--primary"
                                    onClick={this.handleSave.bind(this)}
                                    type="submit"
                                    disabled={pristine || submitting}>Save</button>
                            }
                        </div>
                    }
                    { forceReadOnly && (
                        <div className="EditPlanningPanel__actions">
                            {(!eventSpiked && !planningSpiked && planningManagementPrivilege) &&
                            (<OverlayTrigger placement="bottom" overlay={tooltips.editTooltip}>
                                <button className="EditPlanningPanel__actions__edit" onClick={openPlanningEditor.bind(this, get(planning, '_id'))}>
                                    <i className="icon-pencil"/>
                                </button>
                            </OverlayTrigger>)}
                            <OverlayTrigger placement="bottom" overlay={tooltips.closeTooltip}>
                                <button className="EditPlanningPanel__actions__edit"
                                    onClick={closePlanningEditor.bind(null, null)}>
                                    <i className="icon-close-small"/>
                                </button>
                            </OverlayTrigger>
                        </div>)
                    }
                </header>

                {!this.state.previewHistory &&
                    <div className="EditPlanningPanel__body">
                        <ItemActionsMenu actions={itemActions} />

                        {planningSpiked &&
                            <span className="PlanningSpiked label label--alert">planning spiked</span>
                        }
                        {eventSpiked &&
                            <span className="EventSpiked label label--alert">event spiked</span>
                        }
                        {event &&
                            <div>
                                <h3>Associated event</h3>
                                <EventMetadata event={event}/>
                            </div>
                        }
                        <h3>Planning</h3>
                        {(!creationDate || !author) &&
                            <span>Create a new planning</span>
                        }
                        <PlanningForm ref="PlanningForm" readOnly={forceReadOnly}/>
                    </div>
                }
                {this.state.previewHistory &&
                    <div className="history-preview">
                        <div className="close-history">
                            <a onClick={this.closePlanningHistory.bind(this)} className="close">
                                <i className="icon-close-small" />
                            </a>
                        </div>
                        <PlanningHistoryContainer currentPlanningId={planning._id} />
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
    unlockPrivilege: PropTypes.bool,
    planningManagementPrivilege: PropTypes.bool,
    unlockItem: PropTypes.func,
    lockedInThisSession: PropTypes.bool,
}

const mapStateToProps = (state) => ({
    planning: selectors.getCurrentPlanning(state),
    event: selectors.getCurrentPlanningEvent(state),
    users: selectors.getUsers(state),
    readOnly: selectors.getPlanningItemReadOnlyState(state),
    unlockPrivilege: selectors.getPrivileges(state).planning_unlock ? true : false,
    planningManagementPrivilege: selectors.getPrivileges(state).planning_planning_management ? true : false,
    lockedInThisSession: selectors.isCurrentPlanningLockedInThisSession(state),
})

const mapDispatchToProps = (dispatch) => ({
    closePlanningEditor: (planning) => dispatch(actions.planning.ui.closeEditor(planning)),
    openPlanningEditor: (planning) => (dispatch(actions.planning.ui.openEditor(planning))),
    unlockItem: (planning) => (dispatch(actions.planning.ui.unlockAndOpenEditor(planning))),
})

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(reduxForm({ form: 'planning' })(EditPlanningPanel))
