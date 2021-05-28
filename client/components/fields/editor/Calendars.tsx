import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {ICalendar, IEditorFieldProps} from '../../../interfaces';
import {enabledCalendars} from '../../../selectors/events';

interface IProps extends IEditorFieldProps {
    calendars: Array<ICalendar>;
}

const mapStateToProps = (state) => ({
    calendars: enabledCalendars(state),
});

export class EditorFieldCalendarsComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                {...this.props}
                field={this.props.field ?? 'calendars'}
                label={this.props.label ?? gettext('Calendars')}
                options={this.props.calendars}
                defaultValue={[]}
            />
        );
    }
}

export const EditorFieldCalendars = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldCalendarsComponent);
