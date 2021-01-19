import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {WEEK_DAY, IEditorFieldProps} from '../../../interfaces';

import {EditorFieldCheckboxGroup} from './base/checkButtonGroup';

interface IProps extends IEditorFieldProps {
    defaultAllOn?: boolean;
}

export class EditorFieldDays extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldCheckboxGroup
                field={this.props.field ?? 'week_days'}
                label={this.props.label ?? gettext('Week Days')}
                options={[{
                    value: WEEK_DAY.SUNDAY,
                    label: gettext('Su'),
                }, {
                    value: WEEK_DAY.MONDAY,
                    label: gettext('Mo'),
                }, {
                    value: WEEK_DAY.TUESDAY,
                    label: gettext('Tu'),
                }, {
                    value: WEEK_DAY.WEDNESDAY,
                    label: gettext('We'),
                }, {
                    value: WEEK_DAY.THURSDAY,
                    label: gettext('Th'),
                }, {
                    value: WEEK_DAY.FRIDAY,
                    label: gettext('Fr'),
                }, {
                    value: WEEK_DAY.SATURDAY,
                    label: gettext('Sa'),
                }]}
                defaultValue={!this.props.defaultAllOn ?
                    [] :
                    [
                        WEEK_DAY.SUNDAY,
                        WEEK_DAY.MONDAY,
                        WEEK_DAY.TUESDAY,
                        WEEK_DAY.WEDNESDAY,
                        WEEK_DAY.THURSDAY,
                        WEEK_DAY.FRIDAY,
                        WEEK_DAY.SATURDAY,
                    ]
                }
                {...this.props}
            />
        );
    }
}
