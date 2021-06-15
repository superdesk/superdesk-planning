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

interface IProps {
    coverage: DeepPartial<IPlanningCoverageItem>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    contacts: Dictionary<IContactItem['_id'], IContactItem>;
    tooltipDirection?: 'top' | 'right' | 'bottom' | 'left'; // defaults to 'right'
    iconWrapper?(children: React.ReactNode): React.ReactNode;
}

export class CoverageIcon extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const language = this.props.coverage.planning?.language ??
            config.getUserInterfaceLanguage();
        const user = this.props.users.find(
            (u) => u._id === this.props.coverage.assigned_to?.user,
        );
        const desk = this.props.desks.find(
            (d) => d._id === this.props.coverage.assigned_to?.desk,
        );
        const dateFormat = appConfig.planning.dateformat;
        const timeFormat = appConfig.planning.timeformat;
        let provider = this.props.coverage.assigned_to?.coverage_provider?.name;
        const contactId = this.props.coverage.assigned_to?.contact;

        if (contactId != null && this.props.contacts?.[contactId] != null) {
            const contact = this.props.contacts[contactId];

            provider = contact.first_name ?
                `${contact.last_name}, ${contact.first_name}` :
                contact.organisation;
        }

        const assignmentStr = desk ?
            gettext('Desk: {{ desk }}', {desk: desk.name}) :
            gettext('Status: Unassigned');
        let scheduledStr = this.props.coverage.planning?.scheduled != null && dateFormat && timeFormat ?
            moment(this.props.coverage.planning.scheduled).format(dateFormat + ' ' + timeFormat) :
            null;

        if (this.props.coverage._time_to_be_confirmed != null) {
            scheduledStr = moment(this.props.coverage.planning.scheduled)
                .format(dateFormat + ` @ ${gettext('TBC')}`);
        }
        const state = getItemWorkflowStateLabel(this.props.coverage.assigned_to);
        const genre = getVocabularyItemFieldTranslated(
            this.props.coverage.planning?.genre,
            'name',
            language
        );
        const slugline = this.props.coverage.planning?.slugline ?? '';
        const contentType = getVocabularyItemFieldTranslated(
            this.props.contentTypes.find(
                (type) => type.qcode === this.props.coverage.planning?.g2_content_type
            ),
            'name',
            language
        );
        const icons = (
            <span className="sd-list-item__inline-icon icn-mix sd-list-item__item-type">
                <i
                    className={classNames(
                        planningUtils.getCoverageWorkflowIcon(this.props.coverage),
                        'icn-mix__sub-icn',
                        'icn-mix__sub-icn--gray'
                    )}
                />
                <i
                    className={classNames(
                        planningUtils.getCoverageIcon(
                            planningUtils.getCoverageContentType(this.props.coverage, this.props.contentTypes) ||
                            this.props.coverage.planning?.g2_content_type,
                            this.props.coverage
                        ),
                        planningUtils.getCoverageIconColor(this.props.coverage),
                        'sd-list-item__inline-icon'
                    )}
                />
            </span>
        );
        const ContentWrapper = this.props.iconWrapper != null ?
            this.props.iconWrapper :
            () => icons;

        return (
            <OverlayTrigger
                placement={this.props.tooltipDirection ?? 'right'}
                overlay={(
                    <Tooltip id={this.props.coverage.coverage_id} className="tooltip--text-left">
                        {!contentType?.length ? null : (
                            <span>
                                {gettext('Type: {{ type }}', {type: contentType})}<br />
                            </span>
                        )}
                        {!desk ? null : (
                            <span>
                                {gettext('Status: {{ state }}', {state: state.label})}<br />
                            </span>
                        )}
                        {assignmentStr}
                        {!user ? null : (
                            <span>
                                <br />{gettext('User: {{ user }}', {user: user.display_name})}
                            </span>
                        )}
                        {!provider ? null : (
                            <span>
                                <br />{gettext('Provider: {{ provider }}', {provider: provider})}
                            </span>
                        )}
                        {!genre ? null : (
                            <span>
                                <br />{gettext('Genre: {{ genre }}', {genre: genre})}
                            </span>
                        )}
                        {!slugline ? null : (
                            <span>
                                <br />{gettext('Slugline: {{ slugline }}', {slugline: slugline})}
                            </span>
                        )}
                        {!scheduledStr ? null : (
                            <span>
                                <br />{gettext('Due: {{ date }}', {date: scheduledStr})}
                            </span>
                        )}
                        {(this.props.coverage.scheduled_updates ?? []).map((s) => {
                            if (s.planning?.scheduled != null) {
                                scheduledStr = dateFormat && timeFormat ?
                                    moment(s.planning.scheduled).format(dateFormat + ' ' + timeFormat) :
                                    null;
                                return (
                                    <span>
                                        <br />{gettext('Update Due: {{ date }}', {date: scheduledStr})}
                                    </span>
                                );
                            }

                            return null;
                        })}
                    </Tooltip>
                )}
            >
                {ContentWrapper(icons)}
            </OverlayTrigger>
        );
    }
}
