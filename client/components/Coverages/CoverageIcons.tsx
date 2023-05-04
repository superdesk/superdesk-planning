import * as React from 'react';
import classNames from 'classnames';
import moment from 'moment-timezone';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import * as config from 'appConfig';
import {IPlanningCoverageItem, IG2ContentType, IContactItem, IPlanningConfig} from '../../interfaces';
import {IUser, IDesk} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
const appConfig = config.appConfig as IPlanningConfig;

import {getItemWorkflowStateLabel, planningUtils} from '../../utils';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {AvatarGroup} from 'superdesk-ui-framework/react';
import {IAvatarPlaceholderInGroup} from 'superdesk-ui-framework/react/components/avatar/avatar-group';
import {IPropsAvatarPlaceholder} from 'superdesk-ui-framework/react/components/avatar/avatar-placeholder';
import {IPropsAvatar} from 'superdesk-ui-framework/react/components/avatar/avatar';

interface IProps {
    coverages: Array<DeepPartial<IPlanningCoverageItem>>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    contacts?: Dictionary<IContactItem['_id'], IContactItem>;
    tooltipDirection?: 'top' | 'right' | 'bottom' | 'left'; // defaults to 'right'
    iconWrapper?(children: React.ReactNode): React.ReactNode;
}

function getUserInitials(displayName) {
    return 'TD';
}

export function isAvatarPlaceholder(
    item: Omit<IPropsAvatar, 'size'> | Omit<IPropsAvatarPlaceholder, 'size'>
): item is Omit<IPropsAvatarPlaceholder, 'size'> {
    return (item as any)['kind'] != null;
}

export function getAvatarForCoverage(
    coverage: DeepPartial<IPlanningCoverageItem>,
    users: Array<IUser>,
): Omit<IPropsAvatar, 'size'> | Omit<IPropsAvatarPlaceholder, 'size'> {
    const user = users.find((u) => u._id === coverage.assigned_to?.user);

    if (user == null) {
        const placeholder: Omit<IPropsAvatarPlaceholder, 'size'> = {
            kind: 'plus-button',
        };

        return placeholder;
    } else {
        const avatar: Omit<IPropsAvatar, 'size'> = {
            initials: getUserInitials(user.display_name),
            imageUrl: user.picture_url,
            tooltip: user.display_name?.length > 0 ? user.display_name : null,
            icon: coverage.planning?.g2_content_type == null ? undefined : {
                name: coverage.planning.g2_content_type,
                color: 'red', // TODO: fix color
                // color: trimStartExact(
                //     planningUtils.getCoverageIconColor(coverage),
                //     'icon--'
                // ),
            }, //
        };

        return avatar;
    }
}

export class CoverageIcons extends React.PureComponent<IProps> {
    render() {
        const {coverages, users} = this.props;

        return (
            <AvatarGroup
                size="small"
                items={coverages.map((coverage) => getAvatarForCoverage(coverage, users))}
            />
        );
    }
}
