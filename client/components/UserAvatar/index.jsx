import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import './style.scss';

export const UserAvatar = ({user, small, large, withLoggedInfo, isLoggedIn, noMargin, initials, empty, tooltip}) => {
    if (((user && user.display_name) || empty)) {
        const avatar = (<figure className={classNames('avatar',
            {
                'avatar--large': large,
                'avatar--small': small && !large,
                'avatar--no-margin': noMargin,
                initials: initials,
                planning__initials: initials,
                'avatar-with-info': withLoggedInfo,
                'user-logged': isLoggedIn,
                'avatar--empty': empty,
            })} >
            {user && user.display_name && user.display_name.replace(/\W*(\w)\w*/g, '$1').toUpperCase()}
            { withLoggedInfo && <div className="logged-info" /> }
        </figure>);

        if (tooltip) {
            return (<OverlayTrigger placement="left" overlay={<Tooltip id="user_name">{tooltip}</Tooltip>}>
                {avatar}
            </OverlayTrigger>);
        }

        return avatar;
    }

    return null;
};

UserAvatar.propTypes = {
    user: PropTypes.object,
    small: PropTypes.bool,
    large: PropTypes.bool,
    withLoggedInfo: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
    noMargin: PropTypes.bool,
    initials: PropTypes.bool,
    empty: PropTypes.bool,
    tooltip: PropTypes.string,
};

UserAvatar.defaultProps = {
    small: true,
    noMargin: false,
    initials: true,
    empty: false,
};
