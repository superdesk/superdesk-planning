import React from 'react'
import { fields } from '../components'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import * as actions from '../actions'
import { ChainValidators, RequiredFieldsValidatorFactory, MaxLengthValidatorFactory } from '../validators'

export class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit} className="CreateEditAgendaForm">
                <Field name="name"
                       component={fields.InputField}
                       autoFocus={true}
                       type="text"
                       label="Name"/>
                <button type="submit" style={{ visibility: 'hidden' }}>Submit</button>
            </form>
        )
    }
}

Component.propTypes = { handleSubmit: React.PropTypes.func.isRequired }

// Decorate the form component
export const CreateEditAgenda = reduxForm({
    form: 'createEditAgenda', // a unique name for this form
    validate: ChainValidators([
        RequiredFieldsValidatorFactory(['name']),
        MaxLengthValidatorFactory({ name: 100 }),
    ]),
    touchOnBlur: false,
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: ({ _id, name }) => (
        // save the agenda through the API
        dispatch(actions.createOrUpdateAgenda({
            _id,
            name,
        }))
    ),
})

export const CreateEditAgendaForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true })(CreateEditAgenda)
