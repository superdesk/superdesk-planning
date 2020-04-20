import React from 'react';
import {get} from 'lodash';

export const DeskComponent = ({assignedDesk}) => {
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
