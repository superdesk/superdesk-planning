import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

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
    if (currentWorkspace !== WORKSPACE.AUTHORING) {
        return null;
    }

    const {newsItem, onCancel, onIgnore, showIgnore, ignoreText, title} = modalProps;
    const showCancel = get(modalProps, 'showCancel', true);

    const handleCancel = () => {
        handleHide();

        if (onCancel) {
            onCancel();
        }
    };

    const handleIgnore = !showIgnore ? null : () => {
        handleHide();

        if (onIgnore) {
            onIgnore();
        }
    };

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
                <h3>{title || gettext('Select an Assignment')}</h3>
            </Modal.Header>

            <Modal.Body noPadding fullHeight noScroll
            >
                <div className="planning-app__modal FulfilAssignment">
                    <FulfilAssignmentApp newsItem={newsItem}/>
                </div>
            </Modal.Body>

            <Modal.Footer>
                {!showCancel ? null : (
                    <Button
                        text={gettext('Cancel')}
                        disabled={actionInProgress}
                        onClick={handleCancel}
                    />
                )}
                {!handleIgnore ? null : (
                    <Button
                        text={ignoreText || gettext('Ignore')}
                        disabled={actionInProgress}
                        onClick={handleIgnore}
                    />
                )}
            </Modal.Footer>
        </Modal>
    );
}

FulFilAssignmentComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        onCancel: PropTypes.func,
        onIgnore: PropTypes.func,
        showCancel: PropTypes.bool,
        showIgnore: PropTypes.bool,
        ignoreText: PropTypes.string,
        title: PropTypes.string,
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
