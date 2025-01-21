import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {extensionBridge} from '../../extension_bridge';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;

        const convertedValue = (() => {
            if (this.props.value?.[0] != null) {
                return this.props.value[0];
            }

            return this.props.value;
        })();

        return (
            <EditorFieldLocation
                field="location"
                enableExternalSearch
                item={{
                    location: convertedValue,
                }}
                required={this.props.config.required}
                disabled={this.props.config.readOnly}
                onChange={(_field, value) => {
                    this.props.onChange(value);
                }}
            />
        );
    }
}
