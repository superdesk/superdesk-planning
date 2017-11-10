import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { isSubmitting } from 'redux-form'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { AssignmentForm, AuditInformation, UserAvatar, UnlockItem } from '../../components'
import { TOOLTIPS, WORKSPACE, ASSIGNMENTS } from '../../constants'
import { getCreator, assignmentUtils } from '../../utils'
import { get } from 'lodash'
import classNames from 'classnames'
import './style.scss'

export class EditAssignmentPanel extends React.Component {
    constructor(props) {
        super(props)

        this.handleSave = this.handleSave.bind(this)
        this.state = { openUnlockPopup: false }
    }

    onSubmit(assignment) {
        return this.props.save(assignment)
    }

    handleSave() {
        return this.refs.AssignmentForm.getWrappedInstance().submit()
    }

    toggleOpenUnlockPopup() {
        this.setState({ openUnlockPopup: !this.state.openUnlockPopup })
    }

    render() {
        const {
            assignment,
            readOnly,
            users,
            closePreview,
            submitting,
            currentWorkspace,
            session,
            privileges,
        } = this.props

        const creationDate = get(assignment, '_created')
        const updatedDate = get(assignment, '_updated')
        const author = getCreator(assignment, 'original_creator', users)
        const state = get(assignment, 'assigned_to.state')
        const versionCreator = getCreator(assignment, 'version_creator', users)
        const inAssignments = currentWorkspace === WORKSPACE.ASSIGNMENTS
        const canEdit = assignmentUtils.canEditAssignment(assignment, session, privileges)
        const lockedUser = get(assignment, 'lock_user') ? users.find((u) => u._id === assignment.lock_user) : null

        // If read-only or is lock restricted
        const showCloseIcon = readOnly || (!readOnly && !canEdit)

        return (
            <div className="EditAssignmentPanel">
                <header className="subnav">
                    <div className="EditAssignmentPanel__actions">
                        {showCloseIcon && <button className="navbtn navbtn--right"
                            onClick={closePreview.bind(this)}
                            data-sd-tooltip={TOOLTIPS.close} data-flow='down'>
                            <i className="icon-close-small"/>
                        </button>}
                    </div>
                    {!inAssignments && state === ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED &&
                        <button
                            className="btn btn--primary"
                            type="submit"
                            onClick={this.handleSave.bind(this)}
                            disabled={submitting}>
                            Fulfil Assignment
                        </button>
                    }
                </header>
                <div className="EditAssignmentPanel__body">
                    {!canEdit && lockedUser &&
                        <div className={classNames('dropdown',
                            'dropdown--dropright',
                            { open: this.state.openUnlockPopup })} >
                            <div className="lock-avatar">
                                <button
                                    type='button'
                                    onClick={this.toggleOpenUnlockPopup.bind(this)}
                                >
                                    <UserAvatar user={lockedUser} withLoggedInfo={true} />
                                </button>
                                {this.state.openUnlockPopup &&
                                    <UnlockItem
                                        displayText={assignment.lock_action === 'content_edit' ?
                                            'Content locked by' : 'Assignment locked by'}
                                        user={lockedUser}
                                        showUnlock={false}
                                        onCancel={this.toggleOpenUnlockPopup.bind(this)}
                                    />
                                }
                            </div>
                        </div>
                    }
                    <AuditInformation
                        createdBy={author}
                        updatedBy={versionCreator}
                        createdAt={creationDate}
                        updatedAt={updatedDate} />
                    <AssignmentForm
                        ref="AssignmentForm"
                        onSubmit={this.onSubmit.bind(this)}
                        inAssignments={inAssignments}
                    />
                </div>
            </div>
        )
    }
}

EditAssignmentPanel.propTypes = {
    assignment: PropTypes.object,
    readOnly: PropTypes.bool,
    closePreview: PropTypes.func.isRequired,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    submitting: PropTypes.bool.isRequired,
    save: PropTypes.func.isRequired,
    currentWorkspace: PropTypes.string,
    session: PropTypes.object,
    privileges: PropTypes.object,
}

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    readOnly: selectors.getReadOnlyAssignment(state),
    users: selectors.getUsers(state),
    submitting: isSubmitting('assignment')(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
})

const mapDispatchToProps = (dispatch) => (
    {
        closePreview: () => dispatch(actions.assignments.ui.closePreview()),
        save: (assignment) => dispatch(actions.assignments.ui.onAssignmentFormSave(assignment)),
    }
)

export const EditAssignmentPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(EditAssignmentPanel)
