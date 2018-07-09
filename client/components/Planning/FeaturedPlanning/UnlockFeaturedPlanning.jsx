import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Modal} from '../../index';
import {ButtonList} from '../../UI';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {PRIVILEGES} from '../../../constants';
import {getItemInArrayById} from '../../../utils';


const UnlockFeaturedPlanningComponent = ({handleHide, lockUser, unlockFeaturedPlanning, users, privileges}) => {
    const userName = getItemInArrayById(users, lockUser).display_name;
    let buttonList = [{
        className: 'pull-right',
        onClick: handleHide,
        text: gettext('Cancel'),
    }];

    if (privileges[PRIVILEGES.FEATURED_STORIES]) {
        buttonList.push({
            color: 'primary',
            className: 'pull-right',
            onClick: unlockFeaturedPlanning,
            text: gettext('Unlock'),
        });
    }

    return (
        <Modal show={true} onHide={handleHide}>
            <Modal.Header>
                {<a className="close" onClick={handleHide}>
                    <i className="icon-close-small" />
                </a>}
                <h3>{gettext('Featured Stories Locked')}</h3>
            </Modal.Header>
            <Modal.Body>
                {gettext(`'${userName}' is currently managing featured stories.`
                    + ' This feature can only be accessed by one user at a time.')}
            </Modal.Body>
            <Modal.Footer>
                <ButtonList buttonList={buttonList} />
            </Modal.Footer>
        </Modal>
    );
};

UnlockFeaturedPlanningComponent.propTypes = {
    handleHide: PropTypes.func,
    unlockFeaturedPlanning: PropTypes.func.isRequired,
    lockUser: PropTypes.string,
    users: PropTypes.arry,
    privileges: PropTypes.object,
};

const mapStateToProps = (state) => (
    {
        users: selectors.general.users(state),
        lockUser: selectors.planning.featureLockUser(state),
        privileges: selectors.general.privileges(state),
    }
);

const mapDispatchToProps = (dispatch, ownProps) => ({
    unlockFeaturedPlanning: () => {
        ownProps.handleHide();
        return dispatch(actions.planning.api.unlockFeaturedPlanning());
    },
});


export const UnlockFeaturedPlanning = connect(mapStateToProps, mapDispatchToProps)(UnlockFeaturedPlanningComponent);

