import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {ICalendar, IListFieldProps} from '../../../../interfaces';
import {calendars as getCalendars} from '../../../../selectors/events';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';
import {getVocabularyItemNames} from '../../../../utils/vocabularies';

interface IProps extends IListFieldProps {
    calendars: Array<ICalendar>;
}

const mapStateToProps = (state) => ({
    calendars: getCalendars(state),
});

class PreviewFieldCalendarsComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
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
            <PreviewSimpleListItem
                label={gettext('Calendars:')}
                data={calendarNames.join(', ')}
            />
        );
    }
}

export const PreviewFieldCalendars = connect(mapStateToProps)(PreviewFieldCalendarsComponent);
