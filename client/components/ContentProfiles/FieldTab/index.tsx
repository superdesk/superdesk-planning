import * as React from 'react';
import {cloneDeep, isEqual, set} from 'lodash';

import {IIgnoreCancelSaveResponse} from 'superdesk-api';
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

interface IProps {
    profile: IEditorProfile;
    groupFields: boolean;
    systemRequiredFields: Array<Array<string>>;
    disableMinMaxFields?: Array<string>;
    disableRequiredFields?: Array<string>;
    updateField(field: IProfileFieldEntry): void;
    updateFields(fields: Array<IProfileFieldEntry>): void;
}

interface IState {
    selectedField?: IProfileFieldEntry;
}

export class FieldTab extends React.Component<IProps, IState> {
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
        fields.forEach((item, index) => {
            item.field.index = index;
        });

        this.props.updateFields(fields);
    }

    insertField(itemToAdd: IProfileFieldEntry, groupId: IEditorProfileGroup['_id'] | undefined, index: number) {
        const fields = this.props.groupFields ?
            getEnabledProfileGroupFields(this.props.profile, groupId) :
            getEnabledProfileFields(this.props.profile);

        fields.push({
            ...itemToAdd,
            field: {
                ...itemToAdd.field,
                enabled: true,
                group: groupId,
                index: index,
            },
        });

        fields.sort((a, b) => a.field.index - b.field.index);
        fields.forEach((item, index) => {
            item.field.index = index;
        });

        this.props.updateFields(fields);
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

    getSystemRequiredFields() {
        if (this.props.systemRequiredFields.length) {
            return this.props.systemRequiredFields
                .filter((fields) => fields.length === 1)
                .map((fields) => fields[0]);
        }

        return [];
    }

    render() {
        const unusedFields = getUnusedProfileFields(this.props.profile, this.props.groupFields);
        const systemRequiredFields = this.getSystemRequiredFields();

        return (
            <div className="sd-column-box--2">
                <div className="sd-column-box__main-column">
                    <div className="sd-padding-x--2 sd-padding-y--3">
                        {!this.props.groupFields ? (
                            <FieldList
                                profile={this.props.profile}
                                group={undefined}
                                fields={getGroupFieldsSorted(this.props.profile)}
                                unusedFields={unusedFields}
                                systemRequiredFields={systemRequiredFields}
                                onSortChange={this.updateFieldOrder}
                                insertField={this.insertField}
                                removeField={this.removeField}
                                onClick={this.openEditor}
                                selectedField={this.state.selectedField?.name}
                            />
                        ) : (
                            getProfileGroupsSorted(this.props.profile).map((group) => (
                                <FieldList
                                    key={group._id}
                                    profile={this.props.profile}
                                    group={group}
                                    fields={getGroupFieldsSorted(this.props.profile, group._id)}
                                    unusedFields={unusedFields}
                                    onSortChange={this.updateFieldOrder}
                                    insertField={this.insertField}
                                    removeField={this.removeField}
                                    onClick={this.openEditor}
                                    selectedField={this.state.selectedField?.name}
                                />
                            ))
                        )}
                    </div>
                </div>
                {this.state.selectedField == null ? null : (
                    <FieldEditor
                        key={this.state.selectedField?.name}
                        item={this.state.selectedField}
                        isDirty={this.isEditorDirty()}
                        disableMinMax={this.props.disableMinMaxFields?.includes(this.state.selectedField.name)}
                        disableRequired={this.props.disableRequiredFields?.includes(this.state.selectedField.name)}
                        systemRequired={systemRequiredFields.includes(this.state.selectedField.name)}
                        closeEditor={this.closeEditor}
                        saveField={this.saveField}
                        updateField={this.updateField}
                    />
                )}
            </div>
        );
    }
}
