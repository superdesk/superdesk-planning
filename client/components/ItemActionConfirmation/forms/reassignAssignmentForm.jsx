import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import * as actions from '../../../actions'
import { EditAssignment } from '../../../components'
import '../style.scss'
import { get } from 'lodash'
import { FORM_NAMES, ASSIGNMENTS } from '../../../constants'
import * as selectors from '../../../selectors'

export class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.refs.editAssignmentField.getRenderedComponent().toggleSelection()
    }

    render() {
        const {
            handleSubmit,
            initialValues,
            users,
            desks,
            currentUserId,
            coverageProviders,
        } = this.props

        return (<div className='ItemActionConfirmation' >
                <form onSubmit={handleSubmit}>
                    <div className="metadata-view">
                        <dl>
                            { initialValues.planning.slugline && (<dt>Slugline:</dt>) }
                        </dl>
                    </div>
                    <div>
                        <Field
                            name='assigned_to'
                            component={EditAssignment}
                            users={users}
                            currentUserId={currentUserId}
                            desks={desks}
                            coverageProviders={coverageProviders}
                            readOnly={false}
                            deskSelectionDisabled={get(initialValues, 'assigned_to.state') ===
                                ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS}
                            context={'assignment'}
                            ref='editAssignmentField'
                            withRef={true} />
                    </div>
                </form>
            </div>)
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    users: PropTypes.array,
    desks: PropTypes.array,
    currentUserId: PropTypes.string,
    coverageProviders: PropTypes.array,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

// Decorate the form container
export const ReassignAssignmentFormComponent = reduxForm({ form: FORM_NAMES.ReassignAssignmentForm })(Component)

const mapStateToProps = (state) => ({
    currentUserId: selectors.getCurrentUserId(state),
    desks: selectors.getDesks(state),
    users: selectors.getUsers(state),
    coverageProviders: selectors.getCoverageProviders(state),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (assignment) => dispatch(actions.assignments.ui.save(assignment))
    .then(() => {
        dispatch({
            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
            payload: { assignment },
        })
    }),

    onHide: (assignment) => {
        if (assignment.lock_action === 'reassign') {
            dispatch(actions.assignments.api.unlock(assignment))
        }
    },
})

export const ReassignAssignmentForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(ReassignAssignmentFormComponent)
