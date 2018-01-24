import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from '../index';
import {default as PlanningApp} from '../../planning';
import {Button} from 'react-bootstrap';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {Row} from '../UI/Preview';
import './style.scss';
import {get} from 'lodash';

export function AddToPlanningComponent({
    handleHide,
    modalProps,
    currentWorkspace,
    actionInProgress,
}) {
    const {newsItem, $scope} = modalProps;

    const handleCancel = () => {
        handleHide();
        $scope.reject();
    };

    if (currentWorkspace !== 'AUTHORING') {
        return null;
    }

    const slugline = get(newsItem, 'slugline', '');
    const headline = get(newsItem, 'headline', '');

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
                <h3>Add to Planning</h3>
            </Modal.Header>

            <Modal.Body>
                <div className="AddToPlanning">
                    <div>
                        <div className="MetadataView">
                            <Row
                                label={gettext('Slugline')}
                                value={slugline}
                                className="slugline"
                                noPadding={true}
                            />
                            <Row
                                label={gettext('Headline')}
                                value={headline}
                                className="strong"
                                noPadding={true}
                            />

                        </div>
                    </div>
                    <PlanningApp addNewsItemToPlanning={newsItem}/>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    type="button"
                    disabled={actionInProgress}
                    onClick={handleCancel}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}

AddToPlanningComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        $scope: PropTypes.object,
    }),
    currentWorkspace: PropTypes.string,
    actionInProgress: PropTypes.boolean,
};

const mapStateToProps = (state) => ({
    currentWorkspace: selectors.getCurrentWorkspace(state),
    actionInProgress: selectors.getModalActionInProgress(state),
});

export const AddToPlanningModal = connect(
    mapStateToProps,
    null)(AddToPlanningComponent);
