import React from 'react';
import PropTypes from 'prop-types';
import {Checkbox} from '../index';

export class DaysOfWeek extends React.Component {
    constructor(props) {
        super(props);
        let days = {
            MO: false,
            TU: false,
            WE: false,
            TH: false,
            FR: false,
            SA: false,
            SU: false,
        };

        props.input.value.split(' ').forEach((day) => {
            if (Object.keys(days).indexOf(day) > -1) {
                days[day] = true;
            }
        });
        this.state = days;
    }

    handleOnChange(e, day) {
        // update the state with the new (un)checked day
        this.setState({[day]: e.target.value}, () => {
            // keep only the checked days
            let daysInString = Object.keys(this.state).map((d) => this.state[d] ? d : null)
                // keep only not undefined values in array
                .filter((d) => (d))
                // join array to produce the string we want to store
                .join(' ');

            this.props.input.onChange(daysInString);
        });
    }

    render() {
        const {touched, error, warning} = this.props.meta;
        const {readOnly, label} = this.props;

        return (
            <div className="form__row form__row--flex">
                {Object.keys(this.state).map((d) => (
                    <div key={d} className="sd-line-input sd-line-input--no-margin">
                        {label && d === 'MO' &&
                            <label className="sd-line-input__label">{label}</label>
                        }
                        <Checkbox
                            disabled={readOnly ? 'disabled' : ''}
                            value={this.state[d]}
                            onChange={(e) => this.handleOnChange(e, d)}
                            labelPosition="inside"
                            label={d}
                        />
                    </div>
                ))}
                {touched && ((error && <span className="error-block">{error}</span>) ||
                 (warning && <span className="help-block">{warning}</span>))}
            </div>
        );
    }
}

DaysOfWeek.propTypes = {
    input: PropTypes.object,
    meta: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    label: PropTypes.string,
};
