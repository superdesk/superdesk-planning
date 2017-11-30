import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get, difference, remove, uniq} from 'lodash';
import {InputField} from '../InputField';
import {TagSelectPopup} from './TagSelectPopup';

export class TagSelectField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openSelectPopup: false,
            inputText: null,
            setInputTextNull: false,
        };
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch (event.keyCode) {
            case 40:
                // arrowDown key
                event.preventDefault();
                event.stopPropagation();
                this.handleDownArrowKey(event);
                break;
            }
        }
    }

    handleDownArrowKey() {
        this.openSelectPopup();
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyBoardEvent);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyBoardEvent);
    }

    closeSelectPopup(clearText) {
        const textVal = clearText ? '' : this.state.inputText;

        if (this.state.openSelectPopup) {
            this.setState({
                openSelectPopup: false,
                setInputTextNull: true,
                inputText: textVal,
            });
        }
    }

    openSelectPopup() {
        if (!this.state.openSelectPopup) {
            this.setState({openSelectPopup: true});
        }
    }

    filterOptions() {
        if (!this.props.input.value && !this.state.inputText) {
            return this.props.options;
        } else {
            let filteredOptions = [...this.props.options];

            // Remove selected values from options
            if (get(this.props.input, 'value.length') > 0) {
                this.props.input.value.forEach((v) => remove(filteredOptions, (o) => o.qcode === v));
            }

            if (this.state.inputText) {
                const inputNoCase = this.state.inputText.toLowerCase();
                // Filter those substrings according to inputText

                filteredOptions = filteredOptions.filter((o) => (
                    o.qcode.toLowerCase().substr(0, this.state.inputText.length) === inputNoCase ||
                        o.qcode.toLowerCase().indexOf(inputNoCase) >= 0
                ));
            }

            return filteredOptions;
        }
    }

    render() {
        const {required, readOnly, label, input, labelLeft} = this.props;
        const divClass = classNames(
            'sd-line-input',
            'sd-line-input--no-margin',
            {'sd-line-input--label-left': labelLeft},
            {'sd-line-input--required': required}
        );
        let inputFieldProp = {
            onChange: this.handleInputChange.bind(this),
            onClick: this.openSelectPopup.bind(this),
        };

        inputFieldProp.value = this.state.setInputTextNull ? '' : (this.state.inputText || '');

        const inputClass = classNames({'sd-line-input--disabled': readOnly});

        return <div className={divClass}>
            { label &&
                <label className="sd-line-input__label">
                    {label}
                </label>
            }

            <div className={inputClass}>
                { input.value && input.value.length > 0 && (
                    <div className="terms-list">
                        <ul>
                            {input.value.map((v, index) => (
                                <li key={index} className="pull-left">
                                    { !readOnly &&
                                    <i className="icon-close-small" onClick={this.removeValue.bind(this, v)}/> }
                                    { v }
                                </li>
                            ))}
                        </ul>
                    </div>
                ) }
            </div>
            {!this.props.readOnly && <InputField type="text" input={inputFieldProp}/>}
            { this.state.openSelectPopup &&
                <TagSelectPopup
                    options={this.filterOptions()}
                    onCancel={this.closeSelectPopup.bind(this)}
                    onChange={this.addToValue.bind(this)} />
            }
        </div>;
    }

    handleInputChange(event) {
        let open = this.state.openSelectPopup;

        if (event.target.value && !this.state.openSelectPopup) {
            open = true;
        }

        this.setState({
            openSelectPopup: open,
            inputText: event.target.value,
            setInputTextNull: false,
        });
    }

    addToValue(value) {
        if (value) {
            const valueText = value.qcode ? value.qcode : value;
            const newValue = this.props.input.value ? uniq([...this.props.input.value, valueText]) :
                [valueText];

            this.props.input.onChange(newValue);
            this.closeSelectPopup(true);
        }
    }

    removeValue(value) {
        this.props.input.onChange(difference(this.props.input.value, [value]));
    }
}

TagSelectField.propTypes = {
    label: PropTypes.string,
    required: PropTypes.bool,
    readOnly: PropTypes.bool,
    value: PropTypes.array,
    options: PropTypes.array,
    input: PropTypes.object.isRequired,
    labelLeft: PropTypes.bool,
};
