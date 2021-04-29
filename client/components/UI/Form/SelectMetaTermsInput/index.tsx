import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {SelectFieldPopup} from './SelectFieldPopup';
import {cloneDeep, differenceBy} from 'lodash';

import {LineInput, Label} from '../';
import {TermsList} from '../../';

import './style.scss';

/**
 * @ngdoc react
 * @name SelectMetaTermsInput
 * @description Component to select metadata terms like Subjects/Category
 */
export class SelectMetaTermsInput extends React.Component {
    addBtn: React.RefObject<HTMLButtonElement>;

    constructor(props) {
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

        if (term.scheme || term.qcode) {
            onChange(
                field,
                value.filter(({scheme, qcode}) => !(term.scheme === scheme && term.qcode === qcode))
            );
        } else {
            // Delete by index
            onChange(field, cloneDeep(value).filter((item, i) => (i !== index)));
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
        const disabled = options.length === 0 || (maxLength && Array.isArray(value) && value.length >= maxLength);
        const selectedIds: Array<string> = (value || []).map(
            (option) => option[valueKey]
        );
        let selected = this.props.options.filter(
            (option) => selectedIds.includes(option[valueKey])
        );

        if (scheme) {
            selected = selected.filter((val) => val.scheme === scheme);
        }

        return (
            <LineInput
                {...props}
                withButton={true}
                readOnly={readOnly}
                className={classNames(
                    'dropdown-terms',
                    'select__meta-terms',
                    {'select__meta-terms--disabled': readOnly}
                )}
            >
                {!readOnly && (
                    <button
                        className={classNames(
                            'dropdown__toggle',
                            'sd-line-input__plus-btn',
                            {'sd-line-input__plus-btn--disabled': disabled}
                        )}
                        onClick={!disabled ? this.toggleOpenSelectPopup : null}
                        onFocus={onFocus}
                        ref={this.addBtn}
                    />
                )}

                <Label text={label} />

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
                            this.onChange(opt);
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

SelectMetaTermsInput.propTypes = {
    options: PropTypes.array.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.shape(undefined),
        PropTypes.shape({
            label: PropTypes.string,
            value: PropTypes.object,
        }),
    ]),
    label: PropTypes.string,
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    searchKey: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    field: PropTypes.string,
    scheme: PropTypes.string,
    popupContainer: PropTypes.func,
    onFocus: PropTypes.func,
    groupField: PropTypes.string,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    maxLength: PropTypes.number,
    language: PropTypes.string,
};

SelectMetaTermsInput.defaultProps = {
    required: false,
    labelKey: 'name',
    valueKey: 'qcode',
    searchKey: 'name',
    scheme: '',
};
