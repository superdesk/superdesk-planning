import {IProfileSchemaType, IProfileSchemaType, IProfileSchemaTypeString} from 'interfaces';
import {omit} from 'lodash';
import {IBaseRestApiResponse} from 'superdesk-api';

export function omitFields<T extends IBaseRestApiResponse>(
    item: Partial<T>,
    omitId: boolean = false, // useful when patching
): Partial<T> {
    const baseApiFields = [
        '_created',
        '_links',
        '_updated',
        '_etag',
        '_status',
    ];

    if (omitId) {
        baseApiFields.push('_id');
    }

    return {...omit(item, baseApiFields)};
}

export function isMultiLineField(fieldSchema: IProfileSchemaType) {
    return (fieldSchema as IProfileSchemaTypeString)?.field_type === 'multi_line';
}
