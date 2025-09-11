import * as React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {GeoLookupInput} from '../../GeoLookupInput';
import {Row} from '../../UI/Form';
import {IEditorFieldLocationProps} from './Location.interface';
import {get} from 'lodash';
import {Input} from 'superdesk-ui-framework/react';
import {ILocation} from 'interfaces';

/**
 * The component was originally designed to use `ILocation` as value.
 * Later it was changed to `Array<ILocation>`.
 * Storage method was changed, but user interface remains the same - only one location can be added.
 * In addition the main child component `GeoLookupInput` and its children still operate on `ILocation` object.
 */
export class EditorFieldLocation extends React.PureComponent<IEditorFieldLocationProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'location';
        const props = this.props;


        const originalValue = get(props.item, field);
        const valueSingle =
            originalValue != null && Array.isArray(originalValue) !== true
                ? originalValue // fallback in case non-array `ILocation` is received
                : originalValue?.[0];

        const onChange = (field, value: ILocation) => {
            const valueNext: Array<ILocation> = value == null ? [] : [value];

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
