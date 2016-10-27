import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { DayPickerInput } from './index'
import { Field, reduxForm } from 'redux-form'

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
                            <label htmlFor="unique_name">What</label>
                            <Field name="unique_name" component="input" type="text"/>
                        </div>
                        <div>
                            <label htmlFor="description.definition_short">
                                Description
                            </label>
                            <Field name="description.definition_short"
                                   component="input"
                                   type="text"/>
                        </div>
                        <div>
                            <label htmlFor="location[0].name">Where</label>
                            <Field name="location[0].name"
                                   component="input"
                                   type="text"/>
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
                        <Button type="submit">Save</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        )
    }
}

// Decorate the form component
export const FormComponent = reduxForm({
    form: 'addEvent', // a unique name for this form
    enableReinitialize: true //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapStateToProps = (state) => ({
    modalType: state.modal.modalType,
    modalProps: state.modal.modalProps,
    initialValues: state.modal.modalProps.event
})

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (event) => dispatch(actions.saveEvent(event)),
    onHide: () => dispatch(actions.hideModal())
})

export const AddEventContainer = connect(mapStateToProps, mapDispatchToProps)(FormComponent)
