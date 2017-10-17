import React from 'react'
import PropTypes from 'prop-types'
import {
    Modal,
    PlanningPanelContainer,
} from '../index'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import './style.scss'

export function AddToPlanningComponent({
    handleHide,
    modalProps,
    onAddCoverage,
    closeEditor,
    currentPlanning,
    onPlanningFormSave,
    currentWorkspace,
}) {
    const { newsItem, $scope } = modalProps

    const action = (savedItem) => {
        onPlanningFormSave(savedItem, newsItem)
        $scope.resolve()
    }

    const handleCancel = () => {
        handleHide()
        $scope.reject()
        closeEditor(currentPlanning)
    }

    const onAddCoverageClick = (planning) => {
        onAddCoverage(currentPlanning, planning, newsItem)
    }

    if (currentWorkspace !== 'AUTHORING') {
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
                <h3>Add to Planning</h3>
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
                        <PlanningPanelContainer
                            onAddCoverage={onAddCoverageClick}
                            onPlanningFormSave={action}
                        />
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
    onAddCoverage: PropTypes.func,
    closeEditor: PropTypes.func,
    currentPlanning: PropTypes.object,
    onPlanningFormSave: PropTypes.func,
    currentWorkspace: PropTypes.string,
}

const mapStateToProps = (state) => ({
    currentPlanning: selectors.getCurrentPlanning(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
})

const mapDispatchToProps = (dispatch) => ({
    onAddCoverage: (prevPlan, newPlan, newsItem) =>
        dispatch(actions.planning.ui.onAddCoverageFromAuthoring(prevPlan, newPlan, newsItem)),
    closeEditor: (planning) =>
        dispatch(actions.planning.ui.closeEditor(planning)),
    onPlanningFormSave: (planning, newsItem) =>
        dispatch(actions.planning.ui.onAddCoverageFromAuthoringSave(planning, newsItem)),
})

export const AddToPlanningModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(AddToPlanningComponent)
