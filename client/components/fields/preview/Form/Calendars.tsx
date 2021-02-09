import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps, ICalendar} from '../../../../interfaces';
import {calendars as getCalendars} from '../../../../selectors/events';

import {FormPreviewItem} from './FormPreviewItem';
import {getVocabularyItemNames} from '../../../../utils/vocabularies';

interface IProps extends IListFieldProps {
    calendars: Array<ICalendar>;
}

const mapStateToProps = (state) => ({
    calendars: getCalendars(state),
});

class FormPreviewCalendarsComponent extends React.PureComponent<IProps> {
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

        return (
            <FormPreviewItem
                label={gettext('Calendars')}
                value={calendarNames.join(', ')}
                light={true}
            />
        );
    }
}

export const FormPreviewCalendars = connect(mapStateToProps)(FormPreviewCalendarsComponent);
