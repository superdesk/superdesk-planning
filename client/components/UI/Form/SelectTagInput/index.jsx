import React from 'react';
import PropTypes from 'prop-types';

import {get, remove} from 'lodash';

import {Row, LineInput, Label, Input} from '../';
import {TermsList} from '../../';

import {SelectTagPopup} from './SelectTagPopup';

import './style.scss';

export class SelectTagInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            popupOpened: false,
            inputText: '',
            filteredOptions: this.props.options,
        };

        this.togglePopup = this.togglePopup.bind(this);
        this.addTag = this.addTag.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.filterOptions = this.filterOptions.bind(this);
    }

    togglePopup() {
        this.setState({popupOpened: !this.state.popupOpened});
    }

    addTag(tag) {
        if (tag) {
            const valueText = get(tag, this.props.valueKey, tag);

            // If the tag is not currently in the list of tags
            // Then call onChange with the new set of tags
            if (this.props.value.indexOf(valueText) === -1) {
                const newValue = this.props.value ?
                    [...this.props.value, valueText] :
                    [valueText];

                this.props.onChange(this.props.field, newValue);
                this.setState({
                    inputText: '',
                    popupOpened: false,
                    filteredOptions: this.getFilteredOptions(newValue)
                });
            } else {
                this.setState({
                    inputText: '',
                    popupOpened: false,
                    filteredOptions: this.getFilteredOptions(this.props.value)
                });
            }
        }
    }

    removeTag(index) {
        const newValue = [...this.props.value];

        newValue.splice(index, 1);

        this.props.onChange(this.props.field, newValue);
        this.setState({
            filteredOptions: this.getFilteredOptions(newValue)
        });
    }

    getFilteredOptions(tags, inputText = '') {
        const numTags = get(tags, 'length', 0);
        let filteredOptions = [...this.props.options];

        // Remove selected values from options
        if (numTags > 0) {
            tags.forEach((v) => remove(filteredOptions, (o) => get(o, this.props.valueKey) === v));
        }

        if (inputText) {
            const inputNoCase = inputText.toLowerCase();

            // Filter those substrings according to inputText
            filteredOptions = filteredOptions.filter((o) => {
                const optionName = get(o, this.props.searchKey, '').toLowerCase();

                return optionName.substr(0, inputText.length) === inputNoCase ||
                    optionName.indexOf(inputNoCase) >= 0;
            });
        }

        return filteredOptions;
    }

    filterOptions(field, value) {
        this.setState({
            inputText: value,
            popupOpened: true,
            filteredOptions: this.getFilteredOptions(this.props.value, value)
        });
    }

    render() {
        const {label, value, labelKey, allowCustom} = this.props;

        return (
            <div>
                <Row noPadding={true}>
                    <LineInput noMargin={true}>
                        <Label text={label} />

                        <div className="sd-line-input__input">
                            {get(value, 'length', 0) > 0 && (
                                <TermsList terms={value} onClick={this.removeTag} />
                            )}
                        </div>
                    </LineInput>
                </Row>
                <Row>
                    <LineInput isSelect={true} noLabel={get(value, 'length', 0) > 0}>
                        <Input
                            value={this.state.inputText}
                            onChange={this.filterOptions}
                            onClick={this.togglePopup}
                            className="select-tag__input"
                        />

                        {this.state.popupOpened && (
                            <SelectTagPopup
                                value={value}
                                options={this.state.filteredOptions}
                                onClose={this.togglePopup}
                                target="select-tag__input"
                                onChange={this.addTag}
                                labelKey={labelKey}
                                allowCustom={allowCustom}
                            />
                        )}
                    </LineInput>
                </Row>
            </div>
        );
    }
}

SelectTagInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
    options: PropTypes.array,
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    searchKey: PropTypes.string,
    allowCustom: PropTypes.bool,
};

SelectTagInput.defaultProps = {
    labelKey: 'name',
    valueKey: 'qcode',
    searchKey: 'name',
    allowCustom: true,
};
