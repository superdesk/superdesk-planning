import React from 'react';
import classNames from 'classnames';
import {SelectFieldPopup} from './SelectFieldPopup';
import {cloneDeep, differenceBy} from 'lodash';

import {LineInput, Label} from '../';
import {TermsList} from '../../';

import './style.scss';

export interface IProps {
    options: Array<any>;
    value?: Array<any>;
    singleSelect?: boolean;
    label?: string;
    labelKey?: string;
    valueKey?: string;
    searchKey?: string;
    readOnly?: boolean;
    onChange?: (field: string, value: any) => void;
    required?: boolean;
    field?: string;
    scheme?: string;
    popupContainer?: () => HTMLElement;
    onFocus?: () => void;
    groupField?: string;
    onPopupOpen?: () => void;
    onPopupClose?: () => void;
    maxLength?: number;
    language?: string;
    invalid?: boolean;
    ignoreScheme?: boolean;
}

interface IState {
    multiLevel: boolean;
    openSelectPopup: boolean;
}

/**
 * @ngdoc react
 * @name SelectMetaTermsInput
 * @description Component to select metadata terms like Subjects/Category
 */
export class SelectMetaTermsInput extends React.Component<IProps, IState> {
    addBtn: React.RefObject<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);
        this.state = {
            multiLevel: false,
            openSelectPopup: false,
        };

        this.removeValue = this.removeValue.bind(this);
        this.toggleOpenSelectPopup = this.toggleOpenSelectPopup.bind(this);
        this.onChange = this.onChange.bind(this);
        this.addBtn = React.createRef();
    }

    componentWillMount() {
        // There is at least one parent or multi-level option
        this.setState({multiLevel: this.props.options.filter((o) => (o.parent)).length > 0});
    }

    toggleOpenSelectPopup() {
        this.setState({openSelectPopup: !this.state.openSelectPopup});
        this.addBtn.current?.focus();
    }

    removeValue(index, term) {
        const {value, field, onChange} = this.props;

        if (term.scheme != null || term.qcode != null) {
            const termScheme = term.scheme ?? null;
            const termQcode = term.qcode ?? null;
            const updatedValue = value.filter(({scheme = null, qcode = null}) => {
                if (this.props.ignoreScheme && termQcode != null) {
                    return termQcode !== qcode;
                }

                return !(termScheme === scheme && termQcode === qcode);
            });

            onChange(
                field,
                updatedValue,
            );
        } else {
            // Delete by index
            onChange(field, cloneDeep(value).filter((_, i) => (i !== index)));
        }
    }

    removeValuesFromOptions() {
        if (!this.state.multiLevel) {
            return differenceBy(this.props.options, this.props.value, this.props.valueKey);
        } else {
            return this.props.options;
        }
    }

    onChange(opt) {
        const {value, valueKey, onChange, field} = this.props;

        // Check if it's duplicate
        if (value && value.length > 0) {
            if (value.find((v) => (v[valueKey] === opt[valueKey]))) {
                return;
            }

            onChange(field, [...value, opt]);
        } else {
            onChange(field, [opt]);
        }
    }

    focus() {
        this.addBtn.current?.focus();
    }

    render() {
        const {
            value,
            label,
            labelKey,
            searchKey,
            valueKey,
            popupContainer,
            readOnly,
            onFocus,
            scheme,
            groupField,
            onPopupOpen,
            onPopupClose,
            maxLength,
            language,
            ...props
        } = this.props;

        const options = this.removeValuesFromOptions();
        const disabled = (() => {
            // No options available to be selected
            if (options.length === 0) {
                return true;

            // If maxLength is defined, and values is an array check if values are exceeding maxLength
            } else if (maxLength != null && Array.isArray(value) && value.length >= maxLength) {
                return true;
            }

            return false;
        })();

        const selectedIds: Array<string> = (value || []).map((option) => option[valueKey]);
        let selected = this.props.options.filter(
            (option) => selectedIds.includes(option[valueKey])
        );

        if (scheme) {
            selected = selected.filter((val) => val.scheme === scheme);
        }

        const hasSelectedMax = this.props.singleSelect && selected.length >= 1;

        return (
            <LineInput
                {...props}
                withButton={true}
                readOnly={readOnly}
                invalid={this.props.invalid === true}
                required={this.props.required}
                className={classNames(
                    'dropdown-terms',
                    'select__meta-terms',
                    {'select__meta-terms--disabled': readOnly}
                )}
            >
                <Label text={label} />

                {!readOnly && (
                    <button
                        className={classNames(
                            'dropdown__toggle',
                            'sd-line-input__plus-btn',
                            {'sd-line-input__plus-btn--disabled': disabled || hasSelectedMax}
                        )}
                        disabled={disabled || hasSelectedMax}
                        onClick={this.toggleOpenSelectPopup}
                        onFocus={onFocus}
                        ref={this.addBtn}
                    />
                )}

                <div className="sd-line-input__input">
                    <TermsList
                        terms={selected}
                        displayField={labelKey}
                        onClick={this.removeValue}
                        readOnly={readOnly}
                        language={language}
                    />
                </div>

                {this.state.openSelectPopup && (
                    <SelectFieldPopup
                        value={selected}
                        multiLevel={this.state.multiLevel}
                        options={options}
                        onCancel={this.toggleOpenSelectPopup}
                        target="sd-line-input__plus-btn"
                        onChange={(opt) => {
                            this.onChange({
                                ...opt,
                                scheme: opt.scheme ?? null,
                            });
                            this.toggleOpenSelectPopup();
                        }}
                        labelKey={labelKey}
                        valueKey={valueKey}
                        searchKey={searchKey}
                        popupContainer={popupContainer}
                        groupField={groupField}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                        language={language}
                    />
                )}
            </LineInput>
        );
    }
}
