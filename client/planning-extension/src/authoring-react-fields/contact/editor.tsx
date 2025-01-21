import * as React from 'react';
import {
    IEditorComponentProps,
    IUrlsFieldUserPreferences,
} from 'superdesk-api';
import {IContactFieldConfig, IContactValueOperational} from './interfaces';
import {extensionBridge} from '../../extension_bridge';

type IProps = IEditorComponentProps<IContactValueOperational, IContactFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {EditorFieldContact} = extensionBridge.editor.fields;

        return (
            <Container>
                <EditorFieldContact
                    testId="contact"
                    field="contact"
                    value={this.props.value as any}
                    onChange={(_field: string, value: any) => {
                        this.props.onChange(value);
                    }}
                    readOnly={this.props.config.readOnly}
                    singleValue={this.props.config.singleValue}
                />
            </Container>
        );
    }
}
