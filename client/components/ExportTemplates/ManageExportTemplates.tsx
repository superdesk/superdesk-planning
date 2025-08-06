import React from 'react';
import {superdeskApi} from '../../superdeskApi';
import {FormFieldType} from 'superdesk-core/scripts/core/ui/components/generic-form/interfaces/form';
import {Modal} from 'superdesk-ui-framework/react';
import {gettext} from '../../utils';
import {IFormField, IFormGroup} from 'superdesk-api';
import {IPlanningExportTemplate} from 'interfaces';
import {ExportTemplateItem} from './ExportTemplateItem';

interface IProps {
    closeModal: () => void;
}

export const getNameField = (): IFormField => ({
    type: FormFieldType.plainText,
    field: 'name',
    label: gettext('Name'),
    required: true,
});

const getFormConfig = (): IFormGroup => ({
    direction: 'vertical',
    type: 'inline',
    form: [
        getNameField(),
        {
            type: FormFieldType.select,
            field: 'type',
            label: gettext('Type'),
            required: true,
            component_parameters: {
                options: [
                    {label: gettext('Event'), id: 'event'},
                    {label: gettext('Planning'), id: 'planning'},
                    {label: gettext('Combined'), id: 'combined'},
                ],
            }
        },
        {
            type: FormFieldType.plainText,
            field: 'data.body_html',
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
});

export default class ManageExportTemplatesModal extends React.PureComponent<IProps> {
    private config: IFormGroup;

    constructor(props: IProps) {
        super(props);

        this.config = getFormConfig();
    }

    render() {
        const ExportTemplatesView = superdeskApi
            .components
            .getGenericHttpEntityListPageComponent<IPlanningExportTemplate, never>(
                'planning_export_templates',
                this.config,
            );

        return (
            <Modal visible closeOnEscape onHide={this.props.closeModal} size="x-large" contentPadding="none">
                <ExportTemplatesView
                    ItemComponent={ExportTemplateItem}
                    getFormConfig={() => this.config}
                    fieldForSearch={getNameField()}
                    getId={(item) => item._id}
                    defaultSortOption={{field: 'name', direction: 'ascending'}}
                />
            </Modal>
        );
    }
}
