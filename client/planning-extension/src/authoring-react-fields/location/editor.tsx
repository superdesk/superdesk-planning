import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {ILocationFieldConfig, ILocationFieldUserPreferences, ILocationValueOperational} from './interfaces';
import {ILocation} from '../../../../interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<ILocationValueOperational, ILocationFieldConfig, ILocationFieldUserPreferences>;
type FieldValue = ILocation | string | null;

const isLocation = (v: FieldValue): v is ILocation =>
    typeof v === 'object' && v !== null;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const {EditorFieldLocation} = extensionBridge.editor.fields;
        const location: ILocation | null =
            Array.isArray(this.props.value)
                ? this.props.value?.[0] ?? null
                : (this.props.value as any) ?? null;

        const handleChange = (field: string, value: FieldValue) => {
            const previousDetails = location?.details;
            const nextValue = {
                location: location != null ? cloneDeep(location) : null,
            };

            set(nextValue, field, value);

            if (field === 'location' && previousDetails != null) {
                const newDetails = isLocation(value) ? value.details : undefined;
                const hasNewDetails = (newDetails ?? []).length > 0;

                if (hasNewDetails === false) {
                    nextValue.location = nextValue.location ?? ({} as ILocation);
                    nextValue.location.details = previousDetails;
                }
            }

            const finalValue = nextValue.location ? [nextValue.location] : [];

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
