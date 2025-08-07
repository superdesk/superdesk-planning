import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {ILocation} from '../../../../interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;
type LocationOrDetailsValue = ILocation | string | null;

const isLocationObject = (v: LocationOrDetailsValue): v is ILocation =>
    typeof v === 'object' && v !== null;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;
        const location: ILocation | null = this.props.value?.[0] ?? this.props.value;

        const handleChange = (field: string, value: LocationOrDetailsValue) => {
            const previousDetails = location?.details;
            const nextValue = {location: cloneDeep(location)};

            set(nextValue, field, value);

            if (field === 'location' && previousDetails != null) {
                const newDetails = isLocationObject(value) ? value.details : undefined;
                const hasNewDetails = (newDetails ?? []).length > 0;

                if (hasNewDetails === false) {
                    nextValue.location = nextValue.location ?? ({} as ILocation);
                    nextValue.location.details = previousDetails;
                }
            }

            const finalValue = nextValue.location != null ? [nextValue.location] : [];

            this.props.onChange(finalValue);
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
