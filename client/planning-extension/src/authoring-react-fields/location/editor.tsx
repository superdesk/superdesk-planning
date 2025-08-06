import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;

        return (
            <EditorFieldLocation
                field="location"
                enableExternalSearch
                item={{location: this.props.value ?? {}}}
                required={this.props.config.required}
                disabled={this.props.config.readOnly}
                onChange={(field: string, value: any) => {
                    const valueCopy = {location: cloneDeep(this.props.value ?? {})};

                    set(valueCopy, field, value);
                    this.props.onChange(valueCopy.location);
                }}
            />
        );
    }
}
