import * as React from 'react';
import moment from 'moment-timezone';
import {getCustomAvatarContent, getUserInitials} from './../../components/UserAvatar';
import * as config from 'appConfig';
import {IPlanningCoverageItem, IG2ContentType, IContactItem, IPlanningConfig} from '../../interfaces';
import {IUser, IDesk} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {
    AvatarGroup,
    ContentDivider,
    Icon,
    WithPopover,
    Avatar,
    AvatarPlaceholder,
    Spacer,
} from 'superdesk-ui-framework/react';
import {IPropsAvatarPlaceholder} from 'superdesk-ui-framework/react/components/avatar/avatar-placeholder';
import {IPropsAvatar} from 'superdesk-ui-framework/react/components/avatar/avatar';
import {trimStartExact} from 'superdesk-core/scripts/core/helpers/utils';
import {getItemWorkflowStateLabel, gettext, planningUtils} from '../../utils';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import './coverage-icons.scss';
import classNames from 'classnames';
import {noop} from 'lodash';

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

export function isAvatarPlaceholder(
    item: Omit<IPropsAvatar, 'size'> | Omit<IPropsAvatarPlaceholder, 'size'>
): item is Omit<IPropsAvatarPlaceholder, 'size'> {
    return (item as any)['kind'] != null;
}

export function getAvatarForCoverage(
    coverage: DeepPartial<IPlanningCoverageItem>,
    users: Array<IUser>,
    contentTypes: Array<IG2ContentType>,
    noIcon: boolean = false,
): Omit<IPropsAvatar, 'size'> | Omit<IPropsAvatarPlaceholder, 'size'> {
    const user = users.find((u) => u._id === coverage.assigned_to?.user);

    const icon: {name: string; color: string} | undefined =
        noIcon === true || coverage.planning?.g2_content_type == null ? undefined : {
            name: trimStartExact(
                planningUtils.getCoverageIcon(
                    planningUtils.getCoverageContentType(
                        coverage,
                        contentTypes,
                    ) || coverage.planning?.g2_content_type,
                    coverage,
                ),
                'icon-',
            ),
            color: planningUtils.getCoverageIconColor(coverage),
        };

    if (user == null) {
        const placeholder: Omit<IPropsAvatarPlaceholder, 'size'> = {
            kind: 'user-icon',
            icon: icon,
            tooltip: gettext('Unassigned'),
        };

        return placeholder;
    } else {
        const statusDotColor = planningUtils.getNewsCoverageStatusDotColor(coverage);

        const avatar: Omit<IPropsAvatar, 'size'> = {
            initials: getUserInitials(user.display_name),
            imageUrl: user.picture_url,
            displayName: user.display_name,
            icon: icon,
            customContent: getCustomAvatarContent(user),
            statusDot: statusDotColor != null ? {color: statusDotColor} : null,
        };

        return avatar;
    }
}

