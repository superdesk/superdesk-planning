import * as React from 'react';
import classNames from 'classnames';
import {get, escape as escapeHtml} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {RICH_FORMATTING_OPTION} from 'superdesk-api';
import {IEditorFieldProps, IProfileSchemaTypeString} from '../../../../interfaces';

import {Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    schema: IProfileSchemaTypeString;
    noPadding?: boolean;
}

export class EditorFieldTextEditor3 extends React.PureComponent<IProps> {
    node: React.RefObject<HTMLDivElement>;
    formatOptions: Array<RICH_FORMATTING_OPTION>;

    constructor(props) {
        super(props);

        this.node = React.createRef();
        this.formatOptions = this.props.schema.format_options ?? [
            'uppercase',
            'lowercase',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ordered list',
            'unordered list',
            'quote',
            'link',
            'underline',
            'italic',
            'bold',
            'table',
            'formatting marks',
            'remove format',
            'remove all format',
            'pre',
            'superscript',
            'subscript',
            'strikethrough',
            'tab',
            'tab as spaces',
            'undo',
            'redo',
        ];

        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);

        // If the value was previously plain text
        // then convert it to HTML now
        if (value?.length && value[0] !== '<') {
            this.props.onChange(
                field,
                escapeHtml(value)
                    .split('\n')
                    .map((line) => `<p>${line}</p>`)
                    .join('')
            );
        }
    }

    onChange(nextValue: string) {
        this.props.onChange(this.props.field, nextValue);
    }

    focus() {
        const node = this.node.current?.querySelector('[contenteditable="true"]');

        if (node != null && node instanceof HTMLElement) {
            node.focus();
        }
    }

    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);
        const {Editor3Html} = superdeskApi.components;

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
                noPadding={this.props.noPadding ?? true}
            >
                <div
                    className={
                        classNames(
                            'sd-line-input',
                            {
                                'sd-line-input--invalid': error != null,
                                'sd-line-input--required': this.props.required,
                            },
                        )
                    }
                >
                    <label className="sd-line-input__label">
                        {this.props.label}
                    </label>
                    <Editor3Html
                        editorFormat={this.formatOptions}
                        readOnly={this.props.disabled}
                        value={value}
                        onChange={this.onChange}
                        scrollContainer={`[data-reference-id="form-container--${this.props.editorType}"]`}
                    />
                    {error == null ? null : (
                        <div className="sd-line-input__message">
                            {error}
                        </div>
                    )}
                </div>
            </Row>
        );
    }
}
