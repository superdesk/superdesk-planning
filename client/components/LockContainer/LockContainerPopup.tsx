import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {UserAvatar} from '../';
import {Popup, Header, Content, Footer} from '../UI/Popup';
import {Button} from '../UI';

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
                <div>{user.display_name}</div>
            </Content>
            <Footer noBorder={true}>
                {showUnlock && (
                    <Button
                        text={gettext('Unlock')}
                        onClick={unlockItem}
                        expanded={true}
                    />
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