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
    const searchQueryTemplateMatches = eventTemplates
        .filter((template) => template.template_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const calendarsFiltered = activeCalendarFilter
        ? [calendars.find(({qcode}) => activeCalendarFilter === qcode)]
        : calendars;

    const filteredTemplates = calendarsFiltered
        .map((_calendar) => ({
            calendar: _calendar,
            templates: searchQueryTemplateMatches
                .filter((template) => template.data.calendars.find(({qcode}) => qcode === _calendar.qcode)),
        }))
        .filter((group) => activeCalendarFilter
            ? group.calendar.qcode === activeCalendarFilter
            : group.templates.length > 0
        );

    return (
        <>
            {filteredTemplates.map(({calendar, templates}) => (
                <React.Fragment key={calendar.qcode}>
                    <Heading type="h6" className="mt-2 mb-1">{calendar.name}</Heading>
                    {
                        templates?.length > 0 ? (
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
            ))}
            {activeCalendarFilter == null && searchQuery && filteredTemplates.length === 0 && (
                <div className="mt-2 mb-1">
                    <BoxedListItem clickable={false}>
                        {gettext('No templates found.')}
                    </BoxedListItem>
                </div>
            )}
        </>
    );
};
