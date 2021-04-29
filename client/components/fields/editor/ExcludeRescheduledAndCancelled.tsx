import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldExcludeRescheduledAndCancelled extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                {...this.props}
                field={this.props.field ?? 'exclude_rescheduled_and_cancelled'}
                label={this.props.label ?? gettext('Exclude Rescheduled And Cancelled')}
                defaultValue={false}
            />
        );
    }
}
