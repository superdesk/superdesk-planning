import React from 'react'
import PropTypes from 'prop-types'
import {
    Modal,
    PlanningPanelContainer,
} from '../index'
import { Button } from 'react-bootstrap'
import './style.scss'

export function AddToPlanningModal({ handleHide, modalProps }) {
    const { newsItem } = modalProps

    const action = () => (
        Promise.resolve(modalProps.action())
        .then(handleHide)
    )

    const handleCancel = () => {
        handleHide()
        if (modalProps.onCancel) {
            modalProps.onCancel()
        }
    }

    return (
        <Modal
            show={true}
            onHide={handleHide}
            fill={true}
        >
            <Modal.Header>
                <a className="close" onClick={handleCancel}>
                    <i className="icon-close-small" />
                </a>
                <h3>{ modalProps.title || 'Add to Planning' }</h3>
            </Modal.Header>

            <Modal.Body>
                <div className='AddToPlanning'>
                    <div>
                        <div className='metadata-view'>
                            <dl>
                                <dt>Slugline:</dt>
                                <dd>{newsItem.slugline}</dd>
                            </dl>
                            <dl>
                                <dt>Headline:</dt>
                                <dd>{newsItem.headline}</dd>
                            </dl>
                        </div>
                    </div>
                    <div className='Planning'>
                        <PlanningPanelContainer/>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button type="button" onClick={handleCancel}>{modalProps.cancelText || 'Cancel'}</Button>
                <Button className="btn--primary" type="submit" onClick={action}>{modalProps.okText || 'Ok'}</Button>
            </Modal.Footer>
        </Modal>
    )
}

AddToPlanningModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        onCancel: PropTypes.func,
        cancelText: PropTypes.string,
        ignoreText: PropTypes.string,
        okText: PropTypes.string,
        action: PropTypes.func.isRequired,
        title: PropTypes.string,
        newsItem: PropTypes.object,
    }),
}
