import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';

import {Row, TextAreaInput} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    maxLength?: number;
    schema?: IProfileSchemaTypeString;
    multiLine?: boolean;
    autoHeight?: boolean;
    rows?: number;
    labelIcon?: string;
}

export class EditorFieldTextArea extends React.PureComponent<IProps> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.node = React.createRef();
    }

    focus() {
        if (this.node.current != null) {
            this.node.current.getElementsByTagName('textarea')[0]?.focus();
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
                <TextAreaInput
                    {...this.props}
                    readOnly={this.props.disabled}
                    value={value}
                    required={this.props.required ?? this.props.schema?.required}
                    maxLength={this.props.maxLength ?? this.props.schema?.maxlength}
                    invalid={this.props.invalid ?? (error != null && this.props.showErrors)}
                    noMargin={true}
                />
            </Row>
        );
    }
}
