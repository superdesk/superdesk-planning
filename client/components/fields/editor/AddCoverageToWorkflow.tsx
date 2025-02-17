import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';
import {Tooltip} from '@sourcefabric/common';

export class EditorFieldAddCoverageToWorkflow extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <Tooltip
                disabled={this.props.disabled === false}
                content={superdeskApi.localization.gettext('You haven\'t saved the coverage or assigned it')}
            >
                <EditorFieldToggle
                    {...this.props}
                    field="add_coverage_to_workflow"
                    label={gettext('Add to workflow')}
                    defaultValue={false}
                />
            </Tooltip>
        );
    }
}
