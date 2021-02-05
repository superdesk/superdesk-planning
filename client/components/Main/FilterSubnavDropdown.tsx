import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {FILTER_TYPE, IAgenda, ICalendar, ISearchFilter} from '../../interfaces';

import {AGENDA, EVENTS, EVENTS_PLANNING, MAIN} from '../../constants';

import {activeFilter, currentSearchFilterId} from '../../selectors/main';
import {calendars, currentCalendarId} from '../../selectors/events';
import {agendas, currentAgendaId} from '../../selectors/planning';
import {combinedViewFilters} from '../../selectors/eventsplanning';

import {Dropdown} from '../UI/SubNav';

interface IDropdownItem {
    id?: string;
    label?: string;
    action?(): void;
    disabled?: boolean;
    icon?: string;
    divider?: boolean;
}

interface IProps {
    currentView: 'COMBINED' | 'EVENTS' | 'PLANNING';
    calendars: Array<ICalendar>;
    agendas: Array<IAgenda>;
    filters: Array<ISearchFilter>;

    currentCalendarId: ICalendar['qcode'];
    currentAgendaId: IAgenda['_id'];
    currentFilterId: ISearchFilter['_id'];
}

const mapStateToProps = (state) => ({
    currentView: activeFilter(state),
    calendars: calendars(state),
    agendas: agendas(state),
    filters: combinedViewFilters(state),

    currentCalendarId: currentCalendarId(state),
    currentAgendaId: currentAgendaId(state),
    currentFilterId: currentSearchFilterId(state),
});

class FilterSubnavDropdownComponent extends React.PureComponent<IProps> {
    getItems(): Array<IDropdownItem> {
        switch (this.props.currentView) {
        case MAIN.FILTERS.COMBINED:
            return this.getCombinedItems();
        case MAIN.FILTERS.EVENTS:
            return this.getEventItems();
        case MAIN.FILTERS.PLANNING:
            return this.getPlanningItems();
        }

        return [];
    }

    getCurrentFilterType(): FILTER_TYPE {
        if (this.props.currentView === MAIN.FILTERS.EVENTS) {
            return FILTER_TYPE.EVENTS;
        } else if (this.props.currentView === MAIN.FILTERS.PLANNING) {
            return FILTER_TYPE.PLANNING;
        }

        return FILTER_TYPE.COMBINED;
    }

    getSearchFilters(): Array<IDropdownItem> {
        const filterType = this.getCurrentFilterType();

        const filters = (this.props.filters ?? []).filter((filter) => (
            filter.item_type === filterType
        ));

        return filters.map((filter) => ({
            label: filter.name,
            id: filter._id,
            action: () => planningApi.ui.list.changeFilterId(filter._id),
        }));
    }

    getCombinedItems() {
        const {gettext} = superdeskApi.localization;

        return [
            {
                label: gettext('All Events & Planning'),
                action: () => planningApi.ui.list.changeFilterId(EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING),
            }
        ];
    }

    getEventItems() {
        const {gettext} = superdeskApi.localization;

        const items: Array<IDropdownItem> = [{
            label: gettext('All Events'),
            action: () => planningApi.ui.list.changeCalendarId(EVENTS.FILTER.ALL_CALENDARS),
        }, {
            label: gettext('No Calendar Assigned'),
            action: () => planningApi.ui.list.changeCalendarId(EVENTS.FILTER.NO_CALENDAR_ASSIGNED),
        }];

        const enabledCalendars = (this.props.calendars ?? []).filter(
            (calendar) => calendar.is_active
        );

        const disabledCalendars = (this.props.calendars ?? []).filter(
            (calendar) => !calendar.is_active
        );

        if (enabledCalendars.length) {
            items.push({divider: true});
            enabledCalendars.forEach(
                (calendar) => {
                    items.push({
                        label: calendar.name,
                        id: calendar.qcode,
                        action: () => planningApi.ui.list.changeCalendarId(calendar.qcode),
                    });
                }
            );
        }

        if (disabledCalendars.length) {
            items.push({divider: true});
            disabledCalendars.forEach(
                (calendar) => {
                    items.push({
                        label: calendar.name,
                        id: calendar.qcode,
                        action: () => planningApi.ui.list.changeCalendarId(calendar.qcode),
                        disabled: true,
                        icon: 'icon-lock',
                    });
                }
            );
        }

        return items;
    }

