import React from 'react'
import PropTypes from 'prop-types'
import {
    Modal,
    PlanningPanelContainer,
} from '../index'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import './style.scss'
import { get } from 'lodash'

export function AddToPlanningComponent({
    handleHide,
    modalProps,
    currentWorkspace,
}) {
    const { newsItem, $scope } = modalProps

    const handleCancel = () => {
        handleHide()
        $scope.reject()
    }

    if (currentWorkspace !== 'AUTHORING') {
        return null
    }

    const slugline = get(newsItem, 'slugline', '')
    const headline = get(newsItem, 'headline', '')

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
                <h3>Add to Planning</h3>
            </Modal.Header>

            <Modal.Body>
                <div className='AddToPlanning'>
                    <div>
                        <div className='metadata-view'>
                            <dl>
                                <dt>Slugline:</dt>
                                <dd>{slugline}</dd>
                            </dl>
                            <dl>
                                <dt>Headline:</dt>
                                <dd>{headline}</dd>
                            </dl>
                        </div>
                    </div>
                    <div className='Planning'>
                        <PlanningPanelContainer />
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button type="button" onClick={handleCancel}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    )
}

AddToPlanningComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        $scope: PropTypes.object,
    }),
    currentWorkspace: PropTypes.string,
}

const mapStateToProps = (state) => ({ currentWorkspace: selectors.getCurrentWorkspace(state) })

export const AddToPlanningModal = connect(
    mapStateToProps,
    null
)(AddToPlanningComponent)
