import React from 'react';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {
    ICoverageFormProfile,
    IFile,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    PREVIEW_PANEL,
} from '../../../interfaces';

import {Row as PreviewRow} from '../../UI/Preview';
import {CollapseBox, FileReadOnlyList} from '../../UI';
import {assignmentUtils, planningUtils} from '../../../utils';
import {ContactsPreviewList} from '../../Contacts';
import {PLANNING, WORKFLOW_STATE} from '../../../constants';
import {CoverageItem} from '../';
import {CoveragePreviewTopBar} from './CoveragePreviewTopBar';
import {ScheduledUpdate} from '../ScheduledUpdate';

import {previewGroupToProfile, renderFieldsForPanel} from '../../fields';

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

        const coverageStatus = get(coverage, 'news_coverage_status.qcode', '') ===
            PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode ? PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
            newsCoverageStatus.find((s) => s.qcode === get(coverage, 'news_coverage_status.qcode', '')) || {};

        const coverageDateText = !get(coverage, 'planning.scheduled') ?
            gettext('Not scheduled yet') :
            planningUtils.getCoverageDateTimeText(coverage);

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

                {renderFieldsForPanel(
                    'form-preview',
                    previewGroupToProfile(PREVIEW_PANEL.COVERAGE, formProfile),
                    {
                        item: coverage.planning,
                        language: getUserInterfaceLanguage(),
                        renderEmpty: true,
                    },
                    {}
                )}

                {planningUtils.showXMPFileUIControl(coverage) && (
                    <PreviewRow
                        label={gettext('Associated XMP File')}
                    >
                        <FileReadOnlyList
                            field={'xmp_file'}
                            files={files}
                            item={coverage.planning}
                            createLink={createLink}
                            noToggle
                        />
                    </PreviewRow>
                )}

                {get(formProfile, 'editor.genre.enabled') && coverage.planning.genre && (
                    <PreviewRow
                        label={gettext('Genre')}
                        value={get(coverage, 'planning.genre.name')}
                    />
                )}

                {get(formProfile, 'editor.files.enabled') && (
                    <PreviewRow
                        label={gettext('Attached files')}
                    >
                        <FileReadOnlyList
                            formProfile={formProfile}
                            files={files}
                            item={coverage.planning}
                            createLink={createLink}
                            noToggle
                        />
                    </PreviewRow>
                )}

                <PreviewRow
                    label={gettext('Coverage Status')}
                    value={coverageStatus.label || ''}
                />

                {get(formProfile, 'editor.scheduled.enabled') && (
                    <PreviewRow
                        label={gettext('Due')}
                        value={coverageDateText}
                    />
                )}

                {get(formProfile, 'editor.flags') && get(coverage, 'flags.no_content_linking') && (
                    <PreviewRow>
                        <span className="state-label not-for-publication">
                            {gettext('Do not link content updates')}
                        </span>
                    </PreviewRow>
                )}

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
                                forPreview
                                readOnly
                            />
                        ))}
                    </PreviewRow>
                )}

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
