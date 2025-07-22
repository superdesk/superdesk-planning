import * as React from 'react';
import {debounce, get} from 'lodash';

import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';

import {Row, TextAreaInput} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    maxLength?: number;
    schema?: IProfileSchemaTypeString;
    multiLine?: boolean;
    autoHeight?: boolean;
    rows?: number;
    labelIcon?: string;
    noPadding?: boolean;
}

interface IState {
    value: string;
}

export class EditorFieldTextArea extends React.PureComponent<IProps, IState> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.node = React.createRef();

        this.state = {value: get(props.item, props.field, props.defaultValue) ?? ''};

        this.onChange = this.onChange.bind(this);
        this.propsOnChange = debounce(
            this.propsOnChange.bind(this),
            props.debounce ?? 0,
            {maxWait: 1000},
        );
    }

    focus() {
        if (this.node.current != null) {
            this.node.current.getElementsByTagName('textarea')[0]?.focus();
        }
    }

    onChange(field: string, value: string) {
        this.setState({value}, () => {
            this.propsOnChange(this.state.value);
        });
    }

    propsOnChange(value: string) {
        this.props.onChange(this.props.field, value);
    }

    render() {
        const field = this.props.field;
        const value = this.state.value;
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
                noPadding={this.props.noPadding}
            >
                <TextAreaInput
                    {...this.props}
                    readOnly={this.props.disabled}
                    value={value}
                    required={this.props.required ?? this.props.schema?.required}
                    maxLength={this.props.maxLength ?? this.props.schema?.maxlength}
                    invalid={this.props.invalid ?? (error != null && this.props.showErrors)}
                    noMargin={true}
                    onChange={this.onChange}
                />
            </Row>
        );
    }
}