    getPlanningItems() {
        const {gettext} = superdeskApi.localization;

        const items: Array<IDropdownItem> = [{
            label: gettext('All Planning Items'),
            action: () => planningApi.ui.list.changeAgendaId(AGENDA.FILTER.ALL_PLANNING),
        }, {
            label: gettext('No Agenda Assigned'),
            action: () => planningApi.ui.list.changeAgendaId(AGENDA.FILTER.NO_AGENDA_ASSIGNED),
        }];

        const enabledAgenads = (this.props.agendas ?? []).filter(
            (agenda) => agenda.is_enabled
        );
        const disabledAgenads = (this.props.agendas ?? []).filter(
            (agenda) => !agenda.is_enabled
        );

        if (enabledAgenads.length) {
            items.push({divider: true});
            enabledAgenads.forEach(
                (agenda) => {
                    items.push({
                        label: agenda.name,
                        id: agenda._id,
                        action: () => planningApi.ui.list.changeAgendaId(agenda._id),
                    });
                }
            );
        }

        if (disabledAgenads.length) {
            items.push({divider: true});
            disabledAgenads.forEach(
                (agenda) => {
                    items.push({
                        label: agenda.name,
                        id: agenda._id,
                        action: () => planningApi.ui.list.changeAgendaId(agenda._id),
                        disabled: true,
                        icon: 'icon-lock',
                    });
                }
            );
        }

        return items;
    }

    getButtonProps(): {label: string, disabled: boolean} {
        const {gettext} = superdeskApi.localization;
        const filterType = this.getCurrentFilterType();
        let label;
        let disabled = false;

        const currentFilter = this.props.filters.find(
            (filter) => (
                filter._id === this.props.currentFilterId &&
                filter.item_type === filterType
            )
        );

        if (this.props.currentView === MAIN.FILTERS.COMBINED) {
            label = currentFilter?.name ?? gettext('All Events & Planning');
        } else if (this.props.currentView === MAIN.FILTERS.EVENTS) {
            if (currentFilter?.name != undefined) {
                label = currentFilter.name;
            } else if (this.props.currentCalendarId === EVENTS.FILTER.NO_CALENDAR_ASSIGNED) {
                label = gettext('No Calendar Assigned');
            } else if (this.props.currentCalendarId === EVENTS.FILTER.ALL_CALENDARS) {
                label = gettext('All Events');
            } else {
                const currentCalendar = this.props.calendars.find(
                    (calendar) => calendar.qcode === this.props.currentCalendarId
                );

                label = currentCalendar?.name ?? gettext('Select Calendar');
                disabled = !currentCalendar?.is_active;
            }
        } else if (this.props.currentView === MAIN.FILTERS.PLANNING) {
            if (currentFilter?.name != undefined) {
                label = currentFilter.name;
            } else if (this.props.currentAgendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED) {
                label = gettext('No Agenda Assigned');
            } else if (this.props.currentAgendaId === AGENDA.FILTER.ALL_PLANNING) {
                label = gettext('All Planning Items');
            } else {
                const currentAgenda = this.props.agendas.find(
                    (agenda) => agenda._id === this.props.currentAgendaId
                );

                label = currentAgenda?.name ?? gettext('Select Agenda');
                disabled = !currentAgenda?.is_enabled;
            }
        }

        return {label, disabled};
    }

    render() {
        const items = this.getItems();
        const buttonProps = this.getButtonProps();
        const filters = this.getSearchFilters();

        if (filters.length) {
            items.push({divider: true});
            items.push(...filters);
        }

        return (
            <Dropdown
                buttonLabelClassName={buttonProps.disabled ? 'dropdown__menu-item--disabled' : ''}
                buttonLabel={buttonProps.label}
                items={items}
                scrollable={true}
            />
        );
    }
}

export const FilterSubnavDropdown = connect(mapStateToProps)(FilterSubnavDropdownComponent);
