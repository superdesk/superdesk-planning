import * as React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {GeoLookupInput} from '../../GeoLookupInput';
import {Row} from '../../UI/Form';
import {IEditorFieldLocationProps} from './Location.interface';
import {get} from 'lodash';
import {Input} from 'superdesk-ui-framework/react';

/**
 * The component was originally designed to use `ILocation` as value.
 * It was needed later to store it as `Array<ILocation>` - `storeAsArray` prop was added.
 * Even though it was implemented to make it possible to store value as an array, it only supports a single value.
 */
export class EditorFieldLocation extends React.PureComponent<IEditorFieldLocationProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'location';
        const props = this.props;

        const originalValue = get(props.item, field);
        const valueSingle = props.storeAsArray === true ? originalValue?.[0] : originalValue;

        const onChange = (field, value) => {
            const valueNext = (() => {
                if (props.storeAsArray === true) {
                    if (value == null) {
                        return [];
                    } else {
                        return [value];
                    }
                } else {
                    return value;
                }
            })();

            props.onChange(
                field,
                valueNext,
            );
        };

        return (
            <>
                <Row testId={this.props.testId}>
                    <GeoLookupInput
                        {...props}
                        onChange={onChange} // overwrites onChange from props spread above
                        field={field}
                        label={props.label ?? gettext('Location')}
                        value={valueSingle}
                        disableSearch={!props.enableExternalSearch}
                        disableAddLocation={props.disableAddLocation}
                        readOnly={props.disabled}
                    />
                </Row>

                {
                    valueSingle != null && (
                        <Row>
                            <Input
                                type="text"
                                label={gettext('Location Details')}
                                value={valueSingle?.details ?? ''}
                                onChange={(val) => {
                                    onChange(field, {
                                        ...valueSingle,
                                        details: val,
                                    });
                                }}
                            />
                        </Row>
                    )
                }
            </>
        );
    }
}
