import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldAdHocPlanning extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                {...this.props}
                field={this.props.field ?? 'ad_hoc_planning'}
                label={this.props.label ?? gettext('Ad Hoc Planning')}
                defaultValue={false}
            />
        );
    }
}
