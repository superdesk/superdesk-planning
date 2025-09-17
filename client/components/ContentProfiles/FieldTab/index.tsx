import * as React from 'react';
import {cloneDeep, isEqual, set} from 'lodash';

import {IIgnoreCancelSaveResponse, IVocabulary} from 'superdesk-api';
import {
    IEditorProfile,
    IProfileFieldEntry,
    IEditorProfileGroup,
} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {
    getGroupFieldsSorted,
    getEnabledProfileGroupFields,
    getEnabledProfileFields,
    getUnusedProfileFields,
    getProfileGroupsSorted,
    getFieldNameTranslated,
} from '../../../utils/contentProfiles';

import {FieldList} from './FieldList';
import {FieldEditor} from './FieldEditor';
import {arrayInsertAtIndex} from '@sourcefabric/common';

interface IProps {
    profile: IEditorProfile;
    isProfileCoverage?: boolean;
    groupFields: boolean;
    systemRequiredFields: Array<string>;
    disableMinMaxFields?: Array<string>;
    disableRequiredFields?: Array<string>;
    updateField(field: IProfileFieldEntry): void;
    updateFields(fields: Array<IProfileFieldEntry>): void;
}

interface IState {
    selectedField?: IProfileFieldEntry;
}

export class FieldTab extends React.Component<IProps, IState> {
    private customVocabularies: Array<IVocabulary>;

    constructor(props) {
        super(props);

        this.state = {
            selectedField: undefined,
        };

        this.openEditor = this.openEditor.bind(this);
        this.updateField = this.updateField.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.saveField = this.saveField.bind(this);
        this.updateFieldOrder = this.updateFieldOrder.bind(this);
        this.insertField = this.insertField.bind(this);
        this.removeField = this.removeField.bind(this);
        this.getFieldName = this.getFieldName.bind(this);

        this.customVocabularies = superdeskApi.entities.vocabulary.getAll().toArray();
    }

    openEditor(field: IProfileFieldEntry) {
        if (field.name !== this.state.selectedField?.name) {
            this.closeEditor().then((response) => {
                if (response !== 'cancel') {
                    this.setState({selectedField: cloneDeep(field)});
                }
            });
        }
    }

    updateField(field: string, value: number | boolean) {
        this.setState((prevState: Readonly<IState>) => {
            const selectedField = cloneDeep(prevState.selectedField);

            set(selectedField, field, value);

            return {selectedField};
        });
    }

    isEditorDirty() {
        const fieldName = this.state.selectedField?.name;

        if (!fieldName) {
            return false;
        }

        const originalSchema = this.props.profile.schema[fieldName];
        const updatedSchema = this.state.selectedField.schema;

        const originalEditor = this.props.profile.editor[fieldName];
        const updatedEditor = {
            ...this.state.selectedField.field,
            index: originalEditor.index,
        };

        return !(
            isEqual(originalSchema, updatedSchema) &&
            isEqual(originalEditor, updatedEditor)
        );
    }

    closeEditor(disableSave?: boolean): Promise<IIgnoreCancelSaveResponse> {
        if (this.isEditorDirty()) {
            const {gettext} = superdeskApi.localization;
            const {showIgnoreCancelSaveDialog} = superdeskApi.ui;

            return showIgnoreCancelSaveDialog({
                title: disableSave ?
                    gettext('Ignore changes?') :
                    gettext('Save changes?'),
                body: gettext('There are unsaved changes.'),
                hideSave: disableSave,
            }).then((response) => {
                if (response === 'ignore') {
                    this.setState({selectedField: undefined});
                } else if (response === 'save') {
                    this.props.updateField(this.state.selectedField);
                    this.setState({selectedField: undefined});
                }

                return response;
            });
        } else {
            this.setState({selectedField: undefined});
            return Promise.resolve('ignore');
        }
    }

    saveField() {
        const updatedField = this.state.selectedField;
        // Make sure to not change the current index of this field
        // otherwise the field order may change on save
        const currentIndex = this.props.profile.editor[updatedField.name].index;

        if (updatedField.schema.type === 'string' && updatedField.schema.field_type != null) {
            switch (updatedField.schema.field_type) {
            case 'single_line':
                delete updatedField.schema.expandable;
                delete updatedField.schema.format_options;
                break;
            case 'multi_line':
                delete updatedField.schema.format_options;
                break;
            case 'editor_3':
                delete updatedField.schema.expandable;
                break;
            }
        }

        this.props.updateField({
            ...updatedField,
            field: {
                ...updatedField.field,
                index: currentIndex,
            },
        });
        this.setState({selectedField: undefined});
    }

    updateFieldOrder(fields: Array<IProfileFieldEntry>) {
        this.props.updateFields(fields);
    }

