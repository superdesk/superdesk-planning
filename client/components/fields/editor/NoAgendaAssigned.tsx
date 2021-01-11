import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldNoAgendaAssigned extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldToggle
                field={this.props.field ?? 'no_agenda_assigned'}
                label={this.props.label ?? gettext('No Agenda Assigned')}
                defaultValue={false}
                {...this.props}
            />
        );
    }
}
