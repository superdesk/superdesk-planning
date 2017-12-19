import React from 'react';
import PropTypes from 'prop-types';
import {Item, Column, Row} from '../UI/List';
import {Row as PreviewRow} from '../UI/Preview';
import {CollapseBox} from '../UI/CollapseBox';
import classNames from 'classnames';
import moment from 'moment-timezone';
import {get} from 'lodash';
import {getCoverageIcon, getCreator, getItemInArrayById, getDateTimeString, gettext} from '../../utils';
import {UserAvatar, StateLabel} from '../index';

export const CoveragePreview = ({coverage, users, desks, newsCoverageStatus, dateFormat, timeFormat, formProfile}) => {
    const userAssigned = getCreator(coverage, 'assigned_to.user', users);
    const deskAssigned = desks.find((d) =>
        d._id === get(coverage, 'assigned_to.desk'));
    const coverageDate = get(coverage, 'planning.scheduled');
    const classes = classNames(
        getCoverageIcon(get(coverage, 'planning.g2_content_type')),
        {
            'icon--green': coverageDate && moment(coverageDate).isAfter(moment()),
            'icon--red': coverageDate && !moment(coverageDate).isAfter(moment()),
        }
    );
    const coverageProvider = get(coverage, 'assigned_to.coverage_provider');
    /* eslint-disable camelcase */
    const {
        assignor_user,
        assignor_desk,
        assigned_date_user,
        assigned_date_desk,
    } = coverage.assigned_to;

    const deskAssignor = getItemInArrayById(users, assignor_desk);
    const userAssignor = getItemInArrayById(users, assignor_user);
    const coverageStatus = newsCoverageStatus.find((s) => s.qcode === coverage.news_coverage_status.qcode);
    const coverageDateText = !coverageDate ? 'Not scheduled yet' :
        getDateTimeString(coverageDate, dateFormat, timeFormat);
    const assignmentPriority = get(coverage, 'assigned_to.priority');
    const keywordText = get(coverage, 'planning.keyword.length', 0) === 0 ? '' :
        coverage.planning.keyword.join(', ');

    const coverageListItem = (
        <Item noBg={true}>
            <Column border={false}>
                <Row>
                    <i className={classes}/>&nbsp;&nbsp;
                    {userAssigned && <UserAvatar user={userAssigned}/>}
                    {!userAssigned && !deskAssigned && <span>Not assigned</span>}
                    {deskAssigned && <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {gettext('Desk:') + get(deskAssigned, 'name')}
                    </span>}
                    <i className="icon-time"/>
                    <time><span>{coverageDateText}</span></time>
                </Row>
            </Column>
        </Item>
    );

    let coverageTopBar = (<PreviewRow><label>Unassigned</label></PreviewRow>);

    if (deskAssigned || userAssigned) {
        coverageTopBar = (
            <div>
                <div className="TimeAndAuthor">
                    { deskAssigned && <div>
                        {gettext('Desk')}:&nbsp;
                        <span className="TimeAndAuthor__author">{deskAssigned.name.toUpperCase()}</span>
                        {' (' + moment(assigned_date_desk).format(timeFormat + ' ' + dateFormat) + ', ' +
                            get(deskAssignor, 'display_name', '').toUpperCase() + ')'}
                    </div> }
                    { userAssigned && <div>
                        {gettext('Assignee')}&nbsp;
                        <span className="TimeAndAuthor__author">
                            {get(userAssigned, 'display_name', '').toUpperCase()}</span>
                        {' (' + moment(assigned_date_user).format(timeFormat + ' ' + dateFormat) + ', ' +
                            get(userAssignor, 'display_name', '').toUpperCase() + ')'}
                    </div> }
                    { coverageProvider && <span> {gettext('Coverage Provider: ') + coverageProvider.name} </span>}
                </div>
                <PreviewRow>
                    <span className={'line-input priority-label priority-label--' + assignmentPriority}>
                        {assignmentPriority}</span>
                    <StateLabel item={coverage.assigned_to}
                        verbose={true}
                        className="pull-right"/>
                </PreviewRow>
            </div>
        );
    }

    const coverageInDetail = (
        <div>
            {get(formProfile, 'editor.slugline.enabled') &&
            <PreviewRow label={gettext('Slugline')} value={coverage.planning.slugline} />}
            {get(formProfile, 'editor.ednote.enabled') &&
            <PreviewRow label={gettext('Ed Note')} value={coverage.planning.ednote} />}
            {get(formProfile, 'editor.keyword.enabled') &&
            <PreviewRow label={gettext('Keyword')} value={keywordText} />}
            {get(formProfile, 'editor.internal_note.enabled') &&
            <PreviewRow label={gettext('Internal Note')} value={coverage.planning.internal_note} />}
            {get(formProfile, 'editor.g2_content_type.enabled') &&
            <PreviewRow label={gettext('Type')}
                value={coverage.planning.g2_content_type.charAt(0).toUpperCase() +
                 coverage.planning.g2_content_type.slice(1)} />}
            {get(formProfile, 'editor.genre.enabled') && coverage.planning.genre &&
                <PreviewRow label={gettext('Genre')} value={get(coverage, 'planning.genre.name')} />}
            <PreviewRow label={gettext('Coverage Status')} value={coverageStatus.label || ''} />
            {get(formProfile, 'editor.scheduled.enabled') &&
            <PreviewRow label={gettext('Due')} value={coverageDateText} />}
        </div>
    );

    return (
        <CollapseBox
            collapsedItem={coverageListItem}
            openItemTopBar={coverageTopBar}
            openItem={coverageInDetail}
        />);
};

CoveragePreview.propTypes = {
    coverage: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    newsCoverageStatus: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    formProfile: PropTypes.object,
};


CoveragePreview.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
