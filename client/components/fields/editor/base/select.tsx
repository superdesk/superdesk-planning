import * as React from 'react';
import {get, memoize} from 'lodash';

import {Select, Option} from 'superdesk-ui-framework/react';
import {IEditorFieldProps} from '../../../../interfaces';

import {Row} from '../../../UI/Form';
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

export class EditorFieldSelect extends React.PureComponent<IProps> {
    node: React.RefObject<HTMLDivElement>;
    getOptions = memoize(getOptionsFromProps);

    constructor(props) {
        super(props);

        this.node = React.createRef();
        this.onChange = this.onChange.bind(this);
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
        const options = this.getOptions(this.props);
        const value = this.getValue();
        const error = get(this.props.errors ?? {}, this.props.field);

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
            >
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
                    {options.map((option) => (
                        <Option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Row>
        );
    }
}
