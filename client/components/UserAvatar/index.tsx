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
    tooltip?: string;

    /**
     * Defaults to `small`
     */
    size?: 'x-small' | 'small' | 'large';

    /**
     * Defaults to `tooltip`
     */
    displayMode?: 'inline' | 'tooltip';
}

export function getCustomAvatarContent(user: IUser) {
    const AvatarContent = CC.UserAvatar;

    return AvatarContent == null
        ? null
        : (
            <AvatarContent user={user} />
        );
}

export class UserAvatar extends React.PureComponent<IProps> {
    render() {
        const {user} = this.props;
        const size: IProps['size'] = this.props.size ?? 'small';
        const displayMode: IProps['displayMode'] = this.props.displayMode ?? 'tooltip';

        if (user == null) {
            return (
                <AvatarPlaceholder kind="user-icon" size={size} />
            );
        }

        return (
            <Avatar
                imageUrl={user.picture_url}
                displayName={user.display_name}
                initials={getUserInitials(user.display_name)}
                size={size}
                customContent={getCustomAvatarContent(user)}
                nameDisplay={displayMode === 'inline' ? {
                    kind: 'inline',
                    placement: 'start',
                } : {
                    kind: 'tooltip',
                    content: this.props.tooltip,
                }}
            />
        );
    }
}

/**
 * @deprecated use UserAvatar (without margin) instead and handle spacing at the usage level
 */
export class UserAvatarWithMargin extends React.PureComponent<IProps> {
    render() {
        return (
            <div style={{display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '0.6rem'}}>
                <UserAvatar {...this.props} />
            </div>
        );
    }
}
