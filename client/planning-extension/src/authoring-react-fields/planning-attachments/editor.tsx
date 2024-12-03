import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {IAttachmentsFieldConfig, IAttachmentsFieldUserPreferences, IAttachmentsValueOperational} from './interfaces';
import {extensionBridge} from '../../extension_bridge';

type IProps = IEditorComponentProps<IAttachmentsValueOperational, IAttachmentsFieldConfig, IAttachmentsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {AttachmentsInputStandalone} = extensionBridge.ui.components;

        return (
            <Container>
                <AttachmentsInputStandalone
                    value={this.props.value}
                    onChange={(value) => this.props.onChange(value)}
                    readOnly={this.props.readOnly}
                />
            </Container>
        );
    }
}
