import React from 'react';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {Modal} from 'superdesk-ui-framework/react';
import {gettext} from '../../utils';
import {IFormField, IFormGroup} from 'superdesk-api';
import {IPlanningExportTemplate} from 'interfaces';
import {updateTemplates} from '../../actions/exportTemplates';
import {ExportTemplateItem} from './ExportTemplateItem';
import {DataProvider} from 'superdesk-core/scripts/core/helpers/data-provider';
import {prepareSuperdeskQuery} from 'superdesk-core/scripts/core/helpers/universal-query';

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

        new DataProvider<IPlanningExportTemplate>(
            () => {
                const {path, urlParams} = prepareSuperdeskQuery(
                    'planning_export_templates',
                    {
                        filter: {},
                        page: 1,
                        max_results: 500,
                        sort: [{_id: 'asc'}],
                    },
                );

                return {
                    method: 'GET',
                    endpoint: path,
                    params: urlParams,
                };
            },
            (response) => {
                planningApi.redux.store.dispatch(updateTemplates(response._items));
            },
            {},
        );
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
                    disallowSorting
                    hideItemsCount
                />
            </Modal>
        );
    }
}
