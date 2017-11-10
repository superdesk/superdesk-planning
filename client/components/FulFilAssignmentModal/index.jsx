import React from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import PropTypes from 'prop-types'
import {
    Modal,
    AssignmentListContainer,
} from '../index'
import * as selectors from '../../selectors'
import { WORKSPACE } from '../../constants'
import './style.scss'


export function FulFilAssignmentComponent({
    handleHide,
    modalProps,
    currentWorkspace,
    actionInProgress,
}) {
    const { newsItem, $scope } = modalProps

    const handleCancel = () => {
        handleHide()
        $scope.reject()
    }

    if (currentWorkspace !== WORKSPACE.AUTHORING ) {
        return null
    }

    return (
        <Modal
            show={true}
            onHide={handleHide}
            fill={true}
        >
            <Modal.Header>
                {!actionInProgress && <a className="close" onClick={handleCancel}>
                    <i className="icon-close-small" />
                </a>}
                <h3>Fulfil Assignment</h3>
            </Modal.Header>

            <Modal.Body>
                <div className='FulfilAssignment'>
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
                    <AssignmentListContainer />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button type="button"
                        disabled={actionInProgress}
                        onClick={handleCancel}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    )
}

FulFilAssignmentComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        $scope: PropTypes.object,
    }),
    currentWorkspace: PropTypes.string,
    actionInProgress: PropTypes.boolean,
}

const mapStateToProps = (state) => ({
    currentWorkspace: selectors.getCurrentWorkspace(state),
    actionInProgress: selectors.getModalActionInProgress(state),
})

export const FulFilAssignmentModal = connect(
    mapStateToProps,
    null
)(FulFilAssignmentComponent)