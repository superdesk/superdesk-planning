import {ICalendar, IEventTemplate} from '../../interfaces';
import React from 'react';
import {SearchBar, Modal, Dropdown} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../superdeskApi';
import {TemplatesListView} from './TemplatesListView';

interface IProps {
    closeModal: () => void;
    calendars: Array<ICalendar>;
    eventTemplates: Array<IEventTemplate>;
    createEventFromTemplate(template: IEventTemplate): void;
}

interface IState {
    activeCalendarFilter?: string;
    searchQuery: string;
}

export default class PlanningTemplatesModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            activeCalendarFilter: null,
            searchQuery: '',
        };
    }

    render(): React.ReactNode {
        const {gettext} = superdeskApi.localization;
        const {closeModal, createEventFromTemplate, calendars, eventTemplates} = this.props;
        const allCalendarsLabel = gettext('All Calendars');
        const calendarDropdownItems = [];
        const activeCalendarName = this.props.calendars
            .find((cal) => cal.qcode === this.state.activeCalendarFilter)?.name;
        const dropdownLabel = this.state.activeCalendarFilter
            ? `${gettext('Calendar')}: ${activeCalendarName}`
            : allCalendarsLabel;

        if (this.state.activeCalendarFilter) {
            calendarDropdownItems.push({
                label: allCalendarsLabel,
                onSelect: () => {
                    this.setState({
                        activeCalendarFilter: null,
                    });
                }
            });
        }

        if ((calendars?.length ?? 0) > 0) {
            calendarDropdownItems.push(
                ...calendars.map((calendar) => ({
                    label: calendar.name,
                    onSelect: () => {
                        this.setState({
                            activeCalendarFilter: calendar.qcode,
                        });
                    }
                }))
            );
        }

        return (
            <Modal
                headerTemplate={gettext('Planning templates')}
                visible
                contentPadding="medium"
                contentBg="medium"
                size="medium"
                onHide={closeModal}
            >
                <div className="modal__sticky-header">
                    <SearchBar
                        value={this.state.searchQuery}
                        onSubmit={(value: string) => {
                            this.setState({
                                searchQuery: value,
                            });
                        }}
                        placeholder={gettext('Search templates')}
                        boxed
                    >
                        <Dropdown
                            maxHeight={300}
                            append
                            zIndex={2001}
                            items={calendarDropdownItems}
                        >
                            {dropdownLabel}
                        </Dropdown>
                    </SearchBar>
                    <TemplatesListView
                        calendars={calendars}
                        createEventFromTemplate={createEventFromTemplate}
                        eventTemplates={eventTemplates}
                        searchQuery={this.state.searchQuery}
                        activeCalendarFilter={this.state.activeCalendarFilter}
                        closeModal={closeModal}
                    />
                </div>
            </Modal>
        );
    }
}
