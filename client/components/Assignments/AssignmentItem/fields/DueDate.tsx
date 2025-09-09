import React from 'react';
import moment from 'moment';
import {get} from 'lodash';

import {Label} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../../../superdeskApi';

import {assignmentUtils} from '../../../../utils';
import {AbsoluteDate} from '../../../AbsoluteDate';
import {TO_BE_CONFIRMED_FIELD} from '../../../../constants';
import classNames from 'classnames';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;
export const DueDateComponent = ({assignment}: IProps) => {
    const {gettext} = superdeskApi.localization;
    const isOverdue = assignmentUtils.isDue(assignment);
    const assignedToProvider = assignmentUtils.isAssignedToProvider(assignment);
    const planningSchedule = get(assignment, 'planning.scheduled');

    return (
        <span
            title={gettext('Due Date')}
            className={classNames('assignment--due-date', 'label-icon', {'label-icon--warning': isOverdue})}
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
                <Label
                    type="warning"
                    text={gettext('due')}
                />
            )}
        </span>
    );
};
