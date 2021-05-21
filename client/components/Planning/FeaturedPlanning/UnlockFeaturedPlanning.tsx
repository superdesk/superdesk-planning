import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import {Modal} from '../../index';
import {ButtonList} from '../../UI';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {PRIVILEGES, KEYCODES} from '../../../constants';
import {getItemInArrayById, gettext} from '../../../utils';


class UnlockFeaturedPlanningComponent extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.props.handleHide();
        }
    }

    render() {
        const {
            handleHide,
            currentUserId,
            lockUser,
            unlockFeaturedPlanning,
            users,
            privileges,
        } = this.props;

        if (!lockUser) {
            handleHide();
            return null;
        }

        const userName = get(getItemInArrayById(users, lockUser), 'display_name');
        let buttonList = [{
            onClick: handleHide,
            text: gettext('Cancel'),
        }];

        if (privileges[PRIVILEGES.FEATURED_STORIES]) {
            buttonList.push({
                color: 'primary',
                onClick: unlockFeaturedPlanning,
                text: gettext('Unlock'),
            });
        }

        return (
            <Modal show={true} onHide={handleHide}>
                <Modal.Header>
                    <h3 className="modal__heading">{gettext('Featured Stories Locked')}</h3>
                    {<a className="icn-btn" aria-label={gettext('Close')} onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>}
                </Modal.Header>
                <Modal.Body>
                    {currentUserId === lockUser ?
                        gettext('You are currently managing featured story in another session') :
                        gettext(`'${userName}' is currently managing featured stories.`
                        + ' This feature can only be accessed by one user at a time.')}
                </Modal.Body>
                <Modal.Footer>
                    <ButtonList buttonList={buttonList} />
                </Modal.Footer>
            </Modal>
        );
    }
}

UnlockFeaturedPlanningComponent.propTypes = {
    handleHide: PropTypes.func,
    unlockFeaturedPlanning: PropTypes.func.isRequired,
    lockUser: PropTypes.string,
    users: PropTypes.array,
    privileges: PropTypes.object,
    currentUserId: PropTypes.string,
};

const mapStateToProps = (state) => (
    {
        users: selectors.general.users(state),
        currentUserId: selectors.general.currentUserId(state),
        lockUser: selectors.featuredPlanning.featureLockUser(state),
        privileges: selectors.general.privileges(state),
    }
);

const mapDispatchToProps = (dispatch, ownProps) => ({
    unlockFeaturedPlanning: () => {
        ownProps.handleHide();
        return dispatch(actions.planning.featuredPlanning.forceUnlock());
    },
});


export const UnlockFeaturedPlanning = connect(mapStateToProps, mapDispatchToProps)(UnlockFeaturedPlanningComponent);

