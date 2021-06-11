import * as React from 'react';
import {get, uniqueId} from 'lodash';

import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';

import {Input} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    maxLength?: number;
    info?: string;
    inlineLabel?: boolean;
    schema?: IProfileSchemaTypeString;
}

export class EditorFieldText extends React.PureComponent<IProps> {
    node: React.RefObject<HTMLDivElement>;
    lastKey: string;

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.node = React.createRef();
        this.lastKey = uniqueId();
    }

    onChange(newValue) {
        this.props.onChange(this.props.field, newValue);
    }

    getInputElement(): HTMLInputElement | undefined {
        return this.node.current?.getElementsByTagName('input')[0];
    }

    focus() {
        this.getInputElement()?.focus();
    }

    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);
        const node = this.getInputElement();
        const key = (node != null && node.value !== value) ?
            uniqueId() :
            this.lastKey;

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
            >
                <Input
                    value={value}
                    key={key}
                    label={this.props.label}
                    required={this.props.required ?? this.props.schema?.required}
                    disabled={this.props.disabled}
                    invalid={this.props.invalid ?? (error != null && this.props.showErrors)}
                    maxLength={this.props.maxLength ?? this.props.schema?.maxlength}
                    info={this.props.info}
                    inlineLabel={this.props.inlineLabel}
                    error={this.props.showErrors && error}
                    onChange={this.onChange}
                />
            </Row>
        );
    }
}
