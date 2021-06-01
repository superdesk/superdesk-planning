import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {Select, Option, Input, Switch} from 'superdesk-ui-framework/react';
import {Row, RowItem} from '../../../UI/Form';
import {getVocabularyItemFieldTranslated} from '../../../../utils/vocabularies';

interface IProps extends IEditorFieldProps {
    options: Array<any>;
    labelField?: string; // label
    keyField?: string; // qcode
    valueAsString?: boolean;
    clearable?: boolean;
    readOnly?: boolean;
    info?: string;
    inlineLabel?: boolean;
}

// Store the translated option in state
interface IState {
    options: Array<{
        value: string;
        label: string;
    }>;
    enterFreeText: boolean;
}

function getOptionsFromProps(props: IProps) {
    const options = props.options.map(
        (option) => ({
            value: option[props.keyField ?? 'qcode'],
            label: getVocabularyItemFieldTranslated(
                option,
                props.labelField ?? 'label',
                props.language,
                'name'
            ),
        })
    );

    return props.clearable ?
        [{value: '', label: ''}].concat(options) :
        options;
}

export class EditorFieldSelectWithFreeText extends React.Component<IProps, IState> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.state = {
            options: getOptionsFromProps(this.props),
            enterFreeText: this.isTextInput(),
        };
        this.node = React.createRef();

        this.onChange = this.onChange.bind(this);
        this.toggleFreeText = this.toggleFreeText.bind(this);
    }

    isTextInput(): boolean {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);

        return typeof value === 'string' && value.length > 0;
    }

    static getDerivedStateFromProps(props: IProps, state: IState) {
        if (props.options.length != state.options.length) {
            return {
                options: getOptionsFromProps(props),
            };
        }

        return null;
    }

    onChange(newValue: string) {
        if (this.props.valueAsString) {
            this.props.onChange(this.props.field, newValue);
        } else {
            this.props.onChange(this.props.field, this.props.options.find(
                (option) => option[this.props.keyField ?? 'qcode'] === newValue
            ));
        }
    }

    toggleFreeText() {
        this.setState({enterFreeText: !this.state.enterFreeText});
    }

    getValue() {
        const value = get(this.props.item, this.props.field, this.props.defaultValue) || (
            this.props.valueAsString ? '' : {}
        );
        let viewValue;

        if (this.props.valueAsString) {
            viewValue = this.props.clearable ?
                (value || '') :
                value;
        } else {
            viewValue = this.props.clearable ?
                value[this.props.keyField ?? 'qcode'] ?? '' :
                value[this.props.keyField ?? 'qcode'] ?? this.props.options[0][this.props.keyField ?? 'qcode'];
        }

        return viewValue;
    }

    focus() {
        if (this.node.current != null) {
            this.node.current.getElementsByTagName('select')[0]?.focus();
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const value = this.getValue();
        const error = get(this.props.errors ?? {}, this.props.field);

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
                flex={true}
            >
                <RowItem>
                    {!this.state.enterFreeText ? (
                        <Select
                            key={value}
                            value={value}
                            required={this.props.required ?? this.props.schema?.required}
                            onChange={this.onChange}
                            label={this.props.label}
                            info={this.props.info}
                            error={error}
                            inlineLabel={this.props.inlineLabel}
                            disabled={this.props.disabled}
                            invalid={this.props.invalid}
                        >
                            {this.state.options.map((option) => (
                                <Option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    ) : (
                        <Input
                            value={value}
                            label={this.props.label}
                            disabled={this.props.disabled}
                            required={this.props.required}
                            invalid={this.props.invalid}
                            onChange={this.onChange}
                            info={this.props.info}
                            error={this.props.showErrors && error}
                        />
                    )}
                </RowItem>
                <RowItem noGrow={true}>
                    <div className="sd-input">
                        <label className="sd-input__label">{gettext('Other')}</label>
                        <div className="sd-input__icon-right">
                            <Switch
                                value={this.state.enterFreeText}
                                onChange={this.toggleFreeText}
                                disabled={this.props.disabled}
                            />
                        </div>
                    </div>
                </RowItem>
            </Row>
        );
    }
}

