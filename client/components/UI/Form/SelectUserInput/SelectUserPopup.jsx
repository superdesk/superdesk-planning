import React from 'react';
import PropTypes from 'prop-types';

import {KEYCODES} from '../../../../constants';
import {gettext} from '../../../../utils';

import {Popup, Content} from '../../Popup';
import {UserAvatar} from '../../../';

import './style.scss';

export const SelectUserPopup = ({
    onClose,
    target,
    popupContainer,
    users,
    onChange,
}) => (
    <Popup
        close={onClose}
        target={target}
        popupContainer={popupContainer}
        className="user-search__popup"
        noPadding={true}
        onKeyDown={(event) => {
            if (event && event.keyCode === KEYCODES.ENTER) {
                event.preventDefault();
                onChange(users[0]);
            }
        }}
        inheritWidth={true}
    >
        <Content noPadding={true}>
            <ul className="user-search__popup-list">
                {users.length > 0 && users.map((user, index) => (
                    <li key={index} className="user-search__popup-item">
                        <button type="button" onClick={onChange.bind(null, user)}>
                            <UserAvatar user={user} />
                            <div className="user-search__popup-item-label">{user.display_name}</div>
                        </button>
                    </li>
                ))}

                {users.length === 0 && (
                    <li className="user-search__popup-item">
                        <button disabled>
                            <UserAvatar empty={true} initials={false}/>
                            <div className="user-search__popup-item-label">{gettext('No users found')}</div>
                        </button>
                    </li>
                )}
            </ul>
        </Content>
    </Popup>
);

SelectUserPopup.propTypes = {
    onClose: PropTypes.func,
    target: PropTypes.string,
    popupContainer: PropTypes.func,
    users: PropTypes.array,
    onChange: PropTypes.func,
};
