import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AddEventForm } from './index';

/**
* Modal for adding/editing an event
* @constructor Init the state
* @param {object} props - props given by its parent
*/
export class AddEventModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            canSubmit: false
        };
    }

    // REDUCERS
    /** Show the submit button enabled */
    enableButton() { this.setState({ canSubmit: true }); }
    /** Show the submit button disabled */
    disableButton() { this.setState({ canSubmit: false }); }

    // ACTIONS
    /** Close the modal. (The parent is responsible for closing the modal) */
    close() { this.props.onHide(); }
    /** Notify the parent the form has been saved in order to refresh the list */
    onSave(event) { this.props.onSave(event); }
    /** Notify the form that it should save the event */
    save() { this.refs.addEventForm.save(); }

    render() {
        return (
            <Modal show={this.props.show !== false} onHide={this.close.bind(this)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add/Edit an event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AddEventForm event={this.props.show}
                                  api={this.props.api}
                                  onSave={this.onSave.bind(this)}
                                  onValid={this.enableButton.bind(this)}
                                  onInvalid={this.disableButton.bind(this)}
                                  ref="addEventForm" />
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.close.bind(this)}>Close</Button>
                    <Button disabled={!this.state.canSubmit}
                            onClick={this.save.bind(this)}>Save</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
