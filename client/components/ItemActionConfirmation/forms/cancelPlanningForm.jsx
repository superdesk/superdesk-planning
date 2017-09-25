import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import * as actions from '../../../actions'
import { InputTextAreaField } from '../../fields/index'
import { get } from 'lodash'
import '../style.scss'

const Component = ({ handleSubmit, initialValues }) => {
    let planning = initialValues
    return (
        <div className="ItemActionConfirmation">
            <form onSubmit={handleSubmit}>
                <strong>{ planning.slugline }</strong>
                <label>Reason for cancelling the planning item:</label>
                <Field name="reason"
                    component={InputTextAreaField}
                    type="text"
                    readOnly={false}/>
            </form>
        </div>
    )
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

export const CancelPlanning = reduxForm({ form: 'cancelPlanning' })(Component)

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (plan) => (dispatch(actions.planning.ui.cancelPlanning(plan))
    .then((plan) => {
        if (get(plan, '_publish', false)) {
            dispatch(actions.planning.ui.publish(plan))
        }

        // Unlock the planning item immediately as it is now in 'cancelled' state
        dispatch(actions.planning.api.unlock(plan))
    })),
    onHide: (planning) => {
        if (planning.lock_action === 'planning_cancel') {
            dispatch(actions.planning.api.unlock(planning))
        }
    },
})

export const CancelPlanningForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true }
)(CancelPlanning)
