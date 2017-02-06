import React from 'react'
import { fields } from '../components'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import * as actions from '../actions'
import { RequiredFieldsValidator } from '../utils'

export class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit} className="CreateAgendaForm">
                <Field name="name"
                       component={fields.InputField}
                       type="text"
                       label="Name"/>
            </form>
        )
    }
}

// Decorate the form component
export const CreateAgenda = reduxForm({
    form: 'createAgenda', // a unique name for this form
    validate: RequiredFieldsValidator(['name']),
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: ({ name }) => (
        // save the agenda through the API
        dispatch(actions.createAgenda({ name }))
    )
})

export const CreateAgendaForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true })(CreateAgenda)
