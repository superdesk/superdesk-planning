import React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {
    IAssignmentItem,
    IPlanningItem,
    ICoveragePlanningDetails,
    ICoverageFormProfile,
    IPlanningFormProfile,
    IFile,
} from '../../../interfaces';

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
        const {gettext} = superdeskApi.localization;
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

        const keywordString = get(planning, 'keyword.length', 0) > 0 ?
            planning.keyword
                .map((qcode) => get(keywords.find((k) => k.qcode === qcode), 'name') || qcode)
                .join(', ')
            : '-';

        const placeText = get(planningItem, 'place.length', 0) > 0 ?
            planningItem.place.map((c) => c.name).join(', ') : '-';

        const categoryText = get(planningItem, 'anpa_category.length', 0) > 0 ?
            planningItem.anpa_category.map((c) => c.name).join(', ') : '-';

        const subjectText = get(planningItem, 'subject.length', 0) > 0 ?
            planningItem.subject.map((s) => s.name).join(', ') : '-';

        const contactId = get(assignment, 'assigned_to.contact') ?
            assignment.assigned_to.contact :
            get(planning, 'contact_info');

        const showXMPFiles = planningUtils.showXMPFileUIControl(assignment);

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
                    enabled={coverageFormProfile?.editor?.language?.enabled}
                    label={gettext('Language')}
                    value={planning.language || '-'}
                />
                <Row
                    enabled={get(coverageFormProfile, 'editor.slugline.enabled')}
                    label={gettext('Slugline')}
                    value={planning.slugline || '-'}
                    className="slugline"
                />
                <Row
                    enabled={get(planningFormProfile, 'editor.place.enabled')}
                    label={gettext('Place')}
                    value={placeText}
                />
                <Row
                    enabled={get(planningFormProfile, 'editor.anpa_category.enabled')}
                    label={gettext('ANPA Category')}
                    value={categoryText}
                />
                <Row
                    enabled={get(planningFormProfile, 'editor.subject.enabled')}
                    label={gettext('Subject')}
                    value={subjectText}
                />
                <Row
                    enabled={get(coverageFormProfile, 'editor.genre.enabled')}
                    label={gettext('Genre')}
                    value={get(planning, 'genre.name') || '-'}
                />
                <Row
                    enabled={get(coverageFormProfile, 'editor.keyword.enabled')}
                    label={gettext('Keywords')}
                    value={keywordString}
                />
                <Row
                    enabled={get(coverageFormProfile, 'editor.ednote.enabled')}
                    label={gettext('Ed Note')}
                    value={stringUtils.convertNewlineToBreak(planning.ednote || '-')}
                />
                <Row
                    enabled={get(coverageFormProfile, 'editor.internal_note.enabled')}
                    label={gettext('Internal Note')}
                >
                    <InternalNoteLabel item={planning} showTooltip={false} />
                    <p>{stringUtils.convertNewlineToBreak(planning.internal_note || '-')}</p>
                </Row>

                <Row
                    enabled={get(coverageFormProfile, 'editor.files.enabled')}
                    label={gettext('ATTACHMENTS')}
                    noPadding={!showXMPFiles}
                >
                    <FileReadOnlyList
                        formProfile={coverageFormProfile}
                        files={files}
                        item={planning}
                        createLink={createLink}
                        noToggle
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
                            noToggle
                        />
                    </Row>
                )}
            </div>
        );
    }
}
