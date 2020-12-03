import React from 'react';
import {get} from 'lodash';

import {gettext} from '../../utils';

import {LineInput, Label} from '../';
import {ColouredValuePopup} from './ColouredValuePopup';
import {getVocabularyItemFieldTranslated} from '../../../../utils/vocabularies';

interface IProps {
    value: any;
    label: string;
    labelKey?: string; // defaults to 'name'
    valueKey?: string; // defaults to 'qcode'
    field: string;
    options: Array<any>
    readOnly?: boolean;
    required?: boolean;
    labelLeft?: boolean;
    clearable?: boolean;
    noMargin?: string;
    iconName: string;
    row?: boolean;
    noValueString?: string
    language?: string;

    // Input events
    onChange(field: string, value: any): void;
    onFocus?(): void;

    // Popup callbacks
    popupContainer(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface IState {
    openPopup: boolean;
}

/**
 * @ngdoc react
 * @name ColouredValueInput
 * @description Component to show color coded values. Eg. Urgency / Priority
 */
export class ColouredValueInput extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {openPopup: false};

        this.togglePopup = this.togglePopup.bind(this);
        this.getIconClasses = this.getIconClasses.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    /**
    * @ngdoc method
    * @name ColouredValueInput#togglePopup
    * @description togglePopup method to toggle open state of opop-up component
    */
    togglePopup() {
        this.setState({openPopup: !this.state.openPopup});
    }

    /**
     * @ngdoc method
     * @name ColouredValueInput#getIconClasses
     * @description getIconClasses returns appropriate icon class for a given value.
     * @returns {string} Icon class-name
     */
    getIconClasses(val) {
        if (val) {
            const iconName = this.props.iconName;
            const icon = get(
                val,
                this.props.valueKey ?? 'qcode',
                get(val, this.props.labelKey ?? 'name')
            );

            return `line-input ${iconName} ${iconName}--${icon}`;
        }

        return 'line-input';
    }

    onChange(value) {
        this.props.onChange(
            this.props.field,
            get(value, this.props.valueKey ?? 'qcode') ?
                value :
                null
        );
        this.togglePopup();
    }

    render() {
        const {
            required,
            value,
            label,
            readOnly,
            labelLeft,
            clearable,
            options,
            labelKey = 'name',
            valueKey = 'qcode',
            noMargin,
            popupContainer,
            row,
            noValueString,
            onFocus,
            language,
            ...props
        } = this.props;

        const text = getVocabularyItemFieldTranslated(value ?? {}, labelKey, language) ?? '';

        return (
            <LineInput
                className="select-coloured-value"
                required={required}
                readOnly={readOnly}
                labelLeft={labelLeft}
                noMargin={noMargin}
                {...props}
            >
                <Label text={label} row={row} light={row && readOnly} />
                {readOnly ? (
                    <LineInput labelLeft={labelLeft} className="select-coloured-value__input">
                        <span
                            className={this.getIconClasses(value)}
                            style={{backgroundColor: value?.color}}
                        >
                            {get(value, valueKey, get(value, labelKey, noValueString || gettext('None')))}
                        </span>
                        <span>
                        &nbsp;&nbsp;{text}
                        </span>
                    </LineInput>
                ) : (
                    <button
                        type="button"
                        className="dropdown__toggle select-coloured-value__input line-input"
                        onClick={this.togglePopup}
                        onFocus={onFocus}
                    >
                        <span
                            className={this.getIconClasses(value)}
                            style={{backgroundColor: value?.color}}
                        >
                            {get(value, valueKey, get(value, labelKey, noValueString || gettext('None')))}
                        </span>
                        &nbsp;&nbsp;{text}
                        <b className="dropdown__caret" />
                    </button>
                )}

                {this.state.openPopup && (
                    <ColouredValuePopup
                        title={label}
                        options={options}
                        getClassNamesForOption={this.getIconClasses}
                        onChange={this.onChange}
                        onCancel={this.togglePopup}
                        clearable={clearable}
                        target="dropdown__caret"
                        labelKey={labelKey}
                        valueKey={valueKey}
                        popupContainer={popupContainer}
                        onPopupOpen={props.onPopupOpen}
                        onPopupClose={props.onPopupClose}
                        language={language}
                    />
                )}
            </LineInput>
        );
    }
}
