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

interface IState {
    key: string;
}

export class EditorFieldText extends React.Component<IProps, IState> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.node = React.createRef();

        this.state = {
            key: uniqueId(),
        };
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any) {
        if (get(prevProps.item, prevProps.field) !== get(this.props.item, this.props.field)) {
            this.onPropValueChanged();
        }
    }

    onPropValueChanged() {
        // If the value on the provided item has changed
        // Check this new value against the value in the `input` element directly
        // If these two differ, then force a re-mount/render of the `input` element
        // Using the React `key` attribute

        const node = this.getInputElement();
        const propValue = get(this.props.item, this.props.field);

        if (node != null && node.value !== propValue) {
            this.setState({key: uniqueId()});
        }
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

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
            >
                <Input
                    value={value}
                    key={this.state.key}
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
