import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { DayPickerInput } from './index'
import { Field, reduxForm } from 'redux-form'
import { set, get } from 'lodash'

const renderInputField = ({ input, label, type, meta: { touched, error, warning } }) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <input {...input} placeholder={label} type={type}/>
            {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
        </div>
    </div>
)

/**
* Modal for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            canSubmit: true,
            isFullDay: false
        }
    }

    /** Show the submit button enabled */
    enableButton() { this.setState({ canSubmit: true }) }
    /** Show the submit button disabled */
    disableButton() { this.setState({ canSubmit: false }) }

    onFullDayChange(e) {
        this.setState({ isFullDay: e.target.checked })
    }

    render() {
        return (
            <Modal show={this.props.modalType === 'EDIT_EVENT'} onHide={this.props.onHide}>
                <form onSubmit={this.props.handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add/Edit an event</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div>
                            <Field name="unique_name"
                                   component={renderInputField}
                                   type="text"
                                   label="What"/>
                        </div>
                        <div>
                            <Field name="description.definition_short"
                                   component={renderInputField}
                                   type="text"
                                   label="Description"/>
                        </div>
                        <div>
                            <Field name="location[0].name"
                                   component={renderInputField}
                                   type="text"
                                   label="Where"/>
                        </div>
                        <div>
                            <label htmlFor="dates.start">When</label>
                        </div>
                        <div>
                            <Field name="dates.start"
                                   component={DayPickerInput}
                                   withTime={!this.isFullDay}/>
                            to
                            <Field name="dates.end"
                                   component={DayPickerInput}
                                   withTime={!this.isFullDay}/>
                        </div>
                        <label htmlFor="isFullDay">Is full day</label>
                        <input type="checkbox" onChange={this.onFullDayChange.bind(this)}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onHide}>Close</Button>
                        <Button type="submit"
                                disabled={this.props.pristine ||
                                    this.props.submitting}>Save</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        )
    }
}

const requiredFields = ['unique_name', 'dates.start'];

const validate = values => {
    const errors = {}
    requiredFields.forEach((field) => {
        if (!get(values, field)) {
            set(errors, field, 'Required')
        }
    })

    return errors
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    validate,
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapStateToProps = (state) => ({
    modalType: state.modal.modalType,
    modalProps: state.modal.modalProps,
    initialValues: state.modal.modalProps.event || {}
})

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => dispatch(actions.saveEvent(event)),
    onHide: () => dispatch(actions.hideModal())
})

export const AddEventContainer = connect(mapStateToProps, mapDispatchToProps)(FormComponent)
