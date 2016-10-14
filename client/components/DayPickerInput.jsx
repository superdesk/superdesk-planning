import React from 'react';
import Formsy from 'formsy-react';
import { DateField, DatePicker } from 'react-date-picker';
import 'react-date-picker/index.css';
import moment from 'moment';

// We don't use the ES6 class because we need here support for mixins
// see: https://facebook.github.io/react/docs/reusable-components.html#mixins
export const DayPickerInput = React.createClass({
    // Add the Formsy Mixin
    mixins: [Formsy.Mixin],

    getInitialState() {
        let defaultDate = this.props.defaultValue ? moment(this.props.defaultValue) : undefined;
        return { defaultDate };
    },

    onChange(dateString, { dateMoment }) {
        this.setValue(dateMoment ? dateMoment : undefined);
    },

    componentDidMount() {
        // after first render, set value of the form input
        if (this.state.defaultDate) {
            this.setValue(this.state.defaultDate);
        }
    },

    render() {
        return (
            <DateField
                onChange={this.onChange}
                updateOnDateClick={true}
                collapseOnDateClick={true}
                defaultValue={this.state.defaultDate}
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
