import React from 'react';
import PropTypes from 'prop-types';

import {Row, LineInput, Label, Checkbox} from '../../UI/Form';

export class DaysOfWeekInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            MO: false,
            TU: false,
            WE: false,
            TH: false,
            FR: false,
            SA: false,
            SU: false
        };
    }

    componentWillMount() {
        this.setDays(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.props.value) {
            this.setDays(nextProps);
        }
    }

    setDays(props) {
        const days = {
            MO: false,
            TU: false,
            WE: false,
            TH: false,
            FR: false,
            SA: false,
            SU: false
        };

        const value = props.value || '';

        value.split(' ').forEach((day) => {
            if (Object.keys(days).indexOf(day) > -1) {
                days[day] = true;
            }
        });

        this.setState(days);
    }

    onChange(value, day) {
        const {field, onChange} = this.props;

        const days = {
            ...this.state,
            [day]: value
        };

        let daysInString = Object.keys(days)
            // Keep only the checked days
            .map((d) => days[d] ? d : null)
            // Keep only defined values in array
            .filter((d) => d)
            // Join array to produce the string we want to store
            .join(' ');

        onChange(field, daysInString);
    }

    render() {
        const {label, readOnly, invalid, message} = this.props;

        return (
            <div>
                <Label row={true} text={label} invalid={invalid}/>
                <Row flex={true} noPadding={invalid}>
                    {Object.keys(this.state).map((day) => (
                        <LineInput key={day} noLabel={true} noMargin={true}>
                            <Checkbox
                                value={this.state[day]}
                                onChange={(f, val) => this.onChange(val, day)}
                                labelPosition="inside"
                                label={day}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    ))}
                </Row>
                {invalid && <LineInput noLabel={true} invalid={invalid} message={message} />}
            </div>
        );
    }
}

DaysOfWeekInput.propTypes = {
    field: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    message: PropTypes.string,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};

DaysOfWeekInput.defaultProps = {
    field: 'dates.recurring_rule.byday',
    label: 'Repeat On',

    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
