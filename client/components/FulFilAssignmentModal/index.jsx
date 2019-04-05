import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Button} from '../UI';

import {Modal} from '../index';
import {FulfilAssignmentApp} from '../../apps';

import * as selectors from '../../selectors';
import {WORKSPACE} from '../../constants';
import {gettext} from '../../utils';


export function FulFilAssignmentComponent({
    handleHide,
    modalProps,
    currentWorkspace,
    actionInProgress,
}) {
    const {newsItem, $scope} = modalProps;

    const handleCancel = () => {
        handleHide();
        $scope.resolve();
    };

    if (currentWorkspace !== WORKSPACE.AUTHORING) {
        return null;
    }

    return (
        <Modal
            show={true}
            onHide={handleHide}
            fill={true}
        >
            <Modal.Header>
                {actionInProgress ? null : (
                    <a className="close" onClick={handleCancel}>
                        <i className="icon-close-small" />
                    </a>
                )}
                <h3>{gettext('Select an Assignment')}</h3>
            </Modal.Header>

            <Modal.Body noPadding fullHeight noScroll
            >
                <div className="planning-app__modal FulfilAssignment">
                    <FulfilAssignmentApp newsItem={newsItem}/>
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

FulFilAssignmentComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        $scope: PropTypes.object,
    }),
    currentWorkspace: PropTypes.string,
    actionInProgress: PropTypes.bool,
    priorities: PropTypes.array,
    urgencies: PropTypes.array,
    urgencyLabel: PropTypes.string,
};

const mapStateToProps = (state) => ({
    currentWorkspace: selectors.general.currentWorkspace(state),
    actionInProgress: selectors.general.modalActionInProgress(state),
});

export const FulFilAssignmentModal = connect(
    mapStateToProps,
    null
)(FulFilAssignmentComponent);