import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import {UserAvatar, UnlockItem} from '../';
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
            <div className={classNames(
                'LockContainer',
                'dropdown',
                'dropdown--dropright',
                {open: this.state.openUnlockPopup}
            )} >
                <div className="lock-avatar">
                    <button
                        type="button"
                        onClick={this.toggleOpenUnlockPopup} >
                        <UserAvatar
                            user={user}
                            withLoggedInfo={withLoggedInfo} />
                    </button>
                    {this.state.openUnlockPopup &&
                        <UnlockItem
                            displayText={displayText}
                            user={user}
                            showUnlock={showUnlock}
                            onCancel={this.toggleOpenUnlockPopup}
                            onUnlock={onUnlock}
                        />
                    }
                </div>
            </div>
        );
    }
}

LockContainer.propTypes = {
    lockedUser: PropTypes.object.isRequired,
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
