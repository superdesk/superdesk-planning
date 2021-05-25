import * as React from 'react';
import {set, get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';

import {EditorFieldSelect} from './base/select';
import {getLocalizedHourOptions} from '../../../utils/filters';

export class EditorFieldScheduleHour extends React.PureComponent<IEditorFieldProps> {
    options: Array<{
        value: string;
        label: string;
    }>;

    constructor(props) {
        super(props);

        this.options = getLocalizedHourOptions();
    }

    render() {
        const {gettext} = superdeskApi.localization;

        // Use our own item here so we can convert the supplied value
        // from a number to a string (as Select inputs require a string)
        const field = this.props.field ?? 'hour';
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
                label={this.props.label ?? gettext('Hour')}
                labelField="label"
                keyField="value"
                valueAsString={true}
                defaultValue={'-1'}
                options={this.options}
                item={item}
                onChange={onChange}
            />
        );
    }
}
