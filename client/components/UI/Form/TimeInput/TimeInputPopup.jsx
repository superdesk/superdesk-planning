import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {range} from 'lodash';
import {Popup} from '../../';
import './style.scss';

export class TimeInputPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedHourIndex: 0,
            selectedMinuteIndex: 0,
            currentTime: moment(),
        };

        this.hours = range(0, 24);
        this.minutes = range(0, 60, 5);
    }

    componentWillMount() {
        const {value} = this.props;
        let hourIndex, minuteIndex;
        let inputDateTime = value && moment.isMoment(value) ? moment(value) : this.state.currentTime;

        // Round it to nearest 5 minutes mark if needed
        const diffMins = 5 - inputDateTime.minute() % 5;

        if (diffMins !== 5) {
            inputDateTime = inputDateTime.add(diffMins, 'm');
        }

        hourIndex = inputDateTime.hour();
        minuteIndex = inputDateTime.minute() / 5;

        this.setState({
            selectedHourIndex: hourIndex,
            selectedMinuteIndex: minuteIndex
        });
    }

    setselectedHourIndex(val) {
        this.setState({selectedHourIndex: val});
    }

    setselectedMinuteIndex(val) {
        this.setState({selectedMinuteIndex: val});
    }

    handleConfirm(addMinutes) {
        const {onChange, close} = this.props;

        if (addMinutes) {
            this.state.currentTime.add(addMinutes, 'm');
            onChange(this.state.currentTime.format('HH:mm'));
        } else {
            onChange(this.state.selectedHourIndex + ':' + (this.state.selectedMinuteIndex * 5));
        }

        // Close the timepicker
        close();
    }

    render() {
        return (
            <Popup
                close={this.props.close}
                target={this.props.target}
            >
                <div className="timepickerPopup">
                    <div className="timepickerPopup__core">
                        <div className="timepickerPopup__additional">
                            <table>
                                <tbody>
                                    <tr>
                                        <td><button
                                            className="btn btn--mini"
                                            type="button"
                                            onClick={this.handleConfirm.bind(this, 30)}>in 30 min</button></td>
                                        <td><button
                                            className="btn btn--mini"
                                            type="button"
                                            onClick={this.handleConfirm.bind(this, 60)}>in 1 h</button></td>
                                        <td><button
                                            className="btn btn--mini"
                                            type="button"
                                            onClick={this.handleConfirm.bind(this, 120)}>in 2 h</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="timepickerPopup__selectArea">
                            <div className="header">Hours</div>
                            <ul>
                                {this.hours.map((hour, index) => (
                                    <li
                                        key={index}
                                        className={index === this.state.selectedHourIndex ? 'active' : ''}
                                        onClick={this.setselectedHourIndex.bind(this, index)}>
                                        {hour < 10 ? '0' + hour : hour}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="timepickerPopup__selectArea">
                            <div className="header">Minutes</div>
                            <ul>
                                {this.minutes.map((minute, index) => (
                                    <li
                                        key={index}
                                        className={index === this.state.selectedMinuteIndex ? 'active' : ''}
                                        onClick={this.setselectedMinuteIndex.bind(this, index)}>
                                        {minute < 10 ? '0' + minute : minute}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <button
                                className="btn btn--primary btn--small pull-right"
                                type="button"
                                onClick={this.handleConfirm.bind(this, 0)}>Confirm</button>
                            <button
                                className="btn btn--small pull-right"
                                type="button"
                                onClick={this.props.close}>Cancel</button>
                        </div>
                    </div>
                </div>
            </Popup>
        );
    }
}

TimeInputPopup.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
};
