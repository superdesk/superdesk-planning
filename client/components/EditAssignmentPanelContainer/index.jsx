import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { isPristine, isValid, isSubmitting } from 'redux-form'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { AssignmentForm, AuditInformation, ItemActionsMenu } from '../../components'
import { TOOLTIPS, WORKSPACE, ASSIGNMENTS, MODALS } from '../../constants'
import { getCreator, assignmentUtils } from '../../utils'
import { get } from 'lodash'
import './style.scss'

export class EditAssignmentPanel extends React.Component {
    constructor(props) {
        super(props)

        this.handleSave = this.handleSave.bind(this)
        this.saveAndClose = this.saveAndClose.bind(this)
        this.cancelForm = this.cancelForm.bind(this)
    }

    onSubmit(assignment) {
        if (this.props.currentWorkspace === WORKSPACE.PLANNING) {
            return this.props.save(assignment)
        } else {
            return this.props.onFulFilAssignment(assignment)
        }

    }

    handleSave() {
        return this.refs.AssignmentForm.getWrappedInstance().submit()
    }

    saveAndClose() {
        const { valid, closePreview } = this.props
        const rtn = this.handleSave()
        if (valid) {
            rtn.then(closePreview.bind(this, null))
        }
    }

    cancelForm() {
        const { pristine, openCancelModal, closePreview } = this.props
        if (!pristine) {
            return openCancelModal(this.saveAndClose, closePreview.bind(this, null))
        }

        return closePreview()
    }

    render() {
        const {
            assignment,
            readOnly,
            users,
            closePreview,
            openEditor,
            completeAssignment,
            pristine,
            submitting,
            currentWorkspace,
        } = this.props

        const creationDate = get(assignment, '_created')
        const updatedDate = get(assignment, '_updated')
        const author = getCreator(assignment, 'original_creator', users)
        const state = get(assignment, 'assigned_to.state')
        const versionCreator = getCreator(assignment, 'version_creator', users)
        const inAssignments = currentWorkspace === WORKSPACE.ASSIGNMENTS

        let itemActions
        if (assignmentUtils.canCompleteAssignment(assignment)) {
            itemActions = [
                {
                    label: 'Complete Assignment',
                    icon: 'icon-ok',
                    callback: () => { completeAssignment(assignment) },
                },
            ]
        }

        return (
            <div className="EditAssignmentPanel">
                <header className="subnav">
                    {readOnly &&
                        <div className="EditAssignmentPanel__actions">
                            {inAssignments && assignmentUtils.canEditAssignment(assignment) &&
                            <button className="navbtn navbtn--right"
                                onClick={openEditor.bind(this, assignment)}
                                data-sd-tooltip={TOOLTIPS.edit} data-flow='down'>
                                <i className="icon-pencil"/>
                            </button>}
                            <button className="navbtn navbtn--right"
                                onClick={closePreview.bind(this)}
                                data-sd-tooltip={TOOLTIPS.close} data-flow='down'>
                                <i className="icon-close-small"/>
                            </button>
                        </div>}
                    {!readOnly && inAssignments &&
                        <div className="EditAssignmentPanel__actions EditAssignmentPanel__actions__edit">
                            <button className="btn btn--primary"
                                    type="reset"
                                    onClick={this.cancelForm}
                                    disabled={submitting}>
                            Close
                            </button>
                            <button
                                className="btn btn--primary"
                                type="submit"
                                onClick={this.handleSave.bind(this)}
                                disabled={pristine || submitting}>
                                Save
                            </button>
                        </div>}
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
                    <div>
                        <AuditInformation
                            createdBy={author}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate} />
                    </div>
                    {!readOnly && <ItemActionsMenu actions={itemActions}/>}
                    <AssignmentForm
                        ref="AssignmentForm"
                        onSubmit={this.onSubmit.bind(this)}
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
    openEditor: PropTypes.func.isRequired,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    valid: PropTypes.bool.isRequired,
    save: PropTypes.func.isRequired,
    openCancelModal: PropTypes.func.isRequired,
    currentWorkspace: PropTypes.string,
    onFulFilAssignment: PropTypes.func,
    completeAssignment: PropTypes.func,
}

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    readOnly: selectors.getReadOnlyAssignment(state),
    users: selectors.getUsers(state),
    pristine: isPristine('assignment')(state),
    valid: isValid('assignment')(state),
    submitting: isSubmitting('assignment')(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
})

const mapDispatchToProps = (dispatch) => (
    {
        closePreview: () => dispatch(actions.assignments.ui.closePreview()),
        openEditor: (assignment) => dispatch(actions.assignments.ui.openEditor(assignment)),
        save: (assignment) => dispatch(actions.assignments.ui.save(assignment)),
        completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
        openCancelModal: (actionCallback, ignoreCallBack) => dispatch(actions.showModal({
                modalType: MODALS.CONFIRMATION,
                modalProps: {
                    title: 'Save changes?',
                    body: 'There are some unsaved changes, do you want to save it now?',
                    okText: 'Save',
                    showIgnore: true,
                    action: actionCallback,
                    ignore: ignoreCallBack,
                },
            })),
    }
)

export const EditAssignmentPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(EditAssignmentPanel)
