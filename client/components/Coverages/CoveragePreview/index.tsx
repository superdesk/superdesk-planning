import React from 'react';
import {get} from 'lodash';

import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {
    IEditorProfile,
    IFile,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
} from '../../../interfaces';

import {Row as PreviewRow} from '../../UI/Preview';
import {CollapseBox, FileReadOnlyList} from '../../UI';
import {assignmentUtils, planningUtils} from '../../../utils';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {ContactsPreviewList} from '../../Contacts/ContactsPreviewList';
import {WORKFLOW_STATE} from '../../../constants';
import {CoverageItem} from '../';
import {CoveragePreviewTopBar} from './CoveragePreviewTopBar';
import {ScheduledUpdate} from '../ScheduledUpdate';

import {getCustomFieldSourcePaths, renderProfileFieldsFlat} from '../../fields';

import {InternalNoteLabel} from '../../index';
import '../style.scss';

interface IProps {
    coverage: IPlanningCoverageItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    formProfile: IEditorProfile;
    noOpen?: boolean;
    active?: boolean;
    scrollInView: boolean;
    onClick?(): void;
    inner: boolean;
    index: number;
    item: IPlanningItem;
    canScheduleUpdates: boolean;
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
            canScheduleUpdates,
            files,
            createLink,
        } = this.props;

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

                {renderProfileFieldsFlat(
                    'form-preview',
                    formProfile,
                    {
                        item: coverage,
                        language: coverage.planning.language ?? getUserInterfaceLanguageFromCV(),
                        renderEmpty: true,
                        schema: formProfile?.schema,
                    },
                    {
                        ...getCustomFieldSourcePaths(formProfile, 'planning'),
                        language: {field: 'planning.language', enabled: false},
                        slugline: {field: 'planning.slugline'},
                        ednote: {field: 'planning.ednote'},
                        keyword: {field: 'planning.keyword'},
                        internal_note: {field: 'planning.internal_note'},
                        g2_content_type: {field: 'planning.g2_content_type'},
                        genre: {field: 'planning.genre'},
                        flags: {field: 'planning.flags'},
                        location: {field: 'planning.location'},
                        anpa_category: {field: 'planning.anpa_category'},
                        subject: {field: 'planning.subject'},
                        headline: {field: 'planning.headline'},
                        priority: {field: 'planning.priority'},
                    },
                    [
                        'contact_info',
                        'files',
                        'xmp_file',
                        'scheduled_updates',
                        'add_coverage_to_workflow',
                        'multiple_content',
                    ],
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

                {canScheduleUpdates && (
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
                                disabled
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
                scrollIntoViewOptions={{behavior: 'smooth'}}
            />
        );
    }
}
