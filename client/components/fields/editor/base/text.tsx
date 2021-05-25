import * as React from 'react';
import {get} from 'lodash';

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

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.node = React.createRef();
    }

    onChange(newValue) {
        this.props.onChange(this.props.field, newValue);
    }

    focus() {
        if (this.node.current != null) {
            this.node.current.getElementsByTagName('input')[0]?.focus();
        }
    }

    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
            >
                <Input
                    value={value}
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
