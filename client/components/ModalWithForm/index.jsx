import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '../index'
import { Button } from 'react-bootstrap'
import './style.scss'
import { isBoolean } from 'lodash'

export class ModalWithForm extends React.Component {
    constructor(props) {
        super(props)
    }

    submit() {
        this.refs.form.getWrappedInstance().submit()
    }

    render() {
        const form = React.createElement(this.props.form, {
            initialValues: this.props.initialValues,
            ref: 'form',
        })

        return (
            <Modal show={this.props.show}
                   onHide={this.props.onHide}
                   large={isBoolean(this.props.large) ? this.props.large : false}
                   fill={isBoolean(this.props.fill) ? this.props.fill : false}
                   fullscreen={isBoolean(this.props.fullscreen) ? this.props.fullscreen : false}
                   white={isBoolean(this.props.white) ? this.props.white : false}>
                <Modal.Header>
                    <a className="close" onClick={this.props.onHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3>{ this.props.title }</h3>
                </Modal.Header>
                <Modal.Body>
                    { form }
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.onHide}>
                        { this.props.cancelButtonText || 'Close' }
                    </Button>
                    <Button type="submit"
                            className="btn btn--primary"
                            onClick={this.submit.bind(this)}
                            disabled={this.props.pristine ||
                                this.props.submitting}>
                        { this.props.saveButtonText || 'Save' }
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

ModalWithForm.propTypes = {
    form: PropTypes.func.isRequired,
    initialValues: PropTypes.object,
    title: PropTypes.string,
    show: PropTypes.bool,
    onHide: PropTypes.func,
    pristine: PropTypes.bool,
    submitting: PropTypes.func,
    cancelButtonText: PropTypes.string,
    saveButtonText: PropTypes.string,
    large: React.PropTypes.bool,
    fill: React.PropTypes.bool,
    fullscreen: React.PropTypes.bool,
    white: React.PropTypes.bool,
}
