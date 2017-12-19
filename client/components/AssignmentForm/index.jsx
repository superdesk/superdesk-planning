import React from 'react';
import PropTypes from 'prop-types';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {Field, reduxForm, propTypes} from 'redux-form';
import {CoverageDetails, EditAssignment, StateLabel, ItemActionsMenu, fields} from '../../components';
import {assignmentUtils} from '../../utils';
import * as selectors from '../../selectors';
import {ASSIGNMENTS, WORKSPACE} from '../../constants';
import {get} from 'lodash';
import './style.scss';

export class Component extends React.Component {
    constructor(props) {
        super(props);
        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(template, assignment) {
        const {createFromTemplateAndShow} = this.props;

        createFromTemplateAndShow(assignment._id, template.template_name);
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
            startWorking,
        } = this.props;
        let assignmentState = get(assignment, 'assigned_to.state');

        const actions = [
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.REASSIGN,
                callback: () => {
                    reassign(assignment);
                },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY,
                callback: () => {
                    editAssignmentPriority(assignment);
                },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.COMPLETE,
                callback: () => {
                    completeAssignment(assignment);
                },
            },
            {
                ...ASSIGNMENTS.ITEM_ACTIONS.START_WORKING,
                callback: () => {
                    startWorking(assignment);
                },
            },
        ];

        const itemActions = inAssignments ? assignmentUtils.getAssignmentItemActions(
            assignment,
            session,
            privileges,
            actions
        ) : [];

        const assignmentPriorityInput = {value: get(assignment, 'priority')};

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
                        deskSelectionDisabled={assignmentState ===
                            ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS}
                        context={'assignment'} />
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
                            contentType={get(assignment, 'planning.g2_content_type')}
                            keywords={keywords}
                        />
                    </div>
                </fieldset>
            </form>
        );
    }
}

Component.propTypes = {
    ...propTypes,
    assignment: PropTypes.object,
    formProfile: PropTypes.object,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    keywords: PropTypes.array,
    onSubmit: PropTypes.func,
    startWorking: PropTypes.func.isRequired,
    createFromTemplateAndShow: PropTypes.func.isRequired,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    inAssignments: PropTypes.bool,
    session: PropTypes.object,
    privileges: PropTypes.object,
};

const mapStateToProps = (state) => ({
    initialValues: selectors.getCurrentAssignment(state),
    assignment: selectors.getCurrentAssignment(state),
    currentUserId: selectors.getCurrentUserId(state),
    desks: selectors.getDesks(state),
    formProfile: selectors.planning.coverageFormsProfile(state),
    users: selectors.getUsers(state),
    coverageProviders: selectors.getCoverageProviders(state),
    keywords: selectors.getKeywords(state),
    session: selectors.getSessionDetails(state),
    inAssignments: selectors.getCurrentWorkspace(state) === WORKSPACE.ASSIGNMENTS,
    privileges: selectors.getPrivileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    startWorking: (assignment) => dispatch(actions.assignments.ui.openSelectTemplateModal(assignment)),
    createFromTemplateAndShow: (assignmentId, templateName) =>
        dispatch(actions.assignments.api.createFromTemplateAndShow(assignmentId, templateName)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
});

const AssignmentReduxForm = reduxForm({
    form: 'assignment',
    enableReinitialize: true, // the form will reinitialize every time the initialValues prop changes
})(Component);

export const AssignmentForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true})(AssignmentReduxForm);
