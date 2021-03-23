import React from 'react';
import moment from 'moment';
import {get} from 'lodash';
import {assignmentUtils, gettext} from '../../../../utils';
import {AbsoluteDate} from '../../../AbsoluteDate';
import {TO_BE_CONFIRMED_FIELD} from '../../../../constants';
import {IAssignmentItem} from 'interfaces';

interface IProps {
    assignment: IAssignmentItem;
}

export const DueDateComponent = ({assignment}: IProps) => {
    const isOverdue = assignmentUtils.isDue(assignment);
    const clockIconClass = isOverdue
        ? 'label-icon label-icon--warning'
        : 'label-icon';
    const assignedToProvider = assignmentUtils.isAssignedToProvider(assignment);
    const planningSchedule = get(assignment, 'planning.scheduled');

    return (
        <span
            data-sd-tooltip={gettext('Due Date')}
            data-flow="right"
            className={clockIconClass}
        >
            {assignedToProvider && <i className="icon-ingest" />}
            <i className="icon-time" />
            {planningSchedule ? (
                <AbsoluteDate
                    date={moment(planningSchedule).format()}
                    className="sd-list-item__time__schedule"
                    toBeConfirmed={get(
                        assignment,
                        `planning.${TO_BE_CONFIRMED_FIELD}`
                    )}
                />
            ) : (
                <span>{gettext('\'not scheduled yet\'')}</span>
            )}
            {isOverdue && (
                <span className="label label--warning label--hollow">
                    {gettext('due')}
                </span>
            )}
        </span>
    );
};
