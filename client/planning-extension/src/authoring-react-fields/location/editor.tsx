import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {ILocation} from '../../../../interfaces';
import {extensionBridge} from '../../extension_bridge';
import {set} from 'lodash';
import {produce} from 'immer';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;
type LocationOrDetailsValue = ILocation | string | null;

const isLocationObject = (v: LocationOrDetailsValue): v is ILocation =>
    typeof v === 'object' && v !== null;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;

        /*
        * Schema/back-end provide `location` as an array,
        * but the editor supports only a single entry.
        * If we receive an array, pick element 0; otherwise
        * treat the value as the lone ILocation.
        */
        const location: ILocation | null = this.props.value?.[0] ?? this.props.value;

        const handleChange = (field: string, value: LocationOrDetailsValue) => {
            const previousDetails = location?.details;
            const nextValue = produce({location}, (draft) => {
                set(draft, field, value);

                if (field === 'location' && previousDetails != null) {
                    const newDetails = isLocationObject(value) ? value.details : undefined;
                    const hasNewDetails = (newDetails ?? []).length > 0;

                    if (!hasNewDetails) {
                        draft.location = draft.location ?? ({} as ILocation);
                        draft.location.details = previousDetails;
                    }
                }
            });

            this.props.onChange(nextValue.location != null ? [nextValue.location] : []);
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
