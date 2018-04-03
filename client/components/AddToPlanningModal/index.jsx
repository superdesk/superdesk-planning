import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Modal} from '../index';
import {Button} from '../UI';
import {AddToPlanningApp} from '../../apps';

import * as selectors from '../../selectors';
import {gettext} from '../../utils';

import './style.scss';


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
                <h3>{gettext('Select an existing Planning Item or create a new one')}</h3>
            </Modal.Header>

            <Modal.Body
                noPadding={true}
                fullHeight={true}
            >
                <div className="AddToPlanning">
                    <AddToPlanningApp addNewsItemToPlanning={newsItem} />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    text={gettext('Cancel')}
                    disabled={actionInProgress}
                    onClick={handleCancel}
                />
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
    actionInProgress: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    currentWorkspace: selectors.getCurrentWorkspace(state),
    actionInProgress: selectors.getModalActionInProgress(state),
});

export const AddToPlanningModal = connect(
    mapStateToProps,
    null)(AddToPlanningComponent);
