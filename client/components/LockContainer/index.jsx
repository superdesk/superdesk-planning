import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import classNames from 'classnames';

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
            small,
            noMargin,
        } = this.props;

        const user = get(lockedUser, 'display_name') ?
            lockedUser :
            users.find((u) => u._id === lockedUser);

        if (!user) {
            return null;
        }

        return (
            <div className="lock-container">
                <div
                    className={classNames(
                        'lock-container__avatar',
                        'lock-avatar',
                        {'lock-container__avatar--no-margin': noMargin}
                    )}
                >
                    <a onClick={this.toggleOpenUnlockPopup}>
                        <UserAvatar
                            user={user}
                            withLoggedInfo={withLoggedInfo}
                            small={small}
                        />
                    </a>
                </div>
                {this.state.openUnlockPopup && (
                    <LockContainerPopup
                        displayText={displayText}
                        user={user}
                        showUnlock={showUnlock}
                        onCancel={this.toggleOpenUnlockPopup}
                        onUnlock={onUnlock}
                        target="lock-container__avatar"
                    />
                )}
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
    small: PropTypes.bool,
    noMargin: PropTypes.bool,
};

LockContainer.defaultProps = {
    showUnlock: true,
    withLoggedInfo: true,
    small: true,
};
