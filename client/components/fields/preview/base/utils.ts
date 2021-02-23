import {get} from 'lodash';

import {IListFieldProps} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

export function getPreviewBooleanString(props: IListFieldProps, fieldName: string) {
    const {gettext} = superdeskApi.localization;
    const field = props.field ?? fieldName;
    const value = (get(props.item, field));

    if (value == null) {
        return null;
    }

    return value == true ?
        gettext('True') :
        gettext('False');
}
