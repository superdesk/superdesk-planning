import React from 'react';
import {superdeskApi} from '../../superdeskApi';
import {FormFieldType} from 'superdesk-core/scripts/core/ui/components/generic-form/interfaces/form';
import {Modal} from 'superdesk-ui-framework/react';
import {gettext} from '../../utils';
import {IFormField, IFormGroup, IPropsGenericFormItemComponent} from 'superdesk-api';
import {IPlanningExportTemplate} from 'interfaces';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'superdesk-core/scripts/core/components/ListItem';
import {getFormFieldPreviewComponent} from 'superdesk-core/scripts/core/ui/components/generic-form/form-field';

interface IProps {
    closeModal: () => void;
}

const getNameField = (): IFormField => ({
    type: FormFieldType.plainText,
    field: 'name',
    label: gettext('Name'),
    required: true,
});

class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IPlanningExportTemplate>> {
    render() {
        const {item, page} = this.props;

        return (
            <ListItem
                onClick={() => page.openPreview(item._id)}
                data-test-id="internal-destinations-item"
            >
                <ListItemColumn ellipsisAndGrow noBorder>
                    {getFormFieldPreviewComponent(item, getNameField())}
                </ListItemColumn>
                <ListItemActionsMenu>
                    <div style={{display: 'flex'}}>
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                page.startEditing(item._id);
                            }}
                            className="icn-btn"
                            title={gettext('Edit')}
                            data-test-id="edit"
                        >
                            <i className="icon-pencil" />
                        </button>
                        <button
                            onClick={(event) => {
                                // prevents preview from opening
                                event.stopPropagation();

                                page.deleteItem(item);
                            }}
                            className="icn-btn"
                            title={gettext('Remove')}
                            data-test-id="delete"
                        >
                            <i className="icon-trash" />
                        </button>
                    </div>
                </ListItemActionsMenu>
            </ListItem>
        );
    }
}

// eslint-disable-next-line react/no-multi-comp
export default class ManageExportTemplatesModal extends React.PureComponent<IProps> {
    render() {
        const formConfig: IFormGroup = {
            direction: 'vertical',
            type: 'inline',
            form: [
                {
                    type: FormFieldType.plainText,
                    field: 'name',
                    label: gettext('Name'),
                    required: true,
                },
                {
                    type: FormFieldType.select,
                    field: 'type',
                    label: gettext('Type'),
                    required: true,
                    component_parameters: {
                        options: [
                            {label: gettext('event'), value: 'event'},
                            {label: gettext('planning'), value: 'planning'},
                            {label: gettext('combined'), value: 'combined'},
                        ],
                    }
                },
                {
                    type: FormFieldType.plainText,
                    field: 'body_html',
                    label: gettext('Template Content'),
                    component_parameters: {
                        multiline: true,
                        formattingOptions: [],
                    }
                },
                {
                    type: FormFieldType.plainText,
                    field: 'label',
                    label: gettext('Label'),
                },
                {
                    type: FormFieldType.checkbox,
                    field: 'download',
                    label: gettext('Download'),
                },
            ]
        };

        const ExportTemplatesView = superdeskApi
            .components
            .getGenericHttpEntityListPageComponent<IPlanningExportTemplate, never>(
                'planning_export_templates',
                formConfig,
            );

        return (
            <Modal visible closeOnEscape onHide={this.props.closeModal} size="x-large" contentPadding="none">
                <ExportTemplatesView
                    ItemComponent={ItemComponent}
                    getFormConfig={() => formConfig}
                    fieldForSearch={getNameField()}
                    getId={(item) => item._id}
                    defaultSortOption={{field: 'name', direction: 'ascending'}}
                />
            </Modal>
        );
    }
}
