import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../../actions'

export function ConfirmationModalComponent({ show, title, body, handleHide, handleAction }) {
    const action = () => (
        Promise.resolve(handleAction())
        .then(handleHide)
    )
    return (
        <Modal show={show} onHide={handleHide}>
            <Modal.Header>
                <a className="close" onClick={handleHide}>
                    <i className="icon-close-small" />
                </a>
                <h3>{ title }</h3>
            </Modal.Header>
            <Modal.Body>
                { body }
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={handleHide}>Cancel</Button>
                <Button type="submit"
                        onClick={action}>Ok</Button>
            </Modal.Footer>
        </Modal>
    )
}

ConfirmationModalComponent.defaultProps = {
    title: 'Confirmation',
    body: 'Are you sure ?',
}

ConfirmationModalComponent.propTypes = {
    show: React.PropTypes.bool,
    title: React.PropTypes.string,
    body: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.element,
    ]),
    handleHide: React.PropTypes.func,
    handleAction: React.PropTypes.func,
}

const mapStateToProps = (state) => ({
    show: state.modal.modalType === 'CONFIRMATION',
    body: state.modal.modalProps.body,
    title: state.modal.modalProps.title,
    handleAction: state.modal.modalProps.action,
})

const mapDispatchToProps = (dispatch) => ({ handleHide: () => dispatch(actions.hideModal()) })

export const ConfirmationModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ConfirmationModalComponent)
