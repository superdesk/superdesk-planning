import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {UserAvatar} from '../';
import {Popup, Header, Content, Footer} from '../UI/Popup';

import './style.scss';

export const LockContainerPopup = ({
    user,
    showUnlock,
    onCancel,
    onUnlock,
    displayText,
    target,
}) => {
    const unlockItem = () => onUnlock() && onCancel();

    return (
        <Popup
            close={onCancel}
            target={target}
            className="lock-container__popup"
            noPadding={true}
        >
            <Header
                text={displayText || 'Locked By:'}
                onClose={onCancel}
                centerText={true}
                noBorder={true}
            />
            <Content>
                <UserAvatar user={user} large={true} />
                <div className="lock-text">{user.display_name}</div>
            </Content>
            <Footer noBorder={true}>
                {showUnlock && (
                    <button className="btn btn--medium" onClick={unlockItem}>
                        {gettext('Unlock')}
                    </button>
                )}
            </Footer>
        </Popup>
    );
};

LockContainerPopup.propTypes = {
    user: PropTypes.object.isRequired,
    showUnlock: PropTypes.bool,
    onCancel: PropTypes.func,
    onUnlock: PropTypes.func,
    displayText: PropTypes.string,
    target: PropTypes.string,
};

LockContainerPopup.defaultProps = {displayText: 'Locked by:'};