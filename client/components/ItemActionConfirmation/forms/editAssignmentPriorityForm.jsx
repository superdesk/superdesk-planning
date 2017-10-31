import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import * as actions from '../../../actions'
import { fields } from '../../../components'
import '../style.scss'
import { FORM_NAMES, ASSIGNMENTS } from '../../../constants'

class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {
            handleSubmit,
            initialValues,
        } = this.props

        return (<div className='ItemActionConfirmation' >
                <form onSubmit={handleSubmit}>
                    <div className="metadata-view">
                        <dl>
                            <dt>Slugline:</dt>
                            { initialValues.planning.slugline &&
                                <dd>{ initialValues.planning.slugline }</dd>
                            }
                        </dl>
                    </div>
                    <div>
                        <Field
                            label='Assignment Priority'
                            name='priority'
                            component={fields.AssignmentPriorityField}
                            readOnly={false} />
                    </div>
                </form>
            </div>)
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

// Decorate the form container
const EditAssignmentPriorityFormComponent = reduxForm({ form: FORM_NAMES.EditAssignmentPriorityForm })(Component)

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
        if (assignment.lock_action === 'edit_priority') {
            dispatch(actions.assignments.api.unlock(assignment))
        }
    },
})

export const EditAssignmentPriorityForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true }
)(EditAssignmentPriorityFormComponent)
