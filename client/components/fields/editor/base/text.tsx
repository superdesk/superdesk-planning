import * as React from 'react';
import {get, uniqueId} from 'lodash';
import {IRestApiResponse} from 'superdesk-api';
import {appConfig} from 'appConfig';

import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {Input, Autocomplete} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';

export interface IEditorFieldTextProps extends IEditorFieldProps {
    type?: 'text' | 'password' | 'number';
    maxLength?: number;
    info?: string;
    inlineLabel?: boolean;
    schema?: IProfileSchemaTypeString;
    noPadding: boolean;
    language?: string;
}

interface IState {
    key: string;
    suggestions: string[];
}

export class EditorFieldText extends React.Component<IEditorFieldTextProps, IState> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.node = React.createRef();

        this.state = {
            key: uniqueId(),
            suggestions: [],
        };
    }

    componentDidUpdate(prevProps: Readonly<IEditorFieldTextProps>, prevState: Readonly<IState>, snapshot?: any) {
        if (get(prevProps.item, prevProps.field) !== get(this.props.item, this.props.field)) {
            this.onPropValueChanged();
        }
    }

    componentDidMount(): void {
        const suggestionsEnabled = appConfig.archive_autocomplete;

        if (suggestionsEnabled && this.props.field.startsWith('slugline') && this.props.language) {
            this.fetchSuggestions('slugline', this.props.language).then((suggestions) => {
                this.setState({suggestions});
            });
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

    fetchSuggestions(field, language) {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<IRestApiResponse<{value: string}>>({
            method: 'GET',
            path: '/archive_autocomplete',
            urlParams: {field: field, language: language},
        }).then(
            (response) => response._items.map((_item) => _item.value).filter((value) => !!value),
            (reason) => {
                console.warn(reason);
            }
        );
    }

    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
                noPadding={this.props.noPadding}

            >
                {this.state.suggestions.length === 0 ? (
                    <Input
                        value={value}
                        type={this.props.type ?? 'text'}
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
                ) : (
                    <Autocomplete
                        value={value}
                        key={this.state.key}
                        label={this.props.label}
                        required={this.props.required ?? this.props.schema?.required}
                        disabled={this.props.disabled}
                        invalid={this.props.invalid ?? (error != null && this.props.showErrors)}
                        info={this.props.info}
                        inlineLabel={this.props.inlineLabel}
                        error={this.props.showErrors && error}
                        onChange={this.onChange}
                        items={this.state.suggestions}
                    />
                )}
            </Row>
        );
    }
}
