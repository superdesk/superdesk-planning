import React from 'react';

import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {
    IPlanningItem,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
    ICoverageFormProfile,
    IFile,
} from '../../../interfaces';

import {Row as PreviewRow, ExpandableText} from '../../UI/Preview';
import {CollapseBox, FileReadOnlyList} from '../../UI';
import {stringUtils, planningUtils, assignmentUtils} from '../../../utils';
import {ContactsPreviewList} from '../../Contacts';
import {PLANNING, WORKFLOW_STATE} from '../../../constants';
import {CoverageItem} from '../';
import {CoveragePreviewTopBar} from './CoveragePreviewTopBar';
import {ScheduledUpdate} from '../ScheduledUpdate';
import {InternalNoteLabel} from '../../index';
import '../style.scss';

interface IProps {
    coverage: IPlanningCoverageItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    formProfile: ICoverageFormProfile;
    noOpen: boolean;
    active: boolean;
    scrollInView: boolean;
    onClick(): void;
    inner: boolean;
    index: number;
    item: IPlanningItem;
    planningAllowScheduledUpdates: boolean;
    createLink(file: IFile): string;
    files: Array<IFile>;
}

export class CoveragePreview extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            index,
            coverage,
            users,
            desks,
            newsCoverageStatus,
            formProfile,
            noOpen,
            onClick,
            active,
            scrollInView,
            inner,
            planningAllowScheduledUpdates,
            files,
            createLink,
        } = this.props;

        const cancelledQcode = PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode;
        const coverageStatus: IPlanningNewsCoverageStatus = coverage.news_coverage_status?.qcode === cancelledQcode ?
            PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
            newsCoverageStatus.find(
                (status) => status.qcode === coverage.news_coverage_status?.qcode
            );

        const coverageDateText = coverage.planning?.scheduled == null ?
            gettext('Not scheduled yet') :
            planningUtils.getCoverageDateTimeText(coverage);

        const keywordText = (coverage.planning?.keyword?.length ?? 0) === 0 ?
            '' :
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

        const coverageTopBar = (
            <CoveragePreviewTopBar
                item={item}
                coverage={coverage}
                users={users}
                desks={desks}
                newsCoverageStatus={newsCoverageStatus}
            />
        );

        let contactId;

        if (formProfile.editor.contact_info.enabled) {
            if (coverage.assigned_to?.contact != null) {
                contactId = coverage.assigned_to.contact;
            } else if ((coverage.planning?.contact_info?.length ?? 0) > 0) {
                contactId = coverage.planning.contact_info[0];
            }
        }

        const coverageInDetail = (
            <div className="coverage-preview__detail">
                <PreviewRow
                    label={assignmentUtils.getContactLabel(coverage)}
                    className="coverage-preview__contact"
                    enabled={contactId != null}
                >
                    <ContactsPreviewList
                        contactIds={contactId ? [contactId] : []}
                        scrollInView={true}
                        scrollIntoViewOptions={{block: 'center'}}
                    />
                </PreviewRow>

                <PreviewRow enabled={(item.coverages?.[index]?.planning?.workflow_status_reason?.length ?? 0) > 0}>
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

                <PreviewRow
                    label={gettext('Language')}
                    value={coverage.planning.language}
                    enabled={formProfile.editor.language.enabled}
                />

                <PreviewRow
                    label={gettext('Slugline')}
                    value={coverage.planning.slugline}
                    enabled={formProfile.editor.slugline.enabled}
                />

                <PreviewRow
                    label={gettext('Ed Note')}
                    value={stringUtils.convertNewlineToBreak(
                        coverage.planning.ednote || ''
                    )}
                    enabled={formProfile.editor.ednote.enabled}
                />

                <PreviewRow
                    label={gettext('Keyword')}
                    value={keywordText}
                    enabled={formProfile.editor.keyword.enabled}
                />

                <PreviewRow
                    enabled={formProfile.editor.internal_note.enabled}
                    label={gettext('Internal Note')}
                >
                    <ExpandableText value={coverage.planning.internal_note || ''} />
                </PreviewRow>

                <PreviewRow
                    label={gettext('Type')}
                    value={!coverage.planning.g2_content_type ? '' :
                        stringUtils.firstCharUpperCase(coverage.planning.g2_content_type)
                    }
                    enabled={formProfile.editor.g2_content_type.enabled}
                />

                <PreviewRow
                    label={gettext('Associated XMP File')}
                    enabled={planningUtils.showXMPFileUIControl(coverage)}
                >
                    <FileReadOnlyList
                        field={'xmp_file'}
                        files={files}
                        item={coverage.planning}
                        createLink={createLink}
                        noToggle
                    />
                </PreviewRow>

                <PreviewRow
                    label={gettext('Genre')}
                    value={coverage.planning.genre?.name}
                    enabled={formProfile.editor.genre.enabled && coverage.planning.genre != null}
                />

                <PreviewRow
                    label={gettext('Attached files')}
                    enabled={formProfile.editor.files.enabled}
                >
                    <FileReadOnlyList
                        formProfile={formProfile}
                        files={files}
                        item={coverage.planning}
                        createLink={createLink}
                        noToggle
                    />
                </PreviewRow>

                <PreviewRow
                    label={gettext('Coverage Status')}
                    value={coverageStatus?.label ?? ''}
                />

                <PreviewRow
                    label={gettext('Due')}
                    value={coverageDateText}
                    enabled={formProfile.editor.scheduled.enabled}
                />

                <PreviewRow
                    enabled={formProfile.editor.flags.enabled && coverage.flags?.no_content_linking}
                >
                    <span className="state-label not-for-publication">
                        {gettext('Do not link content updates')}
                    </span>
                </PreviewRow>

                <PreviewRow
                    label={gettext('SCHEDULED UPDATES')}
                    enabled={planningAllowScheduledUpdates}
                >
                    {(coverage.scheduled_updates || []).map((s, i) => (
                        <ScheduledUpdate
                            key={i}
                            value={s}
                            coverageIndex={index}
                            index={i}
                            users={users}
                            desks={desks}
                            newsCoverageStatus={newsCoverageStatus}
                            forPreview
                            readOnly
                        />
                    ))}
                </PreviewRow>

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
            />
        );
    }
}
