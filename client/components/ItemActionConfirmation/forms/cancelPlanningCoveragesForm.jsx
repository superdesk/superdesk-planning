import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import * as actions from '../../../actions'
import { InputTextAreaField } from '../../fields/index'
import { isItemCancelled } from '../../../utils'
import { get } from 'lodash'
import { FORM_NAMES } from '../../../constants'
import '../style.scss'

const Component = ({ handleSubmit, initialValues, submitting }) => {
    let planning = initialValues
    const labelText = initialValues._cancelAllCoverage ? 'Reason for cancelling all coverage:' :
        'Reason for cancelling the planning item:'
    return (
        <div className="ItemActionConfirmation">
            <form onSubmit={handleSubmit}>
                <strong>{ planning.slugline }</strong>
                <label>{labelText}</label>
                <Field name="reason"
                    component={InputTextAreaField}
                    type="text"
                    readOnly={submitting}/>
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
    submitting: PropTypes.bool,
}

export const CancelPlanningCoverages = reduxForm({ form: FORM_NAMES.CancelPlanningForm })(Component)

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (plan) => {
        let cancelDispatch = ()  => (dispatch(actions.planning.ui.cancelPlanning(plan)))
        if (plan._cancelAllCoverage) {
            cancelDispatch = () => (dispatch(actions.planning.ui.cancelAllCoverage(plan)))
        }

        return cancelDispatch()
        .then((plan) => {
            if (get(plan, '_publish', false)) {
                dispatch(actions.planning.ui.publish(plan))
            }

            if (plan.lock_action === 'cancel_all_coverage' ||
                    isItemCancelled(plan)) {
                dispatch(actions.planning.api.unlock(plan))
            }
        })
    },

    onHide: (planning) => {
        if (planning.lock_action === 'planning_cancel' ||
                planning.lock_action === 'cancel_all_coverage') {
            dispatch(actions.planning.api.unlock(planning))
        }
    },
})

export const CancelPlanningCoveragesForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true }
)(CancelPlanningCoverages)
