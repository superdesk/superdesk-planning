import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {ILocation} from '../../../../interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;
        const location: ILocation | null =
            Array.isArray(this.props.value)
                ? this.props.value?.[0] ?? null
                : (this.props.value as any) ?? null;

        const handleChange = (field: string, value: any) => {
            const previousDetails = location?.details;
            const nextValue: {location: ILocation | null} = {
                location: cloneDeep(location ?? ({} as ILocation)),
            };

            set(nextValue, field, value);

            if (field === 'location' && previousDetails != null) {
                const newDetails = (value as ILocation | null)?.details;
                const hasNewDetails = Array.isArray(newDetails) && newDetails.length > 0;

                if (hasNewDetails === false) {
                    nextValue.location = nextValue.location ?? ({} as ILocation);
                    nextValue.location.details = previousDetails;
                }
            }

            this.props.onChange([nextValue.location] as ILocationValueOperational);
        };

        return (
            <EditorFieldLocation
                field="location"
                enableExternalSearch
                item={{location}}
                required={this.props.config.required}
                disabled={this.props.config.readOnly}
                onChange={handleChange}
            />
        );
    }
}
