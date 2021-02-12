import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {ICalendar, IListFieldProps} from '../../../interfaces';
import {calendars as getCalendars} from '../../../selectors/events';

import {getVocabularyItemNames} from '../../../utils/vocabularies';

interface IHocProps extends IListFieldProps {
    calendars: Array<ICalendar>;
}

const mapStateToProps = (state) => ({
    calendars: getCalendars(state),
});

export interface ICalendarPreviewProps extends IHocProps{
    calendarNames: string;
}

export function calendarPreviewHoc<T extends ICalendarPreviewProps>(Component: React.ComponentType<T>) {
    class HOC extends React.PureComponent<IHocProps> {
        render() {
            // Remove `calendars` from `props`
            const {
                calendars,
                ...props
            } = this.props;

            // Construct the array of names using calendars from the redux store
            const field = this.props.field ?? 'calendars';
            const calendarNames = getVocabularyItemNames(
                get(this.props.item, field) || [],
                this.props.calendars,
                'qcode',
                'name',
                this.props.language
            );

            if (!calendarNames.length) {
                return null;
            }

            return (
                <Component
                    calendarNames={calendarNames.join(', ')}
                    {...this.props as T}
                />
            );
        }
    }

    return connect(mapStateToProps)(HOC);
}
