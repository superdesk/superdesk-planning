import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {IEditorFieldProps} from '../../../interfaces';

export class EditorFieldWorkflowState extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                field={this.props.field ?? 'state'}
                label={this.props.label ?? gettext('State')}
                onChange={this.props.onChange}
                options={[{
                    qcode: 'draft',
                    name: gettext('Draft'),
                }, {
                    qcode: 'ingested',
                    name: gettext('Ingested'),
                }, {
                    qcode: 'scheduled',
                    name: gettext('Scheduled'),
                }, {
                    qcode: 'killed',
                    name: gettext('Killed'),
                }, {
                    qcode: 'cancelled',
                    name: gettext('Cancelled'),
                }, {
                    qcode: 'rescheduled',
                    name: gettext('Rescheduled'),
                }, {
                    qcode: 'postponed',
                    name: gettext('Postponed'),
                }, {
                    qcode: 'spiked',
                    name: gettext('Spiked'),
                }]}
                {...this.props}
            />
        );
    }
}
