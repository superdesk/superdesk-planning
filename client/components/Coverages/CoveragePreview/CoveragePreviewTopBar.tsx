import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import {get} from 'lodash';

import {appConfig} from 'appConfig';

import {Row as PreviewRow} from '../../UI/Preview';
import {getCreator, getItemInArrayById, gettext} from '../../../utils';
import {StateLabel} from '../../index';

export const CoveragePreviewTopBar = ({
    item,
    coverage,
    users,
    desks,
    newsCoverageStatus,
}) => {
    const userAssigned = getCreator(coverage, 'assigned_to.user', users);
    const deskAssigned = desks.find((d) =>
        d._id === get(coverage, 'assigned_to.desk'));

    const coverageProvider = get(coverage, 'assigned_to.coverage_provider');
    /* eslint-disable camelcase */
    const {
        assignor_user,
        assignor_desk,
        assigned_date_user,
        assigned_date_desk,
    } = get(coverage, 'assigned_to', {});

    const dateFormat = appConfig.planning.dateformat;
    const timeFormat = appConfig.planning.timeformat;
    const deskAssignor = getItemInArrayById(users, assignor_desk);
    const userAssignor = getItemInArrayById(users, assignor_user);
    const assignmentPriority = get(coverage, 'assigned_to.priority');
    let coverageTopBar = (<PreviewRow><label>Unassigned</label></PreviewRow>);

    if (deskAssigned || userAssigned) {
        coverageTopBar = (
            <div>
                <div className="TimeAndAuthor">
                    { deskAssigned && (
                        <div>
                            {gettext('Desk')}:&nbsp;
                            <span className="TimeAndAuthor__author">{deskAssigned.name.toUpperCase()}</span>
                            {' (' + moment(assigned_date_desk).format(timeFormat + ' ' + dateFormat) + ', ' +
                            get(deskAssignor, 'display_name', '').toUpperCase() + ')'}
                        </div>
                    ) }
                    { userAssigned && (
                        <div>
                            {gettext('Assignee')}&nbsp;
                            <span className="TimeAndAuthor__author">
                                {get(userAssigned, 'display_name', '').toUpperCase()}</span>
                            {' (' + moment(assigned_date_user).format(timeFormat + ' ' + dateFormat) + ', ' +
                            get(userAssignor, 'display_name', '').toUpperCase() + ')'}
                        </div>
                    ) }
                    { coverageProvider && <span> {gettext('Coverage Provider: ') + coverageProvider.name} </span>}
                </div>
                <PreviewRow>
                    <span className={'line-input priority-label priority-label--' + assignmentPriority}>
                        {assignmentPriority}</span>
                    <StateLabel
                        item={coverage.assigned_to}
                        verbose={true}
                        className="pull-right"
                    />
                </PreviewRow>
            </div>
        );
    }

    return coverageTopBar;
};

CoveragePreviewTopBar.propTypes = {
    coverage: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    newsCoverageStatus: PropTypes.array,
    formProfile: PropTypes.object,
    noOpen: PropTypes.bool,
    active: PropTypes.bool,
    scrollInView: PropTypes.bool,
    onClick: PropTypes.func,
    inner: PropTypes.bool,
    index: PropTypes.number,
    item: PropTypes.object,
    planningAllowScheduledUpdates: PropTypes.bool,
};
