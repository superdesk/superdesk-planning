import * as React from 'react';
import moment from 'moment';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';

import {EditorFieldDateOnly} from './DateOnly';

interface IProps extends IEditorFieldProps {
    onChangeMultiple(updates: {[key: string]: any}): void;
}

export class EditorFieldCreationDate extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onStartDateChange = this.onStartDateChange.bind(this);
        this.onEndDateChange = this.onEndDateChange.bind(this);
    }

    onStartDateChange(_field: string, value: any) {
        this.props.onChangeMultiple({
            created_start_date: value == null ? value : moment(value).startOf('day'),
        });
    }

    onEndDateChange(_field: string, value: any) {
        this.props.onChangeMultiple({
            created_end_date: value == null ? value : moment(value).endOf('day'),
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const props = this.props;

        return (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12}}>
                <EditorFieldDateOnly
                    {...props}
                    field="created_start_date"
                    label={gettext('From')}
                    onChange={this.onStartDateChange}
                    canClear={true}
                />
                <EditorFieldDateOnly
                    {...props}
                    field="created_end_date"
                    label={gettext('To')}
                    onChange={this.onEndDateChange}
                    canClear={true}
                />
            </div>
        );
    }
}
