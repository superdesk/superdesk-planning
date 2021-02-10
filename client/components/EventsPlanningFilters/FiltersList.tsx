import React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../superdeskApi';
import {IAgenda, ICalendar, ISearchFilter} from '../../interfaces';

import {calendars} from '../../selectors/events';
import {agendas} from '../../selectors/planning';
import {combinedViewFilters} from '../../selectors/eventsplanning';

import {List} from '../UI';
import {FilterItem} from './FilterItem';

interface IProps {
    privileges: {[key: string]: number};
    editFilter(filter: ISearchFilter): void;
    deleteFilter(filter: ISearchFilter): void;
    previewFilter(filter: ISearchFilter): void;
    editFilterSchedule(filter: ISearchFilter): void;
    deleteFilterSchedule(filter: ISearchFilter): void;

    filters: Array<ISearchFilter>;
    calendars: Array<ICalendar>;
    agendas: Array<IAgenda>;
}

const mapStateToProps = (state) => ({
    filters: combinedViewFilters(state),
    calendars: calendars(state),
    agendas: agendas(state),
});

export class FiltersListComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            filters,
            privileges,
            deleteFilter,
            editFilter,
            calendars,
            agendas,
            previewFilter,
            editFilterSchedule,
            deleteFilterSchedule,
        } = this.props;

        return (
            <List.Group spaceBetween={true}>
                {!filters.length ? (
                    <span>{gettext('There are no events and planing view filters.')}</span>
                ) : (
                    filters.map((filter) => (
                        <FilterItem
                            filter={filter}
                            privileges={privileges}
                            editFilter={editFilter}
                            deleteFilter={deleteFilter}
                            key={filter._id}
                            calendars={calendars}
                            agendas={agendas}
                            previewFilter={previewFilter}
                            editFilterSchedule={editFilterSchedule}
                            deleteFilterSchedule={deleteFilterSchedule}
                        />
                    ))
                )}
            </List.Group>
        );
    }
}

export const FiltersList = connect(mapStateToProps)(FiltersListComponent);
