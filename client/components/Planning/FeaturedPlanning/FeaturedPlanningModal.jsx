import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Modal} from '../../index';
import {Button} from '../../UI';
import * as actions from '../../../actions';

const FeaturedPlanningModalComponent = ({handleHide, actionInProgress, unlockFeaturedPlanning}) => {
    const onCloseModal = () => {
        handleHide();
        unlockFeaturedPlanning();
    };

    return (
        <Modal show={true} fill={true} onHide={onCloseModal}>
            <Modal.Header>
                {!actionInProgress && <a className="close" onClick={onCloseModal}>
                    <i className="icon-close-small" />
                </a>}
                <h3>{gettext('Featured Stories')}</h3>
            </Modal.Header>
            <Modal.Body />
            <Modal.Footer>
                <Button
                    text={gettext('Cancel')}
                    disabled={actionInProgress}
                    onClick={onCloseModal}
                />
            </Modal.Footer>
        </Modal>
    );
};

FeaturedPlanningModalComponent.propTypes = {
    actionInProgress: PropTypes.bool,
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.object,
    unlockFeaturedPlanning: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    unlockFeaturedPlanning: () => dispatch(actions.planning.api.unlockFeaturedPlanning()),
});


export const FeaturedPlanningModal = connect(null, mapDispatchToProps)(FeaturedPlanningModalComponent);
