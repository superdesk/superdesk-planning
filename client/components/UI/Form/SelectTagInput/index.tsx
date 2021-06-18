import React from 'react';
import {get, remove} from 'lodash';

import {Row, LineInput, Label, Input} from '../';
import {TermsList} from '../../';

import {SelectTagPopup} from './SelectTagPopup';
import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';

import './style.scss';

interface IProps {
    field: string;
    label: string;
    value: Array<string>;
    options: Array<{[key: string]: any}>;
    labelKey?: string; // defaults to 'name'
    valueKey?: string; // defaults to 'qcode'
    searchKey?: string; // defaults to 'name'
    allowCustom?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    onChange(field: string, value: Array<string>): void;
    onFocus?(): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface IState {
    popupOpened: boolean;
    inputText: string;
    filteredOptions: Array<{[key: string]: any}>;
}

/**
 * @ngdoc react
 * @name SelectTagInput
 * @description Component to select tags like Keyword of a news story
 */
export class SelectTagInput extends React.Component<IProps, IState> {
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
        this.openPopUp = this.openPopUp.bind(this);
    }

    togglePopup() {
        this.setState({popupOpened: !this.state.popupOpened});
    }

    openPopUp() {
        if (!this.state.popupOpened) {
            this.setState({popupOpened: true});
        }
    }

    addTag(tag) {
        if (tag) {
            const valueText = get(
                tag,
                this.props.valueKey ?? 'qcode',
                tag
            );

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
                    filteredOptions: this.getFilteredOptions(newValue),
                });
            } else {
                this.setState({
                    inputText: '',
                    popupOpened: false,
                    filteredOptions: this.getFilteredOptions(this.props.value),
                });
            }
        }
    }

    removeTag(index) {
        const newValue = [...this.props.value];

        newValue.splice(index, 1);

        this.props.onChange(this.props.field, newValue);
        this.setState({
            filteredOptions: this.getFilteredOptions(newValue),
        });
    }

    getFilteredOptions(tags, inputText = '') {
        const numTags = get(tags, 'length', 0);
        let filteredOptions = [...this.props.options];

        // Remove selected values from options
        if (numTags > 0) {
            tags.forEach(
                (v) => remove(
                    filteredOptions,
                    (o) => get(o, this.props.valueKey ?? 'qcode') === v
                )
            );
        }

        if (inputText) {
            const inputNoCase = inputText.toLowerCase();

            // Filter those substrings according to inputText
            filteredOptions = filteredOptions.filter((o) => {
                const optionName = get(o, this.props.searchKey ?? 'name', '').toLowerCase();

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
            filteredOptions: this.getFilteredOptions(this.props.value, value),
        });
    }

    render() {
        const {
            label,
            value,
            labelKey = 'name',
            allowCustom,
            readOnly,
            invalid,
            required,
            onFocus,
            ...props
        } = this.props;

        return (
            <React.Fragment>
                <Row noPadding={true}>
                    <LineInput noMargin={true} invalid={invalid} required={required}>
                        <Label text={label} />

                        <div className="sd-line-input__input" readOnly={readOnly}>
                            {get(value, 'length', 0) > 0 && (
                                <TermsList terms={value} onClick={this.removeTag} />
                            )}
                        </div>
                    </LineInput>
                </Row>
                <Row>
                    <LineInput
                        isSelect={true}
                        readOnly={readOnly}
                        noLabel={get(value, 'length', 0) > 0}
                        invalid={invalid}
                        {...props}
                    >
                        <Input
                            value={this.state.inputText}
                            onChange={!readOnly ? this.filterOptions : null}
                            onClick={!readOnly ? this.togglePopup : null}
                            className="select-tag__input"
                            readOnly={readOnly}
                            onKeyDown={(event) => {
                                if (event.keyCode === KEYCODES.ENTER ||
                                    event.keyCode === KEYCODES.DOWN) {
                                    onEventCapture(event);
                                    this.openPopUp();
                                }
                            }}
                            onFocus={onFocus}
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
                                onPopupOpen={props.onPopupOpen}
                                onPopupClose={props.onPopupClose}
                            />
                        )}
                    </LineInput>
                </Row>
            </React.Fragment>
        );
    }
}
