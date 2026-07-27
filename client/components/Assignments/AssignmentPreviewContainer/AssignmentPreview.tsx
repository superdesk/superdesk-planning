import React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {
    IAssignmentItem,
    ICoverageContentProfile,
    ICoverageFormProfile,
    ICoveragePlanningDetails,
    IFile,
    IPlanningFormProfile,
    IPlanningItem,
} from '../../../interfaces';

import {assignmentUtils, planningUtils} from '../../../utils';

import {ContactsPreviewList} from '../../Contacts/ContactsPreviewList';
import {Row} from '../../UI/Preview';
import {FileReadOnlyList} from '../../UI';
import {getCustomFieldSourcePaths, renderProfileFieldsFlat} from '../../fields';

interface IProps {
    assignment: IAssignmentItem;
    coverageFormProfile: ICoverageFormProfile;
    planningFormProfile: IPlanningFormProfile;
    planningItem: IPlanningItem;
    files: Array<IFile>;
    createLink(file: IFile): string;

    /**
     * The coverage profile used when creating the assignment
     */
    assignmentCoverageProfile: ICoverageContentProfile;
}

export class AssignmentPreview extends React.PureComponent<IProps> {
    /**
     * Coverage profile fields read from the coverage (`assignment.planning`),
     * except a few sourced from the planning item.
     */
    getFieldProps(profile: ICoverageContentProfile | ICoverageFormProfile): {[key: string]: {[key: string]: any}} {
        const planningItemFields = ['anpa_category', 'subject', 'location'];
        const fieldProps: {[key: string]: {[key: string]: any}} = {
            ...getCustomFieldSourcePaths(profile, 'coverage'),
        };

        Object.keys(profile?.editor ?? {}).forEach((fieldName) => {
            if (fieldProps[fieldName] == null) {
                fieldProps[fieldName] = {
                    field: planningItemFields.includes(fieldName) ?
                        `planning.${fieldName}` :
                        `coverage.${fieldName}`,
                };
            }
        });

        return fieldProps;
    }

    /**
     * Fields the coverage profile does not cover but the planning profile enables
     * (place, category, subject) keep rendering from the planning item, as before
     * the previews became profile driven.
     */
    getPlanningOnlyExcludes(coverageProfile, planningProfile): Array<string> {
        const planningItemFields = ['place', 'anpa_category', 'subject'];

        return Object.keys(planningProfile?.editor ?? {}).filter((fieldName) => (
            !planningItemFields.includes(fieldName) ||
            coverageProfile?.editor?.[fieldName]?.enabled
        ));
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            assignment,
            coverageFormProfile,
            planningFormProfile,
            assignmentCoverageProfile,
            planningItem,
            files,
            createLink,
        } = this.props;

        const profile = assignmentCoverageProfile ?? coverageFormProfile;
        const planning: Partial<ICoveragePlanningDetails> = assignment?.planning ?? {};
        const contactId = assignment?.assigned_to?.contact ?? planning?.contact_info;
        const showXMPFiles = planningUtils.showXMPFileUIControl(assignment);

        return (
            <div>
                {contactId != null && (
                    <Row label={assignmentUtils.getContactLabel(assignment)}>
                        <ContactsPreviewList
                            contactIds={[contactId]}
                        />
                    </Row>
                )}

                {renderProfileFieldsFlat(
                    'form-preview',
                    profile,
                    {
                        item: {
                            coverage: planning,
                            planning: planningItem,
                        },
                        language: planning.language,
                        renderEmpty: true,
                        schema: profile?.schema,
                    },
                    this.getFieldProps(profile),
                    [
                        'contact_info',
                        'files',
                        'xmp_file',
                        'scheduled',
                        'scheduled_updates',
                        'g2_content_type',
                        'news_coverage_status',
                        'add_coverage_to_workflow',
                        'multiple_content',
                        'no_content_linking',
                        'flags',
                    ],
                )}

                {renderProfileFieldsFlat(
                    'form-preview',
                    planningFormProfile,
                    {
                        item: {planning: planningItem},
                        language: planning.language,
                        renderEmpty: true,
                        schema: planningFormProfile?.schema,
                    },
                    {
                        place: {field: 'planning.place'},
                        anpa_category: {field: 'planning.anpa_category'},
                        subject: {field: 'planning.subject'},
                    },
                    this.getPlanningOnlyExcludes(profile, planningFormProfile),
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
