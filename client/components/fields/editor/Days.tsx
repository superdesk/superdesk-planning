import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {WEEK_DAY, IEditorFieldProps} from '../../../interfaces';

import {EditorFieldCheckboxGroup} from './base/checkButtonGroup';
import {getLocalizedWeekDayOptions} from '../../../utils/filters';

interface IProps extends IEditorFieldProps {
    defaultAllOn?: boolean;
}

export class EditorFieldDays extends React.PureComponent<IProps> {
    options: Array<{
        value: WEEK_DAY,
        label: string,
    }>;

    constructor(props) {
        super(props);

        this.options = getLocalizedWeekDayOptions();
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldCheckboxGroup
                {...this.props}
                field={this.props.field ?? 'week_days'}
                label={this.props.label ?? gettext('Week Days')}
                options={this.options}
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
            />
        );
    }
}
