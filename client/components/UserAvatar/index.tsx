/* eslint-disable react/no-multi-comp */
import React from 'react';
import './style.scss';
import {IUser} from 'superdesk-api';
import {Avatar, AvatarPlaceholder} from 'superdesk-ui-framework/react';
import {CC} from 'superdesk-core/scripts/core/ui/configurable-ui-components';

export function getUserInitials(displayName) {
    return displayName.replace(/\W*(\w)\w*/g, '$1').toUpperCase();
}
interface IProps {
    user: IUser | null;
    tooltip?: string; // TODO: pass to ui-framework, combine with UI framework tooltip
    size?: 'small' | 'large'; // defaults to small
}

export function getCustomAvatarContent(user: IUser) {
    const AvatarContent = CC.UserAvatar;

    return AvatarContent == null
        ? null
        : (
            <AvatarContent user={user} />
        );
}

export class UserAvatarWithoutSpacing extends React.PureComponent<IProps> {
    render() {
        const {user} = this.props;
        const AvatarContent = CC.UserAvatar;

        const size: IProps['size'] = this.props.size ?? 'small';

        if (user == null) {
            return ( // TODO: user kind="empty-circle"
                <AvatarPlaceholder kind="plus-button" size="small" />
            );
        } else {
            return (
                <Avatar
                    imageUrl={user.picture_url}
                    displayName={user.display_name}
                    initials={getUserInitials(user.display_name)}
                    size={size}
                    customContent={AvatarContent == null ? null : <AvatarContent user={user} />}
                />
            );
        }
    }
}

/**
 * @deprecated use UserAvatar (without margin) instead and handle spacing at the usage level
 */
export class UserAvatarWithMargin extends React.PureComponent<IProps> {
    render() {
        return (
            <div style={{display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '0.6rem'}}>
                <UserAvatarWithoutSpacing {...this.props} />
            </div>
        );
    }
}
