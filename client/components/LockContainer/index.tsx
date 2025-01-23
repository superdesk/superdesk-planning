import React from 'react';
import {get} from 'lodash';
import classNames from 'classnames';
import {UserAvatar} from '../../components/UserAvatar';
import {LockContainerPopup} from './LockContainerPopup';

import './style.scss';

interface LockContainerProps {
    lockedUser: any;
    users: any[] | any;
    displayText?: string;
    showUnlock?: boolean;
    onUnlock?: () => void;
    noMargin?: boolean;
}

interface LockContainerState {
    openUnlockPopup: boolean;
}

export class LockContainer extends React.Component<LockContainerProps, LockContainerState> {
    constructor(props: LockContainerProps) {
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
            showUnlock = true,
            onUnlock,
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
                        <UserAvatar user={user} />
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
