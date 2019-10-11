import React from 'react';
import PropTypes from 'prop-types';
import {Row as PreviewRow} from '../../UI/Preview';
import {CollapseBox} from '../../UI';
import {get} from 'lodash';
import {gettext, stringUtils, planningUtils} from '../../../utils';
import {ContactsPreviewList} from '../../Contacts/index';
import {PLANNING, WORKFLOW_STATE, DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT} from '../../../constants';

import {CoverageItem} from '../';
import {CoveragePreviewTopBar} from './CoveragePreviewTopBar';
import {ScheduledUpdate} from '../ScheduledUpdate';
import {InternalNoteLabel} from '../../index';

export const CoveragePreview = ({
    item,
    index,
    coverage,
    users,
    desks,
    newsCoverageStatus,
    dateFormat,
    timeFormat,
    formProfile,
    noOpen,
    onClick,
    active,
    scrollInView,
    inner,
    planningAllowScheduledUpdates,
}) => {
    const coverageStatus = get(coverage, 'news_coverage_status.qcode', '') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode ? PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
        newsCoverageStatus.find((s) => s.qcode === get(coverage, 'news_coverage_status.qcode', '')) || {};

    const keywordText = get(coverage, 'planning.keyword.length', 0) === 0 ? '' :
        coverage.planning.keyword.join(', ');

    const coverageListItem = (
        <CoverageItem
            item={item}
            index={index}
            coverage={coverage}
            users={users}
            desks={desks}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            readOnly={true}
            isPreview
            active={active}
        />
    );

    const coverageTopBar = (<CoveragePreviewTopBar
        item={item}
        coverage={coverage}
        users={users}
        desks={desks}
        newsCoverageStatus={newsCoverageStatus}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
    />);

    const coverageInDetail = (
        <div>
            <PreviewRow>
                <InternalNoteLabel
                    item={item}
                    prefix={`coverages[${index}].planning.`}
                    noteField="workflow_status_reason"
                    showTooltip={false}
                    showText
                    stateField = {coverage.workflow_status === WORKFLOW_STATE.CANCELLED ?
                        `coverages[${index}].workflow_status` : 'state'}
                    showHeaderText={false} />
            </PreviewRow>
            {get(formProfile, 'editor.slugline.enabled') &&
                <PreviewRow
                    label={gettext('Slugline')}
                    value={coverage.planning.slugline}
                />
            }

            {get(formProfile, 'editor.ednote.enabled') &&
                <PreviewRow
                    label={gettext('Ed Note')}
                    value={stringUtils.convertNewlineToBreak(
                        coverage.planning.ednote || ''
                    )}
                />
            }

            {get(formProfile, 'editor.keyword.enabled') &&
                <PreviewRow
                    label={gettext('Keyword')}
                    value={keywordText}
                />
            }

            {get(formProfile, 'editor.internal_note.enabled') &&
                <PreviewRow
                    label={gettext('Internal Note')}
                    value={stringUtils.convertNewlineToBreak(
                        coverage.planning.internal_note || ''
                    )}
                />
            }

            {get(formProfile, 'editor.g2_content_type.enabled') &&
                <PreviewRow
                    label={gettext('Type')}
                    value={!coverage.planning.g2_content_type ? '' :
                        stringUtils.firstCharUpperCase(coverage.planning.g2_content_type)
                    }
                />
            }

            {get(formProfile, 'editor.genre.enabled') && coverage.planning.genre &&
                <PreviewRow
                    label={gettext('Genre')}
                    value={get(coverage, 'planning.genre.name')}
                />
            }

            {get(formProfile, 'editor.contact_info.enabled') && coverage.planning.contact_info &&
                <PreviewRow label={gettext('Coverage Provider Contact')}>
                    <ContactsPreviewList
                        contactIds={get(coverage, 'planning.contact_info.length', 0) > 0 ?
                            [coverage.planning.contact_info] : []}
                        scrollInView={true}
                        scrollIntoViewOptions={{block: 'center'}}
                    />
                </PreviewRow>
            }

            <PreviewRow
                label={gettext('Coverage Status')}
                value={coverageStatus.label || ''}
            />

            {get(formProfile, 'editor.scheduled.enabled') &&
                <PreviewRow
                    label={gettext('Due')}
                    value={planningUtils.getCoverageDateText(coverage, dateFormat, timeFormat)}
                />
            }

            {get(formProfile, 'editor.flags') && get(coverage, 'flags.no_content_linking') &&
                <PreviewRow>
                    <span className="state-label not-for-publication">{gettext('Do not link content updates')}</span>
                </PreviewRow>
            }

            {planningAllowScheduledUpdates && (
                <PreviewRow label={gettext('SCHEDULED UPDATES')}>
                    {(coverage.scheduled_updates || []).map((s, i) => (
                        <ScheduledUpdate
                            key={i}
                            value={s}
                            coverageIndex={index}
                            index={i}
                            users={users}
                            desks={desks}
                            newsCoverageStatus={newsCoverageStatus}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                            forPreview
                            readOnly />
                    ))}
                </PreviewRow>)}

        </div>
    );

    return (
        <CollapseBox
            collapsedItem={coverageListItem}
            openItemTopBar={coverageTopBar}
            openItem={coverageInDetail}
            onClick={onClick}
            noOpen={noOpen}
            scrollInView={scrollInView}
            forceScroll={active}
            inner={inner}
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
    noOpen: PropTypes.bool,
    active: PropTypes.bool,
    scrollInView: PropTypes.bool,
    onClick: PropTypes.func,
    inner: PropTypes.bool,
    index: PropTypes.number,
    item: PropTypes.object,
    planningAllowScheduledUpdates: PropTypes.bool,
};


CoveragePreview.defaultProps = {
    dateFormat: DEFAULT_DATE_FORMAT,
    timeFormat: DEFAULT_TIME_FORMAT,
};
