import React, { PropTypes } from 'react'
import classNames from 'classnames'
import './style.scss'

export const UserAvatar = ({ user, large, withLoggedInfo, isLoggedIn, noMargin, initials }) => (
    (user && user.display_name) ?
        <figure className={classNames('avatar',
            { 'avatar--large': large },
            { 'avatar--small': !large },
            { 'avatar--no-margin': noMargin },
            { initials: initials },
            { planning__initials: initials },
            { 'avatar-with-info': withLoggedInfo },
            { 'user-logged': isLoggedIn })}>
            {user.display_name.replace(/\W*(\w)\w*/g, '$1').toUpperCase()}
            { withLoggedInfo && <div className='logged-info' /> }
        </figure> :
        null
)

UserAvatar.propTypes = {
    user: PropTypes.object.isRequired,
    large: PropTypes.bool,
    withLoggedInfo: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
    noMargin: PropTypes.bool,
    initials: PropTypes.bool,
}

UserAvatar.defaultProps = {
    noMargin: false,
    initials: true,
}
