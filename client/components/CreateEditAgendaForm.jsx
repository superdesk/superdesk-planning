import React from 'react'
import { fields, Toggle, AuditInformation } from '../components'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import * as actions from '../actions'
import { ChainValidators, RequiredFieldsValidatorFactory, MaxLengthValidatorFactory } from '../validators'

export class Component extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isEnabled: this.props.initialValues.is_enabled }
    }

    handleEnabledChange(event) {
        this.props.change('is_enabled', event.target.value)
        this.setState({ isEnabled: event.target.value })
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit} className="CreateEditAgendaForm">
                <div className="field">
                    <AuditInformation createdBy={get(this.props, 'initialValues.original_creator')}
                        updatedBy={get(this.props, 'initialValues.version_creator')}
                        createdAt={get(this.props, 'initialValues._created')}
                        updatedAt={get(this.props, 'initialValues._updated')}/>
                </div>
                <Field name="name"
                       component={fields.InputField}
                       autoFocus={true}
                       type="text"
                       label="Name"/>
                <div className="field">
                    <Toggle value={this.state.isEnabled}
                            onChange={this.handleEnabledChange.bind(this)}
                            /> Enabled
                </div>
                <button type="submit" style={{ visibility: 'hidden' }}>Submit</button>
            </form>
        )
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    change: PropTypes.func,
}

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
    onSubmit: (agenda) => (
        // save the agenda through the API
        dispatch(actions.createOrUpdateAgenda(agenda))
    ),
})

export const CreateEditAgendaForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true })(CreateEditAgenda)
