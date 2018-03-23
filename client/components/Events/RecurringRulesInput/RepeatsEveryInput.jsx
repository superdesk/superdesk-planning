import React from 'react';
import PropTypes from 'prop-types';
import {range} from 'lodash';

import {repeatChoices} from './RepeatsInput';
import {Select, LineInput, Label} from '../../UI/Form';

const repeatEveryChoices = {
    YEARLY: 'year',
    MONTHLY: 'month',
    WEEKLY: 'week',
    DAILY: 'day'
};

export class RepeatsEveryInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            options: [],
            value: repeatEveryChoices[0]
        };

        this.getOptions = this.getOptions.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    componentWillMount() {
        this.setState({options: this.getOptions(this.props)});
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.frequency !== this.props.frequency) {
            this.setState({options: this.getOptions(nextProps)});
        }
    }

    getOptions(props) {
        const frequency = props.frequency || repeatChoices[0].key;

        const getLabel = (n) => {
            let label = `${n} ${repeatEveryChoices[frequency]}`;

            if (n > 1) {
                label += 's';
            }
            return label;
        };

        return range(0, 30).map((n) => ({key: n + 1, label: getLabel(n + 1)}));
    }

    onChange(field, value) {
        this.props.onChange(field, parseInt(value, 10));
    }

    render() {
        const {label, field, value, readOnly, ...props} = this.props;

        return (
            <LineInput {...props} isSelect={true} readOnly={readOnly}>
                <Label text={label} />
                <Select
                    field={field}
                    options={this.state.options}
                    onChange={this.onChange}
                    value={value}
                    readOnly={readOnly}
                />
            </LineInput>
        );
    }
}

RepeatsEveryInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.number,
    onChange: PropTypes.func.isRequired,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    noLabel: PropTypes.bool,

    frequency: PropTypes.string,
};

RepeatsEveryInput.defaultProps = {
    field: 'dates.recurring_rule.interval',
    label: 'Repeat Every',
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    noLabel: false,
};
