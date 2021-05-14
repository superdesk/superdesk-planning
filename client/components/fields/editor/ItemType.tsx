import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';

export class EditorFieldItemType extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.props.field ?? 'item_type'}
                label={this.props.label ?? gettext('Item Type')}
                options={[{
                    qcode: 'combined',
                    label: gettext('Combined'),
                }, {
                    qcode: 'events',
                    label: gettext('Events'),
                }, {
                    qcode: 'planning',
                    label: gettext('Planning'),
                }]}
                valueAsString={true}
                defaultValue={'combined'}
            />
        );
    }
}
