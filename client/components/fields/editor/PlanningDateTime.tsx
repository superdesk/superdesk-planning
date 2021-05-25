import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IPlanningItem} from '../../../interfaces';
import {EditorFieldDateTime} from './base/dateTime';

interface IProps extends IEditorFieldProps {
    item: IPlanningItem;
    canClear?: boolean;
    timeField?: string;
    onToBeConfirmed?(field: string): void;
}

export class EditorFieldPlanningDateTime extends React.PureComponent<IProps> {
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
            />
        );
    }
}