    insertField(
        fieldToAdd: IProfileFieldEntry,
        groupId: IEditorProfileGroup['_id'] | undefined,
        index: number,
    ) {
        const fields = this.props.groupFields ?
            getEnabledProfileGroupFields(this.props.profile, groupId) :
            getEnabledProfileFields(this.props.profile);

        const withNewField = arrayInsertAtIndex(
            fields,
            {
                ...fieldToAdd,
                field: {
                    ...fieldToAdd.field,
                    enabled: true,
                    group: groupId,
                    index: index,
                },
            },
            index,
        );


        withNewField.sort((a, b) => a.field.index - b.field.index);

        this.props.updateFields(withNewField);
    }

    removeField(item: IProfileFieldEntry) {
        const {gettext} = superdeskApi.localization;
        const {confirm} = superdeskApi.ui;

        confirm(
            gettext('Are you sure you want to delete this field?', {field: item.name}),
            gettext('Delete Field "{{field}}"?', {
                field: getFieldNameTranslated(item.name),
            })
        ).then((response) => {
            if (response) {
                if (this.state.selectedField?.name === item.name) {
                    this.setState({selectedField: undefined});
                }

                this.props.updateFields([{
                    ...item,

                    // If field is custom_vocabulary, schema should also be removed, on field remove
                    // otherwise if required is set to true UI issues will occur.
                    // We check for schema.type === 'custom_vocabulary' because some field names might have ids
                    // of a custom vocabulary, while registered as static fields
                    schema: item.schema.type === 'custom_vocabulary' ? undefined : item.schema,
                    field: {
                        ...item.field,
                        enabled: false,
                        group: undefined,
                        index: undefined,
                    },
                }]);
            }
        });
    }


    private getFieldName(fieldEntry: IProfileFieldEntry): JSX.Element {
        const {gettext} = superdeskApi.localization;
        const fieldType = fieldEntry.schema?.type;

        if (fieldType === 'custom_vocabulary' || fieldType === 'custom_text') {
            const fieldTypeLabel = fieldType === 'custom_text'
                ? gettext('(custom text field)')
                : gettext('(custom vocabulary)');

            return (
                <>
                    {this.customVocabularies.find((x) => x._id === fieldEntry.name).display_name}
                        &nbsp;
                    <span className="sd-text--italic sd-text--light">
                        {fieldTypeLabel}
                    </span>
                </>
            );
        }

        return (
            <>
                {getFieldNameTranslated(fieldEntry.name)}
            </>
        );
    }

    render() {
        const unusedFields = getUnusedProfileFields(
            this.props.profile,
            this.props.isProfileCoverage,
            this.props.groupFields,
        );

        return (
            <div className="sd-column-box--2">
                <div className="sd-column-box__main-column">
                    <div className="sd-padding-x--2 sd-padding-y--3">
                        {!this.props.groupFields ? (
                            <FieldList
                                profile={this.props.profile}
                                group={undefined}
                                fields={getGroupFieldsSorted(this.props.profile)
                                    .filter((field) => field.name !== 'add_coverage_to_workflow')
                                }
                                unusedFields={unusedFields}
                                systemRequiredFields={this.props.systemRequiredFields}
                                onSortChange={this.updateFieldOrder}
                                insertField={this.insertField}
                                removeField={this.removeField}
                                onClick={this.openEditor}
                                selectedField={this.state.selectedField?.name}
                                getFieldName={this.getFieldName}
                                customVocabularies={this.customVocabularies}
                            />
                        ) : (
                            getProfileGroupsSorted(this.props.profile).map((group) => (
                                <FieldList
                                    // systemRequiredFields aren't passed because we want to allow users to
                                    // move fields from one group to another,
                                    // validation for systemRequiredFields runs on save
                                    key={group._id}
                                    profile={this.props.profile}
                                    group={group}
                                    fields={getGroupFieldsSorted(this.props.profile, group._id)
                                        .filter((field) => field.name !== 'add_coverage_to_workflow')
                                    }
                                    unusedFields={unusedFields}
                                    onSortChange={this.updateFieldOrder}
                                    insertField={this.insertField}
                                    removeField={this.removeField}
                                    onClick={this.openEditor}
                                    selectedField={this.state.selectedField?.name}
                                    getFieldName={this.getFieldName}
                                    customVocabularies={this.customVocabularies}
                                />
                            ))
                        )}
                    </div>
                </div>
                {this.state.selectedField == null ? null : (
                    <FieldEditor
                        key={this.state.selectedField?.name}
                        item={(() => {
                            const profileRes = cloneDeep(this.state.selectedField);

                            if (profileRes.schema?.required === true) {
                                profileRes.schema.show_in_embedded_editor = true;
                            }

                            return profileRes;
                        })()}
                        isProfileCoverage={this.props.isProfileCoverage}
                        profile={this.props.profile}
                        isDirty={this.isEditorDirty()}
                        disableMinMax={this.props.disableMinMaxFields?.includes(this.state.selectedField.name)}
                        disableRequired={this.props.disableRequiredFields?.includes(this.state.selectedField.name)}
                        systemRequired={this.props.systemRequiredFields.includes(this.state.selectedField.name)}
                        closeEditor={this.closeEditor}
                        saveField={this.saveField}
                        updateField={this.updateField}
                        getFieldName={this.getFieldName}
                    />
                )}
            </div>
        );
    }
}
