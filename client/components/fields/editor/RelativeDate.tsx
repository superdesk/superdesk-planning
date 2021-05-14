import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {DATE_RANGE, IEditorFieldProps} from '../../../interfaces';

import {EditorFieldRadio} from './base/radio';

export class EditorFieldRelativeDate extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldRadio
                {...this.props}
                field={this.props.field ?? 'date_filter'}
                label={this.props.label ?? gettext('Date Filters')}
                defaultValue={''}
                options={[{
                    value: DATE_RANGE.TODAY,
                    label: gettext('Today'),
                }, {
                    value: DATE_RANGE.TOMORROW,
                    label: gettext('Tomorrow'),
                }, {
                    value: DATE_RANGE.THIS_WEEK,
                    label: gettext('This Week'),
                }, {
                    value: DATE_RANGE.NEXT_WEEK,
                    label: gettext('Next Week'),
                }]}
            />
        );
    }
}
