import * as React from 'react';
import moment from 'moment-timezone';
import {getUserInitials} from './../../components/UserAvatar';
import * as config from 'appConfig';
import {IPlanningCoverageItem, IG2ContentType, IContactItem, IPlanningConfig} from '../../interfaces';
import {IUser, IDesk} from 'superdesk-api';
import {gettext} from 'superdesk-core/scripts/core/utils';
import {AvatarGroup, ContentDivider, Icon, WithPopover} from 'superdesk-ui-framework/react';
import {IPropsAvatarPlaceholder} from 'superdesk-ui-framework/react/components/avatar/avatar-placeholder';
import {IPropsAvatar} from 'superdesk-ui-framework/react/components/avatar/avatar';
import {trimStartExact} from 'superdesk-core/scripts/core/helpers/utils';
import {planningUtils} from '../../utils';

interface IProps {
    coverages: Array<DeepPartial<IPlanningCoverageItem>>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    contacts?: Dictionary<IContactItem['_id'], IContactItem>;
    tooltipDirection?: 'top' | 'right' | 'bottom' | 'left'; // defaults to 'right'
    iconWrapper?(children: React.ReactNode): React.ReactNode;
}

const appConfig = config.appConfig as IPlanningConfig;
const dateFormat = appConfig.planning.dateformat;
const timeFormat = appConfig.planning.timeformat;

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
                color: trimStartExact(
                    planningUtils.getCoverageIconColor(coverage),
                    'icon--'
                ),
            },
        };

        return avatar;
    }
}

export class CoverageIcons extends React.PureComponent<IProps> {
    render() {
        const {coverages, users} = this.props;

        return (
            <WithPopover
                placement="bottom-end"
                component={({closePopup}) => (
                    <div className="avatar-popup__wrapper">
                        <ul className="avatar-popup__list">
                            {this.props.coverages.map((coverage, i) => {
                                let scheduledStr = coverage.planning?.scheduled != null && dateFormat && timeFormat
                                    ? moment(coverage.planning.scheduled).format(dateFormat + ' ' + timeFormat)
                                    : null;

                                if (coverage._time_to_be_confirmed) {
                                    scheduledStr = moment(coverage.planning.scheduled)
                                        .format(dateFormat + ` @ ${gettext('TBC')}`);
                                }

                                const user = users.find(
                                    (u) => u._id === coverage.assigned_to?.user,
                                );

                                const desk = this.props.desks.find(
                                    (d) => d._id === coverage.assigned_to?.desk,
                                );

                                const slugline = coverage.planning?.slugline ?? '';

                                return (
                                    <li className="avatar-popup__item" key={i}>
                                        <div className="avatar-popup-icon">
                                            <Icon
                                                size="small"
                                                name={trimStartExact(planningUtils.getCoverageIcon(
                                                    planningUtils.getCoverageContentType(
                                                        coverage, this.props.contentTypes
                                                    )
                                                    || coverage.planning?.g2_content_type, coverage
                                                ), 'icon-')}
                                                color={trimStartExact(
                                                    planningUtils.getCoverageIconColor(coverage), 'icon--')
                                                }
                                            />
                                        </div>

                                        <div className="avatar-popup-content">
                                            <div>
                                                <span className="avatar-popup__text-light">
                                                    {gettext('Due:')}
                                                    <span className="avatar-popup__text-bold">
                                                        {scheduledStr}
                                                    </span>
                                                </span>
                                            </div>

                                            <div className="avatar-popup-content-bottom">
                                                {!desk ? null : (
                                                    <span className="avatar-popup__text-light">
                                                        {gettext('Due:')}
                                                        <span className="avatar-popup__text-bold">
                                                            {desk.desk_type}
                                                        </span>
                                                    </span>
                                                )}

                                                <ContentDivider margin="x-small" orientation="vertical" type="dashed" />

                                                {!slugline ? null : (
                                                    <span className="sd-text__slugline">
                                                        {gettext('{{ slugline }}', {slugline})}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <AvatarGroup
                                            size="medium"
                                            max={4}
                                            items={[
                                                {
                                                    initials: user == null ? null : getUserInitials(user.display_name),
                                                    imageUrl: user == null ? null : user.picture_url,
                                                    tooltip: user == null ? null : user.display_name,
                                                    kind: user == null ? 'plus-button' : null,
                                                }
                                            ]}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            >
                {(onToggle) => (
                    <div
                        data-test-id="coverage-icons"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle(event.target as HTMLElement);
                        }}
                    >
                        <AvatarGroup
                            size="small"
                            items={coverages.map((coverage) => getAvatarForCoverage(coverage, users))}
                        />
                    </div>
                )}
            </WithPopover>
        );
    }
}
