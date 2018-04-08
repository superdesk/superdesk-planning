import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../utils';
import {EVENTS} from '../../constants';
import {Dropdown} from '../UI/SubNav';

export const CalendarSubnavDropdown = ({
    enabledCalendars,
    disabledCalendars,
    selectCalendar,
    currentCalendarId
}) => {
    if (get(enabledCalendars, 'length', 0) <= 0 && get(disabledCalendars, 'length', 0) <= 0) {
        return null;
    }

    const items = [];

    if (get(enabledCalendars, 'length', 0) > 0) {
        enabledCalendars.forEach((calendar) => {
            items.push({
                label: calendar.name,
                id: calendar.qcode,
                action: () => selectCalendar(calendar.qcode)
            });
        });

        items.push({divider: true});
    }

    if (get(disabledCalendars, 'length', 0) > 0) {
        disabledCalendars.forEach((calendar) => {
            items.push({
                label: calendar.name,
                id: calendar.qcode,
                action: () => selectCalendar(calendar.qcode),
                className: 'dropdown__menu-item--disabled'
            });
        });

        items.push({divider: true});
    }

    items.push({
        label: gettext('No Calendar Assigned'),
        action: () => selectCalendar(EVENTS.FILTER.NO_CALENDAR_ASSIGNED)
    });

    items.push({
        label: gettext('All Calendars'),
        action: () => selectCalendar(EVENTS.FILTER.ALL_CALENDARS)
    });

    let buttonLabel;
    let buttonLabelClassName;

    if (currentCalendarId === EVENTS.FILTER.NO_CALENDAR_ASSIGNED) {
        buttonLabel = gettext('No Calendar Assigned');
    } else if (currentCalendarId === EVENTS.FILTER.ALL_CALENDARS) {
        buttonLabel = gettext('All Calendars');
    } else {
        let currentCalendar = enabledCalendars.find((calendar) => calendar.qcode === currentCalendarId);

        // If the current Calendar is not in the enabledCalendars list,
        // then search for it in the disabledCalendars list.
        if (!currentCalendar) {
            currentCalendar = disabledCalendars.find((calendar) => calendar.qcode === currentCalendarId);

            // If the current Calendar is in the disabledCalendars list
            // then set the button class to disabled
            if (currentCalendar) {
                buttonLabelClassName = 'dropdown__menu-item--disabled';
            }
        }

        buttonLabel = get(currentCalendar, 'name', gettext('Select Calendar'));
    }

    return (
        <Dropdown
            buttonLabel={gettext(`Calendar: ${buttonLabel}`)}
            buttonLabelClassName={buttonLabelClassName}
            label={gettext('Calendars')}
            items={items}
        />
    );
};

CalendarSubnavDropdown.propTypes = {
    enabledCalendars: PropTypes.array,
    disabledCalendars: PropTypes.array,
    selectCalendar: PropTypes.func,
    currentCalendarId: PropTypes.string,
};
