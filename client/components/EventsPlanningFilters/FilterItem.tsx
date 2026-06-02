import React from 'react';
import moment from 'moment';

import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {PRIVILEGES} from '../../constants';
import {List} from '../UI';
import {ItemActionsMenu} from '../ItemActionsMenu';
import {ISearchFilter, ICalendar, IAgenda} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {renderFieldsForPanel} from '../fields';

interface IProps {
    filter: ISearchFilter;
    agendas: Array<IAgenda>;
    calendars: Array<ICalendar>;
    privileges: {[key: string]: number};
    activeFilterId?: ISearchFilter['_id'];
    editFilter(filter: ISearchFilter): void;
    deleteFilter(filter: ISearchFilter): void;
    previewFilter(filter: ISearchFilter): void;
    editFilterSchedule(filter: ISearchFilter): void;
    deleteFilterSchedule(filter: ISearchFilter): void;
}

export class FilterItem extends React.PureComponent<IProps> {
    private clickTimeout: number | null = null;
    private clickDelay: number = 250;

    constructor(props: IProps) {
        super(props);

        this.previewFilter = this.previewFilter.bind(this);
        this.editFilter = this.editFilter.bind(this);
        this.deleteFilter = this.deleteFilter.bind(this);
        this.editFilterSchedule = this.editFilterSchedule.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
    }

    componentWillUnmount() {
        if (this.clickTimeout != null) {
            window.clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
    }

    handleClick(event: React.MouseEvent<HTMLLIElement>) {
        event.preventDefault();

        if (this.clickTimeout != null) {
            window.clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }

        this.clickTimeout = window.setTimeout(() => {
            this.clickTimeout = null;
            this.previewFilter();
        }, this.clickDelay);
    }

    handleDoubleClick(event: React.MouseEvent<HTMLLIElement>) {
        event.preventDefault();

        if (this.clickTimeout != null) {
            window.clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }

        this.editFilter();
    }

    previewFilter() {
        this.props.previewFilter?.(this.props.filter);
    }

    editFilter() {
        this.props.editFilter?.(this.props.filter);
    }

    deleteFilter() {
        this.props.deleteFilter(this.props.filter);
    }

    editFilterSchedule() {
        this.props.editFilterSchedule(this.props.filter);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const language = getUserInterfaceLanguageFromCV();
        let actions = [];

        if (this.props.privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT]) {
            actions = [{
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
        }

        if (actions.length && this.props.filter.schedules?.length) {
            actions.push({
                icon: 'icon-trash',
                label: gettext('Delete Scheduled Export'),
                callback: () => this.props.deleteFilterSchedule(this.props.filter),
            });
        }

        return (
            <List.Item
                shadow={1}
                onClick={this.handleClick}
                onDoubleClick={this.handleDoubleClick}
                activated={this.props.activeFilterId === this.props.filter._id}
            >
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
                    {(this.props.filter.schedules?.length ?? 0) > 0 && (
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
