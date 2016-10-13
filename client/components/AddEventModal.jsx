import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AddEventForm } from './index';
export class AddEventModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            canSubmit: false
        };
    }

    onSave() {
        var model = this.refs.addEventForm.refs.form.getModel();
        // TODO
        return model;
    }

    enableButton() { this.setState({ canSubmit: true }); }

    disableButton() { this.setState({ canSubmit: false }); }

    render() {
        return (
            <Modal show={this.props.show !== false} onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Add/Edit an event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AddEventForm event={this.props.show}
                                  onValid={this.enableButton.bind(this)}
                                  onInvalid={this.disableButton.bind(this)}
                                  ref="addEventForm" />
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.onHide}>Close</Button>
                    <Button disabled={!this.state.canSubmit}
                            onClick={this.onSave.bind(this)}>Save</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
