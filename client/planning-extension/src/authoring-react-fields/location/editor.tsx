import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;
        const location = Array.isArray(this.props.value) ? this.props.value[0] : this.props.value;

        return (
            <EditorFieldLocation
                field="location"
                enableExternalSearch
                item={{location: location ?? {}}}
                required={this.props.config.required}
                disabled={this.props.config.readOnly}
                onChange={(field: string, value: any) => {
                    const currentDetails = location?.details;
                    const valueCopy = {location: cloneDeep(location ?? {})};

                    set(valueCopy, field, value);

                    // Preserve location.details if a new location is selected and details are present
                    if (field === 'location' && currentDetails && !value?.details) {
                        set(valueCopy, 'location.details', currentDetails);
                    }
                    this.props.onChange([valueCopy.location]);
                }}
            />
        );
    }
}
