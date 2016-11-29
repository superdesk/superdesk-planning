import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../actions'

class ModalWithFormComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    submit() {
        this.refs.form.getWrappedInstance().submit()
    }

    render() {
        const form = React.createElement(this.props.form, {
            initialValues: this.props.initialValues,
            ref: 'form'
        })
        return (
            <Modal show={this.props.show} onHide={this.props.handleHide}>
                <Modal.Header>
                    <a className="close" onClick={this.props.handleHide}>
                        <i className="icon-close-small"></i>
                    </a>
                    <h3>{ this.props.title }</h3>
                </Modal.Header>
                <Modal.Body>
                    { form }
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

const mapDispatchToProps = (dispatch) => ({
    handleHide: () => dispatch(actions.hideModal())
})

export const ModalWithForm = connect(null, mapDispatchToProps)(ModalWithFormComponent)