export class CoverageIcons extends React.PureComponent<IProps> {
    render() {
        const {coverages, users} = this.props;
        const {gettext} = superdeskApi.localization;

        return (
            <WithPopover
                placement="auto-end"
                zIndex={1051}
                component={() => (
                    <div className="coverages-popup">
                        <Spacer v gap="16">
                            {this.props.coverages.map((coverage, i) => {
                                const language = coverage.planning?.language ?? getUserInterfaceLanguageFromCV();
                                const desk = this.props.desks.find(
                                    (d) => d._id === coverage.assigned_to?.desk,
                                );
                                const dateFormat = appConfig.planning.dateformat;
                                const timeFormat = appConfig.planning.timeformat;

                                const assignmentStr = desk ?
                                    gettext('Desk: {{ desk }}', {desk: desk.name}) :
                                    gettext('Status: Unassigned');
                                let scheduledStr = coverage.planning?.scheduled != null && dateFormat && timeFormat ?
                                    moment(coverage.planning.scheduled).format(dateFormat + ' ' + timeFormat) :
                                    null;

                                if (coverage._time_to_be_confirmed) {
                                    scheduledStr = moment(coverage.planning.scheduled)
                                        .format(dateFormat + ` @ ${gettext('TBC')}`);
                                }
                                const slugline = coverage.planning?.slugline ?? '';
                                const contentType = getVocabularyItemFieldTranslated(
                                    this.props.contentTypes.find(
                                        (type) => type.qcode === coverage.planning?.g2_content_type
                                    ),
                                    'name',
                                    language
                                );

                                const maybeAvatar = getAvatarForCoverage(
                                    coverage,
                                    users,
                                    this.props.contentTypes,
                                    true,
                                );
                                const state = getItemWorkflowStateLabel(coverage.assigned_to);

                                const iconTooltipInfo: Array<string> = [
                                    gettext('Type: {{ type }}', {type: contentType}),
                                ];

                                if (desk != null) {
                                    iconTooltipInfo.push(gettext('Status: {{ state }}', {state: state.label}));
                                }

                                return (
                                    <Spacer h gap="8" noWrap key={i}>
                                        <Spacer h gap="8" justifyContent="start" noWrap>
                                            <div>
                                                <span
                                                    title={iconTooltipInfo.join(', ')}
                                                >
                                                    <Icon
                                                        size="small"
                                                        name={trimStartExact(
                                                            planningUtils.getCoverageIcon(
                                                                planningUtils.getCoverageContentType(
                                                                    coverage, this.props.contentTypes
                                                                ) || coverage.planning?.g2_content_type,
                                                                coverage,
                                                            ),
                                                            'icon-',
                                                        )}
                                                        color={planningUtils.getCoverageIconColor(coverage)}
                                                    />
                                                </span>
                                            </div>

                                            <div>
                                                <div>
                                                    <span className="coverages-popup__text-light sd-font-size--small">
                                                        {gettext('Due:')}
                                                        <span
                                                            className={classNames(
                                                                'coverages-popup__text-bold',
                                                                'sd-margin-r--1',
                                                                'sd-font-size--x-small'
                                                            )}
                                                        >
                                                            {scheduledStr}
                                                        </span>
                                                    </span>
                                                </div>

                                                {(coverage.scheduled_updates ?? []).map((s) => {
                                                    if (s.planning?.scheduled != null) {
                                                        const scheduledStr2 = dateFormat && timeFormat ?
                                                            moment(s.planning.scheduled)
                                                                .format(dateFormat + ' ' + timeFormat) :
                                                            null;

                                                        return (
                                                            <div>
                                                                <span
                                                                    className={classNames(
                                                                        'coverages-popup__text-light',
                                                                        'sd-font-size--small',
                                                                    )}
                                                                >
                                                                    {gettext('Update Due:')}
                                                                    <span
                                                                        className={classNames(
                                                                            'coverages-popup__text-bold',
                                                                            'sd-margin-r--1',
                                                                            'sd-font-size--x-small',
                                                                        )}
                                                                    >
                                                                        {scheduledStr2}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })}

                                                <Spacer h gap="4" noWrap>
                                                    <div>{assignmentStr}</div>

                                                    <div style={{flexShrink: 1}}>
                                                        <ContentDivider
                                                            margin="x-small"
                                                            orientation="vertical"
                                                            type="dashed"
                                                        />
                                                    </div>

                                                    {!slugline ? null : (
                                                        <div>
                                                            <span className="sd-text__slugline">
                                                                {slugline}
                                                            </span>
                                                        </div>
                                                    )}
                                                </Spacer>
                                            </div>
                                        </Spacer>

                                        <div>
                                            {
                                                isAvatarPlaceholder(maybeAvatar)
                                                    ? (
                                                        <AvatarPlaceholder {...maybeAvatar} size="medium" />
                                                    )
                                                    : (
                                                        <Avatar {...maybeAvatar} size="medium" />
                                                    )
                                            }
                                        </div>
                                    </Spacer>
                                );
                            })}
                        </Spacer>
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
                            items={coverages.map(
                                (coverage) => getAvatarForCoverage(coverage, users, this.props.contentTypes),
                            )}
                            onClick={noop} // can move code from onClick, because event is not available
                        />
                    </div>
                )}
            </WithPopover>
        );
    }
}
