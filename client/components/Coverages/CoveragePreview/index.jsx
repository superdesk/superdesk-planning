import React from 'react';
import PropTypes from 'prop-types';
import {Row as PreviewRow, ExpandableRow} from '../../UI/Preview';
import {CollapseBox, FileReadOnlyList} from '../../UI';
import {get} from 'lodash';
import {gettext, stringUtils, planningUtils, assignmentUtils} from '../../../utils';
import {ContactsPreviewList} from '../../Contacts/index';
import {PLANNING, WORKFLOW_STATE, DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT} from '../../../constants';
import {CoverageItem} from '../';
import {CoveragePreviewTopBar} from './CoveragePreviewTopBar';
import {ScheduledUpdate} from '../ScheduledUpdate';
import {InternalNoteLabel} from '../../index';
import '../style.scss';

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
    files,
    createLink,
    useXmpFile,
}) => {
    const coverageStatus = get(coverage, 'news_coverage_status.qcode', '') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode ? PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
        newsCoverageStatus.find((s) => s.qcode === get(coverage, 'news_coverage_status.qcode', '')) || {};

    const coverageDateText = !get(coverage, 'planning.scheduled') ? gettext('Not scheduled yet') :
        planningUtils.getCoverageDateTimeText(coverage, dateFormat, timeFormat);

    const keywordText = get(coverage, 'planning.keyword.length', 0) === 0 ? '' :
        coverage.planning.keyword.join(', ');

    const coverageListItem = (
        <CoverageItem
            item={item}
            index={index}
            coverage={coverage}
            readOnly={true}
            isPreview={true}
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

    let contactId;

    if (get(formProfile, 'editor.contact_info.enabled')) {
        if (get(coverage, 'assigned_to.contact')) {
            contactId = coverage.assigned_to.contact;
        } else if (get(coverage, 'planning.contact_info.length', 0) > 0) {
            contactId = coverage.planning.contact_info[0];
        }
    }

    const coverageInDetail = (
        <div className="coverage-preview__detail">
            {contactId && (
                <PreviewRow
                    label={assignmentUtils.getContactLabel(coverage)}
                    className="coverage-preview__contact"
                >
                    <ContactsPreviewList
                        contactIds={contactId ? [contactId] : []}
                        scrollInView={true}
                        scrollIntoViewOptions={{block: 'center'}}
                    />
                </PreviewRow>
            )}

            <PreviewRow enabled={get(item, `coverages[${index}].planning.workflow_status_reason.length`) > 0}>
                <InternalNoteLabel
                    item={item}
                    prefix={`coverages[${index}].planning.`}
                    noteField="workflow_status_reason"
                    showTooltip={false}
                    showText={true}
                    stateField={coverage.workflow_status === WORKFLOW_STATE.CANCELLED ?
                        `coverages[${index}].workflow_status` : 'state'}
                    showHeaderText={false}
                />
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

            <ExpandableRow
                enabled={get(formProfile, 'editor.internal_note.enabled')}
                label={gettext('Internal Note')}
                value={stringUtils.convertNewlineToBreak(
                    coverage.planning.internal_note || ''
                )}
            />

            {get(formProfile, 'editor.g2_content_type.enabled') &&
                <PreviewRow
                    label={gettext('Type')}
                    value={!coverage.planning.g2_content_type ? '' :
                        stringUtils.firstCharUpperCase(coverage.planning.g2_content_type)
                    }
                />
            }

            {planningUtils.showXMPFileUIControl(coverage, useXmpFile) && (
                <PreviewRow
                    label={gettext('Associated XMP File')} >
                    <FileReadOnlyList
                        field={'xmp_file'}
                        files={files}
                        item={coverage.planning}
                        createLink={createLink}
                        noToggle />
                </PreviewRow>
            )}

            {get(formProfile, 'editor.genre.enabled') && coverage.planning.genre &&
                <PreviewRow
                    label={gettext('Genre')}
                    value={get(coverage, 'planning.genre.name')}
                />
            }

            {get(formProfile, 'editor.files.enabled') &&
                <PreviewRow
                    label={gettext('Attached files')} >
                    <FileReadOnlyList
                        formProfile={formProfile}
                        files={files}
                        item={coverage.planning}
                        createLink={createLink}
                        noToggle />
                </PreviewRow>
            }

            <PreviewRow
                label={gettext('Coverage Status')}
                value={coverageStatus.label || ''}
            />

            {get(formProfile, 'editor.scheduled.enabled') &&
                <PreviewRow
                    label={gettext('Due')}
                    value={coverageDateText}
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
    createLink: PropTypes.func,
    files: PropTypes.array,
    useXmpFile: PropTypes.bool,
};


CoveragePreview.defaultProps = {
    dateFormat: DEFAULT_DATE_FORMAT,
    timeFormat: DEFAULT_TIME_FORMAT,
};
