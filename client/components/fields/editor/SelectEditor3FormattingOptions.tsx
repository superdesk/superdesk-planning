import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {RICH_FORMATTING_OPTION} from 'superdesk-api';

import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldVocabulary} from './base/vocabulary';

interface IFormatOption {
    qcode: RICH_FORMATTING_OPTION;
    name: string;
}

function getFormattingOptions(): Array<IFormatOption> {
    const {gettext} = superdeskApi.localization;

    return [
        {qcode: 'uppercase', name: gettext('Uppercase')},
        {qcode: 'lowercase', name: gettext('Lowercase')},
        {qcode: 'h1', name: gettext('H1')},
        {qcode: 'h2', name: gettext('H2')},
        {qcode: 'h3', name: gettext('H3')},
        {qcode: 'h4', name: gettext('H4')},
        {qcode: 'h5', name: gettext('H5')},
        {qcode: 'h6', name: gettext('H6')},
        {qcode: 'ordered list', name: gettext('Ordered List')},
        {qcode: 'unordered list', name: gettext('Unordered List')},
        {qcode: 'quote', name: gettext('Quote')},
        {qcode: 'link', name: gettext('Link')},
        {qcode: 'underline', name: gettext('Underline')},
        {qcode: 'italic', name: gettext('Italic')},
        {qcode: 'bold', name: gettext('Bold')},
        {qcode: 'table', name: gettext('Table')},
        {qcode: 'formatting marks', name: gettext('Formatting Marks')},
        {qcode: 'remove format', name: gettext('Remove Format')},
        {qcode: 'remove all format', name: gettext('Remove All Format')},
        {qcode: 'pre', name: gettext('Preformatted')},
        {qcode: 'superscript', name: gettext('Superscript')},
        {qcode: 'subscript', name: gettext('Subscript')},
        {qcode: 'strikethrough', name: gettext('Strikethrough')},
        {qcode: 'tab', name: gettext('Tab')},
        {qcode: 'tab as spaces', name: gettext('Tab As Spaces')},
        {qcode: 'undo', name: gettext('Undo')},
        {qcode: 'redo', name: gettext('Redo')},
    ];
}

interface IProps extends IEditorFieldProps {
    onChange(field: string, value: RICH_FORMATTING_OPTION): void;
}

export class SelectEditor3FormattingOptions extends React.PureComponent<IProps> {
    formattingOptions: Array<IFormatOption>;

    constructor(props: IEditorFieldProps) {
        super(props);

        this.formattingOptions = getFormattingOptions();
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                {...this.props}
                options={this.formattingOptions}
                defaultValue={[]}
                label={this.props.label ?? gettext('Formatting Options')}
                field={this.props.field ?? 'format_options'}
                valueAsString={true}
            />
        );
    }
}

