import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {IEditorFieldProps, IWorkflowState} from '../../../interfaces';

interface IProps extends IEditorFieldProps {
    excludeOptions?: Array<IWorkflowState>;
}

export class EditorFieldWorkflowState extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        let options: Array<{
            qcode: IWorkflowState,
            name: string,
        }> = [{
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
        }];

        if (this.props.excludeOptions?.length) {
            options = options.filter(
                (option) => !this.props.excludeOptions.includes(option.qcode)
            );
        }

        return (
            <EditorFieldVocabulary
                {...this.props}
                field={this.props.field ?? 'state'}
                label={this.props.label ?? gettext('State')}
                onChange={this.props.onChange}
                options={options}
            />
        );
    }
}
