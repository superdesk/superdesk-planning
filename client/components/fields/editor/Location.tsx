import * as React from 'react';
import {get} from 'lodash';
import {IEditorFieldProps} from '../../../interfaces';

import {superdeskApi} from '../../../superdeskApi';
import {GeoLookupInput} from '../../GeoLookupInput';

export class EditorFieldLocation extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'location';

        return (
            <GeoLookupInput
                field={field}
                label={this.props.label ?? gettext('Location')}
                value={get(this.props.item, field, this.props.defaultValue)}
                disableSearch={true}
                {...this.props}
            />
        );
    }
}
