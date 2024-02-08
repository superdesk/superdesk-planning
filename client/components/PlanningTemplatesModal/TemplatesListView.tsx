import {ICalendar, IEventTemplate} from 'interfaces';
import React from 'react';
import {gettext} from 'superdesk-core/scripts/core/utils';
import {Heading, BoxedList, BoxedListItem} from 'superdesk-ui-framework/react';

type ITemplatesListViewProps = {
    closeModal: () => void;
    eventTemplates: Array<IEventTemplate>;
    calendars: Array<ICalendar>;
    activeCalendarFilter?: string;
    searchQuery: string;
    createEventFromTemplate: (template: IEventTemplate) => void;
}

export const TemplatesListView: React.FC<ITemplatesListViewProps> = ({
    eventTemplates,
    calendars,
    closeModal,
    activeCalendarFilter,
    searchQuery,
    createEventFromTemplate,
}: ITemplatesListViewProps) => {
    /**
     * Groups the templates by calendar,
     * filters the templates that match the current search query,
     * if a calendar is selected, the groups that match that calendar are filtered,
     * if not the groups that that don't have any templates are filtered out.
     */
    const filteredTemplates = calendars
        .map((calendar) => ({
            calendar: calendar,
            templates: eventTemplates
                .filter((template) => template.data.calendars.map(({qcode}) => qcode).includes(calendar.qcode))
                .filter((template) => template.template_name.includes(searchQuery))
        }))
        .filter((group) => activeCalendarFilter
            ? group.calendar.qcode === activeCalendarFilter
            : group.templates.length > 0
        );

    return (
        <>
            {
                filteredTemplates.map(({calendar, templates}) => (
                    <React.Fragment key={calendar.qcode}>
                        <Heading type="h6" className="mt-2 mb-1">{calendar.name}</Heading>
                        {
                            templates.length > 0 ? (
                                <BoxedList>
                                    {templates.map((template) => (
                                        <BoxedListItem
                                            key={template._id}
                                            clickable={true}
                                            onClick={() => {
                                                createEventFromTemplate(template);
                                                closeModal();
                                            }}
                                        >
                                            {template.template_name}
                                        </BoxedListItem>
                                    ))}
                                </BoxedList>
                            ) : (
                                <BoxedListItem clickable={false}>
                                    {gettext('No templates available in this calendar group.')}
                                </BoxedListItem>
                            )
                        }

                    </React.Fragment>
                ))
            }
        </>
    );
};
