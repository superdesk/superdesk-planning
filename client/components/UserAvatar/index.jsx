import React, { PropTypes } from 'react'
import classNames from 'classnames'
import './style.scss'

export const UserAvatar = ({ user, large, withLoggedInfo, isLoggedIn }) => (
    <figure className={classNames('avatar',
        { 'large' : large },
        'initials',
        'planning__initials',
        { 'avatar-with-info': withLoggedInfo },
        { 'user-logged': isLoggedIn })}>
        <span>{user.display_name.replace(/\W*(\w)\w*/g, '$1').toUpperCase()}</span>
        { withLoggedInfo && <div className='logged-info' /> }
    </figure>
)

UserAvatar.propTypes = {
    user: PropTypes.object.isRequired,
    large: PropTypes.bool,
    withLoggedInfo: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
}
