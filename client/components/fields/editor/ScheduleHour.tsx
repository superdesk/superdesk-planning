import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';

import {EditorFieldSelect} from './base/select';

export class EditorFieldScheduleHour extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const onChange = (field: string, value: string) => {
            this.props.onChange(field, parseInt(value, 10));
        };

        return (
            <EditorFieldSelect
                field={this.props.field ?? 'hour'}
                label={this.props.label ?? gettext('Hour')}
                labelField="label"
                keyField="value"
                valueAsString={true}
                defaultValue={-1}
                options={[
                    {value: -1, label: gettext('Every Hour')},
                    {value: 0, label: gettext('12:00am')},
                    {value: 1, label: gettext('01:00am')},
                    {value: 2, label: gettext('02:00am')},
                    {value: 3, label: gettext('03:00am')},
                    {value: 4, label: gettext('04:00am')},
                    {value: 5, label: gettext('05:00am')},
                    {value: 6, label: gettext('06:00am')},
                    {value: 7, label: gettext('07:00am')},
                    {value: 8, label: gettext('08:00am')},
                    {value: 9, label: gettext('09:00am')},
                    {value: 10, label: gettext('10:00am')},
                    {value: 11, label: gettext('11:00am')},
                    {value: 12, label: gettext('12:00pm')},
                    {value: 13, label: gettext('01:00pm')},
                    {value: 14, label: gettext('02:00pm')},
                    {value: 15, label: gettext('03:00pm')},
                    {value: 16, label: gettext('04:00pm')},
                    {value: 17, label: gettext('05:00pm')},
                    {value: 18, label: gettext('06:00pm')},
                    {value: 19, label: gettext('07:00pm')},
                    {value: 20, label: gettext('08:00pm')},
                    {value: 21, label: gettext('09:00pm')},
                    {value: 22, label: gettext('10:00pm')},
                    {value: 23, label: gettext('11:00pm')},
                ]}
                {...this.props}
                onChange={onChange}
            />
        );
    }
}
