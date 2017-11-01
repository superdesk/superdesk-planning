import React from 'react'
import PropTypes from 'prop-types'
import * as actions from '../../actions'
import { connect } from 'react-redux'
import { Field, reduxForm, propTypes } from 'redux-form'
import { CoverageDetails, EditAssignment, StateLabel, ItemActionsMenu, fields } from '../../components'
import { assignmentUtils } from '../../utils'
import * as selectors from '../../selectors'
import { ASSIGNMENTS, WORKSPACE, MODALS } from '../../constants'
import { get } from 'lodash'
import './style.scss'
import _ from 'lodash'

export class Component extends React.Component {
    constructor(props) {
        super(props)
        this.onSelect = this.onSelect.bind(this)
        this.showTemplateModal = this.showTemplateModal.bind(this)
    }

    onSelect(template, assignment) {
        const { createFromTemplateAndShow } = this.props
        createFromTemplateAndShow(assignment._id, template.template_name)
    }

    showTemplateModal(assignment) {
        const { templates, selectTemplateModal } = this.props

        let items = []

        _.each(templates, (template) => {
            items.push({
                value: template,
                label: template.template_name,
                })
        })

        return selectTemplateModal(items, (template) => this.onSelect(template, assignment))
    }

    render() {
        const {
            assignment,
            desks,
            users,
            formProfile,
            handleSubmit,
            keywords,
            coverageProviders,
            currentUserId,
            completeAssignment,
            reassign,
            inAssignments,
            session,
            editAssignmentPriority,
            privileges,
        } = this.props
        let content_type = get(assignment, 'planning.g2_content_type')
        let assignment_state = get(assignment, 'assigned_to.state')

        const actions = [
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.REASSIGN,
                callback: () => { reassign(assignment) },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY,
                callback: () => { editAssignmentPriority(assignment) },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.COMPLETE,
                callback: () => { completeAssignment(assignment) },
            },
        ]

        const itemActions = inAssignments ? assignmentUtils.getAssignmentItemActions(
            assignment,
            session,
            privileges,
            actions
        ) : []

        const assignmentPriorityInput = { value: get(assignment, 'priority') }

        return (
            <form onSubmit={handleSubmit} className="AssignmentForm">
                <fieldset>
                    {get(itemActions, 'length') > 0 && <ItemActionsMenu actions={itemActions}/>}
                    <Field
                        name={'assigned_to'}
                        component={EditAssignment}
                        users={users}
                        currentUserId={currentUserId}
                        desks={desks}
                        coverageProviders={coverageProviders}
                        readOnly={true}
                        deskSelectionDisabled={assignment_state ===
                            ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS}
                        context={'assignment'} />
                    {content_type == 'text' && assignment_state == ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED && <button
                        type="button"
                        onClick={() => this.showTemplateModal(assignment)}
                        className="btn btn--hollow btn--small">
                        Start working
                    </button>}
                    {assignment && assignment.assigned_to &&
                        <div style={{
                                margin: '10px 0px',
                                display: 'inline-block',
                            }}>
                            <StateLabel item={assignment.assigned_to}/>
                        </div>}
                    <fields.AssignmentPriorityField
                            label="Assignment Priority"
                            input={ assignmentPriorityInput }
                            readOnly={true} />
                    <div className="AssignmentForm__coveragedetails">
                        <label>Coverage Details</label>
                        <CoverageDetails
                            coverage={assignment}
                            formProfile={formProfile}
                            readOnly={true}
                            content_type={get(assignment, 'planning.g2_content_type')}
                            keywords={keywords}
                        />
                    </div>
                </fieldset>
            </form>
        )
    }
}

Component.propTypes = {
    ...propTypes,
    assignment: PropTypes.object,
    formProfile: PropTypes.object,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    templates: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    keywords: PropTypes.array,
    onSubmit: PropTypes.func,
    selectTemplateModal: PropTypes.func.isRequired,
    createFromTemplateAndShow: PropTypes.func.isRequired,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    inAssignments: PropTypes.bool,
    session: PropTypes.object,
    privileges: PropTypes.object,
}

const mapStateToProps = (state) => ({
    initialValues: selectors.getCurrentAssignment(state),
    assignment: selectors.getCurrentAssignment(state),
    currentUserId: selectors.getCurrentUserId(state),
    desks: selectors.getDesks(state),
    templates: selectors.getTemplates(state),
    formProfile: selectors.getCoverageFormsProfile(state),
    users: selectors.getUsers(state),
    coverageProviders: selectors.getCoverageProviders(state),
    keywords: selectors.getKeywords(state),
    session: selectors.getSessionDetails(state),
    inAssignments: selectors.getCurrentWorkspace(state) === WORKSPACE.ASSIGNMENTS,
    privileges :selectors.getPrivileges(state),
})

const mapDispatchToProps = (dispatch) => ({
    selectTemplateModal: (items, selectCallBack, cancelCallBack) => dispatch(actions.showModal({
        modalType: MODALS.SELECT_ITEM_MODAL,
        modalProps: {
            title: 'Select template',
            items: items,
            onSelect: selectCallBack,
            onCancel: cancelCallBack,
        },
    })),
    createFromTemplateAndShow: (assignmentId, templateName) => dispatch(actions.assignments.api.createFromTemplateAndShow(assignmentId, templateName)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
})

const AssignmentReduxForm = reduxForm({
    form: 'assignment',
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

export const AssignmentForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true })(AssignmentReduxForm)
