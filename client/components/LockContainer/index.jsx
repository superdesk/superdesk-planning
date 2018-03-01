import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {UserAvatar} from '../';
import {LockContainerPopup} from './LockContainerPopup';

import './style.scss';

export class LockContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {openUnlockPopup: false};
        this.toggleOpenUnlockPopup = this.toggleOpenUnlockPopup.bind(this);
    }

    toggleOpenUnlockPopup() {
        this.setState({openUnlockPopup: !this.state.openUnlockPopup});
    }

    render() {
        const {
            lockedUser,
            users,
            displayText,
            showUnlock,
            withLoggedInfo,
            onUnlock,
        } = this.props;

        const user = get(lockedUser, 'display_name') ?
            lockedUser :
            users.find((u) => u._id === lockedUser);

        if (!user) {
            return null;
        }

        return (
            <div className="lock-container">
                <div className="lock-container__avatar lock-avatar">
                    <button
                        type="button"
                        onClick={this.toggleOpenUnlockPopup}
                    >
                        <UserAvatar
                            user={user}
                            withLoggedInfo={withLoggedInfo} />
                    </button>
                </div>
                {this.state.openUnlockPopup &&
                    <LockContainerPopup
                        displayText={displayText}
                        user={user}
                        showUnlock={showUnlock}
                        onCancel={this.toggleOpenUnlockPopup}
                        onUnlock={onUnlock}
                        target="lock-container__avatar"
                    />
                }
            </div>
        );
    }
}

LockContainer.propTypes = {
    lockedUser: PropTypes.object,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    displayText: PropTypes.string,
    showUnlock: PropTypes.bool,
    withLoggedInfo: PropTypes.bool,
    onUnlock: PropTypes.func,
};

LockContainer.defaultProps = {
    showUnlock: true,
    withLoggedInfo: true,
};
