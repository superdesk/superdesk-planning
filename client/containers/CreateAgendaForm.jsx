import React from 'react'
import { fields } from '../components'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import * as actions from '../actions'
import { RequiredFieldsValidatorFactory } from '../validators'

export class Component extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit} className="CreateAgendaForm">
                <Field name="name"
                       component={fields.InputField}
                       type="text"
                       label="Name"/>
                <button type="submit" style={{visibility: 'hidden'}}>Submit</button>
            </form>
        )
    }
}

Component.propTypes = {
    handleSubmit: React.PropTypes.func.isRequired,
}

// Decorate the form component
export const CreateAgenda = reduxForm({
    form: 'createAgenda', // a unique name for this form
    validate: RequiredFieldsValidatorFactory(['name']),
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
