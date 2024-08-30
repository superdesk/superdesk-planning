import React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {
    IAssignmentItem,
    ICoverageFormProfile,
    ICoveragePlanningDetails,
    IFile,
    IPlanningFormProfile,
    IPlanningItem,
    PREVIEW_PANEL,
} from '../../../interfaces';

import {assignmentUtils, planningUtils} from '../../../utils';

import {ContactsPreviewList} from '../../Contacts';
import {Row} from '../../UI/Preview';
import {FileReadOnlyList} from '../../UI';
import {previewGroupToProfile, renderFieldsForPanel} from '../../fields';

interface IProps {
    assignment: IAssignmentItem;
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
            coverageFormProfile,
            planningFormProfile,
            planningItem,
            files,
            createLink,
        } = this.props;

        const planning: Partial<ICoveragePlanningDetails> = assignment?.planning ?? {};
        const contactId = get(assignment, 'assigned_to.contact') ?
            assignment.assigned_to.contact :
            get(planning, 'contact_info');
        const showXMPFiles = planningUtils.showXMPFileUIControl(assignment);

        return (
            <div>
                {contactId == null ? null : (
                    <Row label={assignmentUtils.getContactLabel(assignment)}>
                        <ContactsPreviewList
                            contactIds={[contactId]}
                            scrollInView={true}
                            scrollIntoViewOptions={{block: 'center'}}
                            tabEnabled={true}
                        />
                    </Row>
                )}

                {renderFieldsForPanel(
                    'form-preview',
                    {
                        ...previewGroupToProfile(PREVIEW_PANEL.ASSIGNMENT, coverageFormProfile, false, true),
                        ...previewGroupToProfile(PREVIEW_PANEL.ASSIGNMENT, planningFormProfile, false, true),
                    },
                    {
                        item: {
                            coverage: planning,
                            planning: planningItem,
                        },
                        language: planning.language,
                    },
                    {
                        contact_info: {field: 'coverage'},
                        language: {field: 'coverage.language'},
                        slugline: {field: 'coverage.slugline'},
                        place: {field: 'planning.place'},
                        anpa_category: {field: 'planning.anpa_category'},
                        subject: {field: 'planning.subject'},
                        genre: {field: 'coverage.genre'},
                        keyword: {field: 'coverage.keyword'},
                        ednote: {field: 'coverage.ednote', renderEmpty: true},
                        internal_note: {field: 'coverage.internal_note', renderEmpty: true},
                    },
                )}

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
