import React from 'react';
import {get} from 'lodash';
import {gettext} from '../../../../utils';

interface IProps {
    assignedDesk: any;
}

export const DeskComponent = ({assignedDesk}: IProps) => {
    const assignedDeskName = get(assignedDesk, 'name') || '-';

    return (
        <div className="sd-list-item__element-lm-10">
            <span className="sd-list-item__text-label">{gettext('Desk:')}</span>
            <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                <span>{assignedDeskName}</span>
            </span>
        </div>
    );
};
