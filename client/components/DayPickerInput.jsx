import React from 'react';
import Formsy from 'formsy-react';
import DayPicker, { DateUtils } from 'react-day-picker';
import moment from 'moment';
import 'react-day-picker/lib/style.css';

export const DayPickerInput = React.createClass({
    // Add the Formsy Mixin
    mixins: [Formsy.Mixin],

    handleDayClick(e, day) {
        const range = DateUtils.addDayToRange(day, this.state);
        this.setState(range);
        this.setValue(range);
    },

    handleResetClick(e) {
        e.preventDefault();
        this.setState({ date: { from: null, to: null } });
    },

    render() {
        const { from, to } = this.state;
        return (
            <div>
                { !from && !to && <p>Please select the <strong>first day</strong>.</p> }
                { from && !to && <p>Please select the <strong>last day</strong>.</p> }
                { from && to &&
                    <p>
                        You chose from { moment(from).format('L') } to { moment(to).format('L') }.
                        { ' ' }<a href="#" onClick={ this.handleResetClick }>Reset</a>
                    </p>
                }
                <DayPicker numberOfMonths={ 1 }
                    selectedDays={ day => DateUtils.isDayInRange(day, { from, to }) }
                    onDayClick={ this.handleDayClick } />
            </div>
        );
    }
});
