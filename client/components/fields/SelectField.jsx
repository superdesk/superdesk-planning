import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import {onEventCapture} from '../../utils';

export class SelectField extends React.Component {
    constructor(props) {
        super(props);

        this.state = {selected: undefined};

        this.onChange = this.onChange.bind(this);
    }

    setValueFromState(selected = null) {
        const {options, input} = this.props;

        let selectedOption = selected;

        if (selected === null) {
            selectedOption = this.state.selected;
        }

        let value = '';

        if (selectedOption) {
            value = options.find((option) => option.key === selectedOption).value;
        }

        input.onChange(value);
    }

    setStateFromValue(value = null) {
        const {getOptionFromValue, options} = this.props;

        let val = value;

        if (value === null) {
            val = this.props.input.value;
        }

        const option = getOptionFromValue(val, options) || {
            key: '',
            label: '',
            value: '',
        };

        this.setState({selected: get(option, 'key', null)});
    }

    componentDidMount() {
        // after first render, set value of the form input
        this.setStateFromValue();
    }

    /** Update the state when the props change */
    componentWillReceiveProps(nextProps) {
        this.setStateFromValue(nextProps.input.value);
    }

    onChange(event) {
        onEventCapture(event);

        this.setValueFromState(event.target.value);
    }

    render() {
        const {touched, error, warning} = this.props.meta;
        const {labelLeft, required, readOnly, label, options, clearable, autoFocus} = this.props;

        const showMessage = touched && (error || warning);
        const divClass = classNames(
            'sd-line-input',
            'sd-line-input--is-select',
            {'sd-line-input--label-left': labelLeft},
            {'sd-line-input--invalid': showMessage},
            {'sd-line-input--no-margin': !showMessage},
            {'sd-line-input--required': required}
        );

        const inputClass = classNames(
            'sd-line-input__select',
            {'sd-line-input--disabled': readOnly}
        );

        const {selected} = this.state;

        return (
            <div className={divClass}>
                {label &&
                    <label className="sd-line-input__label">
                        {label}
                    </label>
                }

                <select
                    value={selected}
                    className={inputClass}
                    disabled={readOnly}
                    onChange={this.onChange}
                    autoFocus={autoFocus}
                >
                    {clearable && <option value=""/>}
                    {options.map((opt) => (
                        <option
                            key={opt.key}
                            value={opt.key}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                {touched && (
                    (error && <div className="sd-line-input__message">{error}</div>) ||
                    (warning && <div className="sd-line-input__message">{warning}</div>)
                )}
            </div>
        );
    }
}

SelectField.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    labelLeft: PropTypes.bool,
    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
    })),
    getOptionFromValue: PropTypes.func,
    clearable: PropTypes.bool,
    autoFocus: PropTypes.bool,
};

SelectField.defaultProps = {
    readOnly: false,
    required: false,
    labelLeft: false,
    getOptionFromValue: (value, options) => options.find(
        (option) => option.value === value
    ),
    clearable: false,
    autoFocus: false,
    meta: {},
};
