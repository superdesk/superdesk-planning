import React from 'react';
import {gettext} from '../../../../utils';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const DeskComponent = (props: IProps) => {
    const assignedDeskName = props.fieldsProps?.desk.assignedDesk?.name ?? '-';

    return (
        <div className="sd-list-item__element-lm-10">
            <span className="sd-list-item__text-label">{gettext('Desk:')}</span>
            <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                <span>{assignedDeskName}</span>
            </span>
        </div>
    );
};
