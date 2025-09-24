import React from 'react';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {Modal} from 'superdesk-ui-framework/react';
import {gettext} from '../../utils';
import {IFormField, IFormGroup} from 'superdesk-api';
import {IPlanningExportTemplate} from 'interfaces';
import {ExportTemplateItem} from './ExportTemplateItem';
import {PLANNING_EXPORT_TEMPLATES_RESOURCE} from '../../constants/exportTemplates';

interface IProps {
    closeModal: () => void;
}

export const getNameField = (): IFormField<IPlanningExportTemplate> => {
    const {GenericFormFieldType} = superdeskApi.forms;

    return {
        type: GenericFormFieldType.plainText,
        field: 'name',
        label: gettext('Name'),
        required: true,
    };
};

const getFormConfig = (): IFormGroup<IPlanningExportTemplate> => {
    const {GenericFormFieldType} = superdeskApi.forms;

    return {
        direction: 'vertical',
        type: 'inline',
        form: [
            getNameField(),
            {
                type: GenericFormFieldType.select,
                field: 'type',
                label: gettext('Type'),
                required: true,
                component_parameters: {
                    options: [
                        {label: gettext('Event'), id: 'event'},
                        {label: gettext('Planning'), id: 'planning'},
                        {label: gettext('Combined'), id: 'combined'},
                    ],
                },
            },
            {
                type: GenericFormFieldType.plainText,
                field: 'data.body_html',
                label: gettext('Template Content'),
                component_parameters: {
                    multiline: true,
                    formattingOptions: [],
                },
            },
            {
                type: GenericFormFieldType.plainText,
                field: 'label',
                label: gettext('Label'),

                // Required because in the export action modal for events and planning we show
                // templates by label
                required: true,
            },
            {
                type: GenericFormFieldType.checkbox,
                field: 'download',
                label: gettext('Download'),
            },
        ]
    };
};

export class ManageExportTemplatesModal extends React.PureComponent<IProps> {
    private config: IFormGroup<IPlanningExportTemplate>;

    constructor(props: IProps) {
        super(props);

        this.config = getFormConfig();
    }

    render() {
        const ExportTemplatesView = superdeskApi
            .components
            .getGenericHttpEntityListPageComponent<IPlanningExportTemplate, never>(
                PLANNING_EXPORT_TEMPLATES_RESOURCE,
                this.config,
            );

        return (
            <Modal
                visible
                size="x-large"
                closeOnEscape
                contentPadding="none"
                headerTemplate={gettext('Manage Custom Layouts')}
                onHide={this.props.closeModal}
            >
                <ExportTemplatesView
                    ItemComponent={ExportTemplateItem}
                    getFormConfig={() => this.config}
                    fieldForSearch={getNameField()}
                    getId={(item) => item._id}
                    defaultSortOption={{field: 'name', direction: 'ascending'}}
                    disallowSorting
                    hideItemsCount
                />
            </Modal>
        );
    }
}
