import React from 'react';

import {
    IAssignmentItem,
    IPlanningItem,
    ICoveragePlanningDetails,
    ICoverageFormProfile,
    IPlanningFormProfile,
    IFile,
} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {stringUtils, assignmentUtils, planningUtils} from '../../../utils';

import {InternalNoteLabel} from '../../';
import {ContactsPreviewList} from '../../Contacts';
import {Row} from '../../UI/Preview';
import {FileReadOnlyList} from '../../UI';

interface IProps {
    assignment: IAssignmentItem;
    keywords: Array<{
        qcode: string;
        name: string;
    }>;
    coverageFormProfile: ICoverageFormProfile;
    planningFormProfile: IPlanningFormProfile;
    planningItem: IPlanningItem;
    files: Array<IFile>;
    createLink(file: IFile): string;
}

export class AssignmentPreview extends React.PureComponent<IProps> {
    render() {
        const {
            assignment,
            keywords,
            coverageFormProfile,
            planningFormProfile,
            planningItem,
            files,
            createLink,
        } = this.props;

        const planning: Partial<ICoveragePlanningDetails> = assignment?.planning ?? {};

        function getKeywordNameOrQcode(qcode: string): string {
            const keyword = keywords.find((k) => k.qcode === qcode);

            return keyword?.name ?? qcode;
        }

        const keywordString = (planning.keyword?.length ?? 0) > 0 ?
            planning.keyword
                .map(getKeywordNameOrQcode)
                .join(', ')
            : '-';

        const placeText = (planningItem.place?.length ?? 0) > 0 ?
            planningItem.place
                .map((c) => c.name)
                .join(', ') :
            '-';

        const categoryText = (planningItem.anpa_category?.length ?? 0) > 0 ?
            planningItem.anpa_category
                .map((c) => c.name)
                .join(', ') :
            '-';

        const subjectText = (planningItem.subject?.length ?? 0) > 0 ?
            planningItem.subject
                .map((s) => s.name)
                .join(', ') :
            '-';

        const contactId = assignment.assigned_to?.contact != null ?
            assignment.assigned_to.contact :
            planning?.contact_info;

        const showXMPFiles = planningUtils.showXMPFileUIControl(assignment);
        const {gettext} = superdeskApi.localization;

        return (
            <div>
                <Row label={assignmentUtils.getContactLabel(assignment)}>
                    <ContactsPreviewList
                        contactIds={contactId ? [contactId] : []}
                        scrollInView={true}
                        scrollIntoViewOptions={{block: 'center'}}
                        tabEnabled={true}
                    />
                </Row>
                <Row
                    enabled={coverageFormProfile.editor.language.enabled == true}
                    label={gettext('Language')}
                    value={planning.language || '-'}
                    className="strong"
                />
                <Row
                    enabled={coverageFormProfile.editor.slugline.enabled == true}
                    label={gettext('Slugline')}
                    value={planning.slugline || '-'}
                    className="slugline"
                />
                <Row
                    enabled={planningFormProfile.editor.place.enabled == true}
                    label={gettext('Place')}
                    value={placeText}
                />
                <Row
                    enabled={planningFormProfile.editor.anpa_category.enabled == true}
                    label={gettext('ANPA Category')}
                    value={categoryText}
                />
                <Row
                    enabled={planningFormProfile.editor.subject.enabled == true}
                    label={gettext('Subject')}
                    value={subjectText}
                />
                <Row
                    enabled={coverageFormProfile.editor.genre.enabled == true}
                    label={gettext('Genre')}
                    value={planning?.genre?.name ?? '-'}
                />
                <Row
                    enabled={coverageFormProfile.editor.keyword.enabled == true}
                    label={gettext('Keywords')}
                    value={keywordString}
                />
                <Row
                    enabled={coverageFormProfile.editor.ednote.enabled == true}
                    label={gettext('Ed Note')}
                    value={stringUtils.convertNewlineToBreak(planning.ednote || '-')}
                />
                <Row
                    enabled={coverageFormProfile.editor.internal_note.enabled == true}
                    label={gettext('Internal Note')}
                >
                    <InternalNoteLabel item={planning} showTooltip={false} />
                    <p>{stringUtils.convertNewlineToBreak(planning.internal_note || '-')}</p>
                </Row>

                <Row
                    enabled={coverageFormProfile.editor.files.enabled == true}
                    label={gettext('ATTACHMENTS')}
                    noPadding={!showXMPFiles}
                >
                    <FileReadOnlyList
                        formProfile={coverageFormProfile}
                        files={files}
                        item={planning}
                        createLink={createLink}
                        noToggle={true}
                    />
                </Row>

                {showXMPFiles && (
                    <Row
                        label={gettext('ASSOCIATED XMP FILE')}
                        noPadding={true}
                    >
                        <FileReadOnlyList
                            files={files}
                            item={planning}
                            createLink={createLink}
                            field={'xmp_file'}
                            noToggle={true}
                        />
                    </Row>
                )}
            </div>
        );
    }
}
