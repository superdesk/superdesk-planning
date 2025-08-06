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
                    const currentDetails = this.props.value?.details;
                    const valueCopy = {location: cloneDeep(this.props.value ?? {})};

                    set(valueCopy, field, value);

                    // Preserve location.details if a new location was selected without details
                    if (field === 'location' && currentDetails && !value?.details) {
                        valueCopy.location = {
                            ...valueCopy.location,
                            details: currentDetails
                        };
                    }

                    this.props.onChange(valueCopy.location);
                }}
            />
        );
    }
}
