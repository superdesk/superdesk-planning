import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {ICalendar, IListFieldProps} from '../../../interfaces';
import {calendars as Calendars} from '../calendars';
import {calendars} from '../../../selectors/events';

interface IProps extends IListFieldProps {
    calendars: Array<ICalendar>;
}

const mapStateToProps = (state) => ({
    calendars: calendars(state),
});

class ListFieldCalendarsComponent extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field ?? 'calendars';
        const calendars = get(this.props.item, field) || [];

        if (calendars.length > 0) {
            return (
                <Calendars
                    item={this.props.item}
                    calendars={this.props.calendars}
                    field={field}
                    language={this.props.language}
                />
            );
        }

        return null;
    }
}

export const ListFieldCalendars = connect(mapStateToProps)(ListFieldCalendarsComponent);
