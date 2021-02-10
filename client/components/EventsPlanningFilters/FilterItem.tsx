import React from 'react';
import moment from 'moment';

import {getUserInterfaceLanguage} from 'appConfig';
import {PRIVILEGES} from '../../constants';
import {List} from '../UI';
import {ItemActionsMenu} from '../ItemActionsMenu';
import {ISearchFilter, ICalendar, IAgenda} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {renderFieldsForPanel} from '../fields';

interface IProps {
    filter: ISearchFilter;
    privileges: {[key: string]: number};
    editFilter(filter: ISearchFilter): void;
    deleteFilter(filter: ISearchFilter): void;
    calendars: Array<ICalendar>;
    agendas: Array<IAgenda>;
    previewFilter(filter: ISearchFilter): void;
    editFilterSchedule(filter: ISearchFilter): void;
    deleteFilterSchedule(filter: ISearchFilter): void;
}

export class FilterItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.previewFilter = this.previewFilter.bind(this);
        this.editFilter = this.editFilter.bind(this);
        this.deleteFilter = this.deleteFilter.bind(this);
        this.editFilterSchedule = this.editFilterSchedule.bind(this);
    }

    previewFilter() {
        this.props.previewFilter(this.props.filter);
    }

    editFilter() {
        this.props.editFilter(this.props.filter);
    }

    deleteFilter() {
        this.props.deleteFilter(this.props.filter);
    }

    editFilterSchedule() {
        this.props.editFilterSchedule(this.props.filter);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const language = getUserInterfaceLanguage();
        const actions = !this.props.privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT] ?
            [] :
            [{
                icon: 'icon-pencil',
                label: gettext('Edit Filter'),
                callback: this.editFilter,
            }, {
                icon: 'icon-trash',
                label: gettext('Delete'),
                callback: this.deleteFilter,
            }, {
                icon: 'icon-time',
                label: !this.props.filter.schedules?.length ?
                    gettext('Create Scheduled Export') :
                    gettext('Edit Scheduled Export'),
                callback: this.editFilterSchedule,
            }];

        if (actions.length && this.props.filter.schedules?.length) {
            actions.push({
                icon: 'icon-trash',
                label: gettext('Delete Scheduled Export'),
                callback: () => this.props.deleteFilterSchedule(this.props.filter),
            });
        }

        return (
            <List.Item shadow={1} onClick={this.previewFilter}>
                <List.Column>
                    <i className="icon-filter-large" />
                </List.Column>
                <List.Column grow={true} border={false}>
                    <List.Row>
                        {renderFieldsForPanel(
                            'list',
                            {
                                name: {enabled: true, index: 1},
                                item_type: {enabled: true, index: 2},
                            },
                            {
                                item: this.props.filter,
                                language: language,
                            },
                            {}
                        )}
                        <time>{gettext('updated') + ' ' + moment(this.props.filter._updated).fromNow()}</time>
                    </List.Row>
                    <List.Row>
                        {renderFieldsForPanel(
                            'list',
                            {
                                calendars: {enabled: true, index: 1},
                                agendas: {enabled: true, index: 2},
                                place: {enabled: true, index: 2},
                            },
                            {
                                item: this.props.filter.params,
                                language: language,
                            },
                            {}
                        )}
                    </List.Row>
                    <List.Row>
                        {renderFieldsForPanel(
                            'list',
                            {
                                anpa_category: {enabled: true, index: 1},
                                subject: {enabled: true, index: 2},
                            },
                            {
                                item: this.props.filter.params,
                                language: language,
                            },
                            {}
                        )}
                    </List.Row>
                    {!this.props.filter.schedules?.length ? null : (
                        <List.Row>
                            {renderFieldsForPanel(
                                'list',
                                {
                                    filter_schedule: {enabled: true, index: 1},
                                },
                                {
                                    item: this.props.filter,
                                    language: language,
                                },
                                {
                                    filter_schedule: {
                                        editSchedule: this.props.editFilterSchedule,
                                        deleteSchedule: this.props.deleteFilterSchedule,
                                    },
                                }
                            )}
                        </List.Row>
                    )}
                </List.Column>
                {!actions.length ? null : (
                    <List.ActionMenu>
                        <ItemActionsMenu actions={actions} />
                    </List.ActionMenu>
                )}
            </List.Item>
        );
    }
}
