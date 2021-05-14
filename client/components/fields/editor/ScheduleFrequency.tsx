import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {SCHEDULE_FREQUENCY, IEditorFieldProps} from '../../../interfaces';

import {EditorFieldRadio} from './base/radio';

export class EditorFieldScheduleFrequency extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldRadio
                {...this.props}
                field={this.props.field ?? 'frequency'}
                label={this.props.label ?? gettext('Frequency')}
                defaultValue={SCHEDULE_FREQUENCY.HOURLY}
                options={[{
                    value: SCHEDULE_FREQUENCY.HOURLY,
                    label: gettext('Hourly'),
                }, {
                    value: SCHEDULE_FREQUENCY.WEEKLY,
                    label: gettext('Weekly'),
                }, {
                    value: SCHEDULE_FREQUENCY.MONTHLY,
                    label: gettext('Monthly'),
                }]}
                size="medium-3"
                noMargin={true}
            />
        );
    }
}
