import React from 'react';
import moment from 'moment';

import {PRIVILEGES} from '../../constants';
import {List} from '../UI';
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
}

export class FilterItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.previewFilter = this.previewFilter.bind(this);
        this.editFilter = this.editFilter.bind(this);
        this.deleteFilter = this.deleteFilter.bind(this);
    }

    previewFilter() {
        this.props.previewFilter(this.props.filter);
    }

    editFilter(event) {
        event.stopPropagation();
        this.props.editFilter(this.props.filter);
    }

    deleteFilter() {
        this.props.deleteFilter(this.props.filter);
    }

    render() {
        const {gettext} = superdeskApi.localization;

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
                                item: this.props.filter.params
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
                                item: this.props.filter.params
                            },
                            {}
                        )}
                    </List.Row>
                </List.Column>
                {!!this.props.privileges[PRIVILEGES.EVENTS_PLANNING_FILTERS_MANAGEMENT] && (
                    <List.ActionMenu>
                        {this.props.editFilter && (
                            <button
                                onClick={this.editFilter}
                                className="dropdown__toggle"
                                data-sd-tooltip={gettext('Edit Filter')}
                                data-flow="left"
                            >
                                <i className="icon-pencil" />
                            </button>
                        )}
                        <button
                            onClick={this.deleteFilter}
                            className="dropdown__toggle"
                            data-sd-tooltip={gettext('Delete Filter')}
                            data-flow="left"
                        >
                            <i className="icon-trash" />
                        </button>
                    </List.ActionMenu>
                )}
            </List.Item>
        );
    }
}
