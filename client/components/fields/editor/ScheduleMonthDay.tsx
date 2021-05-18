import * as React from 'react';
import {get, set} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';

import {EditorFieldSelect} from './base/select';

export class EditorFieldScheduleMonthDay extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        // Use our own item here so we can convert the supplied value
        // from a number to a string (as Select inputs require a string)
        const field = this.props.field ?? 'month_day';
        const value = get(this.props.item, field, -1);
        const item = {};

        set(item, field, value.toString());

        const onChange = (field: string, value: string) => {
            this.props.onChange(field, parseInt(value, 10));
        };

        return (
            <EditorFieldSelect
                {...this.props}
                field={field}
                label={this.props.label ?? gettext('Day of the Month')}
                labelField="label"
                keyField="value"
                valueAsString={true}
                defaultValue={-1}
                options={[
                    {value: 1, label: gettext('First Day')},
                    {value: 2, label: gettext('2nd')},
                    {value: 3, label: gettext('3rd')},
                    {value: 4, label: gettext('4th')},
                    {value: 5, label: gettext('5th')},
                    {value: 6, label: gettext('6th')},
                    {value: 7, label: gettext('7th')},
                    {value: 8, label: gettext('8th')},
                    {value: 9, label: gettext('9th')},
                    {value: 10, label: gettext('10th')},
                    {value: 11, label: gettext('11th')},
                    {value: 12, label: gettext('12th')},
                    {value: 13, label: gettext('13th')},
                    {value: 14, label: gettext('14th')},
                    {value: 15, label: gettext('15th')},
                    {value: 16, label: gettext('16th')},
                    {value: 17, label: gettext('17th')},
                    {value: 18, label: gettext('18th')},
                    {value: 19, label: gettext('19th')},
                    {value: 20, label: gettext('20th')},
                    {value: 21, label: gettext('21st')},
                    {value: 22, label: gettext('22nd')},
                    {value: 23, label: gettext('23rd')},
                    {value: 24, label: gettext('24th')},
                    {value: 25, label: gettext('25th')},
                    {value: 26, label: gettext('26th')},
                    {value: 27, label: gettext('27th')},
                    {value: 28, label: gettext('28th')},
                    {value: 29, label: gettext('Last Day')},

                ]}
                item={item}
                onChange={onChange}
            />
        );
    }
}
