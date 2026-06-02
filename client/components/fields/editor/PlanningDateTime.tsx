import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IPlanningItem} from '../../../interfaces';
import {EditorFieldDateTime} from './base/dateTime';
import {appConfig} from 'appConfig';
import moment from 'moment';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

interface IProps extends IEditorFieldProps {
    item: IPlanningItem;
    canClear?: boolean;
    timeField?: string;
    onToBeConfirmed?(field: string): void;
}

export class EditorFieldPlanningDateTime extends React.PureComponent<IProps> {
    allDay = appConfig.planning.all_day;

    constructor(props: IProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(fieldOrValues: string | { [key: string]: any }, value?: any) {
        if (typeof fieldOrValues === 'string') {
            const momentValue = moment(value);
            const updateValue = momentValue.isValid() ? this.formatValue(momentValue) : null;

            const updatedFields: any = {
                [fieldOrValues]: updateValue,
                all_day: this.allDay,
            };

            if (updateValue !== null) {
                updatedFields._time_to_be_confirmed = false;
            }

            this.props.onChange(updatedFields);
        } else {
            this.props.onChange(fieldOrValues);
        }
    }

    formatValue(value: moment.Moment) : moment.MomentInput {
        return this.allDay ? moment.utc(value.format('YYYY-MM-DD')) : value;
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            field,
            label,
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldDateTime
                ref={refNode}
                {...props}
                field={field ?? 'planning_date'}
                label={label ?? gettext('Planning Date')}
                showToBeConfirmed={true}
                toBeConfirmed={this.props.item?._time_to_be_confirmed == true}
                onToBeConfirmed={() => {
                    this.props.onChange({[TO_BE_CONFIRMED_FIELD]: true});
                }}
                singleValue={true}
                allDay={this.allDay}
                hideTime={this.allDay}
                onChange={this.onChange}
            />
        );
    }
}
