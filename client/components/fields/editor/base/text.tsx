import * as React from 'react';
import {debounce, get, uniqueId} from 'lodash';
import {IRestApiResponse} from 'superdesk-api';
import {appConfig} from 'appConfig';

import {IEditorFieldTextProps} from './text.interface';
import {superdeskApi} from '../../../../superdeskApi';

import {Input, Autocomplete} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';

interface IState {
    key: string;
    value: string;
    suggestions: string[];
    userHasModified: boolean;
}

export class EditorFieldText extends React.Component<IEditorFieldTextProps, IState> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.propsOnChange = debounce(
            this.propsOnChange.bind(this),
            props.debounce ?? 0,
            {maxWait: 1000},
        );
        this.searchSuggestions = this.searchSuggestions.bind(this);
        this.node = React.createRef();

        this.state = {
            key: uniqueId(),
            suggestions: [],
            value: get(props.item, props.field, props.defaultValue || ''),
            userHasModified: false,
        };
    }

    /**
     * Handles scenarios when the field has been initially rendered with empty value
     * and then the prop value arrives later (like with 'add-to-planning').
     * It only updates the state if user hasn't started typing to preserve user input
     * while allowing late-loading data to populate empty fields.
     */
    static getDerivedStateFromProps(nextProps: IEditorFieldTextProps, prevState: IState): Partial<IState> | null {
        const nextValue = get(nextProps.item, nextProps.field, nextProps.defaultValue || '');

        // Only update if:
        // 1. The prop value is different from current state value, AND
        // 2. The user hasn't manually modified the field
        if (nextValue !== prevState.value && !prevState.userHasModified) {
            return {
                value: nextValue
            };
        }

        return null;
    }

    componentDidMount(): void {
        const suggestionsEnabled = appConfig.archive_autocomplete;

        if (suggestionsEnabled && this.props.field.startsWith('slugline') && this.props.language) {
            this.fetchSuggestions('slugline', this.props.language).then((suggestions) => {
                this.setState({suggestions});
            });
        }
    }

    componentDidUpdate = (prevProps: Readonly<IEditorFieldTextProps>): void => {
        // Make sure to reset user modification state when item changes
        // so that late-arriving prop values can populate the field again
        if (prevProps?.item?._id !== this.props.item?._id) {
            this.setState({userHasModified: false});
        }

        // Honor an external clear (e.g. the "Clear" button) when the prop transitions to empty
        const prevValue = get(prevProps.item, prevProps.field, prevProps.defaultValue || '');
        const nextValue = get(this.props.item, this.props.field, this.props.defaultValue || '');

        if (prevValue !== nextValue && !nextValue && this.state.value !== '') {
            this.setState({value: '', userHasModified: false});
        }
    }

    onChange(value: string) {
        this.setState({value: value, userHasModified: true}, () => {
            this.propsOnChange(this.state.value);
        });
    }

    propsOnChange(value: string) {
        this.props.onChange(this.props.field, value);
    }

    getInputElement(): HTMLInputElement | undefined {
        return this.node.current?.getElementsByTagName('input')[0];
    }

    focus() {
        this.getInputElement()?.focus();
    }

    fetchSuggestions(field: string, language: string): Promise<Array<string>> {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<IRestApiResponse<{value: string}>>({
            method: 'GET',
            path: '/archive_autocomplete',
            urlParams: {field: field, language: language},
        }).then(
            (response) => response._items.map((_item) => _item.value).filter((value) => !!value),
            (reason) => {
                console.warn(reason);
                return [];
            }
        );
    }

    searchSuggestions(searchString: string, callback: (result: Array<any>) => void) {
        callback(this.state.suggestions.filter(
            (name) => name.toLowerCase().includes(searchString.toLowerCase()),
        ));

        // eslint-disable-next-line no-empty-function
        return {cancel: () => {}};
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
                {this.state.suggestions.length === 0 ? (
                    <Input
                        value={value}
                        type={this.props.type ?? 'text'}
                        key={this.state.key}
                        label={this.props.label}
                        required={this.props.required ?? this.props.schema?.required}
                        disabled={this.props.disabled}
                        maxLength={this.props.maxLength ?? this.props.schema?.maxlength}
                        info={this.props.info}
                        inlineLabel={this.props.inlineLabel}
                        error={this.props.showErrors ? error : undefined}
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
                        error={this.props.showErrors ? error : undefined}
                        onChange={this.onChange}
                        items={this.state.suggestions}
                        search={this.searchSuggestions}
                    />
                )}
            </Row>
        );
    }
}
