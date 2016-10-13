import React from 'react';
import Formsy from 'formsy-react';
import { DateField, DatePicker } from 'react-date-picker';
import 'react-date-picker/index.css';
import moment from 'moment';

export const DayPickerInput = React.createClass({
    // Add the Formsy Mixin
    mixins: [Formsy.Mixin],

    onChange(dateString, { dateMoment }) {
        this.setValue(dateMoment);
    },

    render() {
        let defaultDate = this.props.defaultValue ? moment(this.props.defaultValue) : null;
        return (
            <DateField
                onChange={this.onChange}
                updateOnDateClick={true}
                collapseOnDateClick={true}
                defaultValue={defaultDate}
                dateFormat="YYYY-MM-DD HH:mm a">
                <DatePicker
                    navigation={true}
                    locale="en"
                    forceValidDate={true}
                    highlightWeekends={true}
                    highlightToday={true}
                    weekNumbers={true}
                    weekStartDay={1}
                />
            </DateField>
        );
    }
});
