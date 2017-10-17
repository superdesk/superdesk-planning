import React from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import PropTypes from 'prop-types'
import {
    Modal,
    AssignmentListContainer,
} from '../index'
import * as selectors from '../../selectors'
import * as actions  from '../../actions'
import { WORKSPACE } from '../../constants'

import './style.scss'


export function FulFillAssignmentComponent({
    handleHide,
    modalProps,
    currentWorkspace,
    onFulFillAssignment,
}) {
    const { newsItem, $scope } = modalProps

    const action = (assignment) => {
        return onFulFillAssignment(assignment, newsItem)
        .then(
            () => { $scope.resolve() },
            () => { $scope.reject() }
        )
    }

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
                <a className="close" onClick={handleCancel}>
                    <i className="icon-close-small" />
                </a>
                <h3>Fulfill Assignment</h3>
            </Modal.Header>

            <Modal.Body>
                <div className='FulfillAssignment'>
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
                    <AssignmentListContainer
                        onFulFillAssignment={action} />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button type="button" onClick={handleCancel}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    )
}

FulFillAssignmentComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        $scope: PropTypes.object,
    }),
    currentWorkspace: PropTypes.string,
    onFulFillAssignment: PropTypes.func,
}

const mapStateToDispatch = (dispatch) => ({
    onFulFillAssignment: (assignment, item) => (
        dispatch(actions.assignments.ui.onFulFillAssignment(assignment, item))
    ),
})

const mapStateToProps = (state) => ({ currentWorkspace: selectors.getCurrentWorkspace(state) })


export const FulFillAssignmentModal = connect(
    mapStateToProps,
    mapStateToDispatch
)(FulFillAssignmentComponent)