import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../actions'
import AddEventForm from './AddEventForm'

/**
* Modal for adding/editing an event
*/
export class AddEvent extends React.Component {
    submit() {
        this.refs.form.getWrappedInstance().submit()
    }

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.handleHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Add/Edit an event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AddEventForm initialValues={this.props.initialValues} ref="form" />
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.handleHide}>Close</Button>
                    <Button type="submit"
                            onClick={this.submit.bind(this)}
                            disabled={this.props.pristine ||
                                this.props.submitting}>Save</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

const mapStateToProps = (state) => ({
    show: state.modal.modalType === 'EDIT_EVENT',
    modalProps: state.modal.modalProps,
    initialValues: state.modal.modalProps.event || {}
})

const mapDispatchToProps = (dispatch) => ({
    handleHide: () => dispatch(actions.hideModal())
})

const AddEventContainer = connect(mapStateToProps, mapDispatchToProps)(AddEvent)
export default AddEventContainer
