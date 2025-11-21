/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IFormGroup, IBaseRestApiResponse, IPropsGenericFormItemComponent, IFormField} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {planningEventTemplateEvents} from '../../actions/events/notifications';
import {ListItemActionsMenu} from 'superdesk-core/scripts/core/components/ListItem';
import {Button, IconButton, Modal} from 'superdesk-ui-framework';

interface IProps {
    handleHide(): void;
}

interface IEventTemplate extends IBaseRestApiResponse {
    template_name: string;
}

const getItemComponent = (nameField: IFormField<IEventTemplate>) =>
    class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IEventTemplate>> {
        render(): React.ReactNode {
            const {item, page, inEditMode, inPreviewMode} = this.props;
            const {ListItem, ListItemColumn} = superdeskApi.components;
            const {getFormFieldPreviewComponent} = superdeskApi.forms;

            return (
                <ListItem
                    onClick={() => page.openPreview(item._id)}
                    onDoubleClick={() => page.startEditing(item._id)}
                    className={inEditMode || inPreviewMode ? 'sd-list-item--selected' : ''}
                >
                    <ListItemColumn ellipsisAndGrow noBorder>
                        {getFormFieldPreviewComponent(item, nameField)}
                    </ListItemColumn>
                    <ListItemActionsMenu>
                        <div style={{display: 'flex'}}>
                            <IconButton
                                icon="pencil"
                                onClick={() => page.startEditing(item._id)}
                                ariaValue={superdeskApi.localization.gettext('')}
                                size="small"
                            />
                            <IconButton
                                icon="trash"
                                onClick={() => page.deleteItem(item)}
                                ariaValue={superdeskApi.localization.gettext('')}
                                size="small"
                            />
                        </div>
                    </ListItemActionsMenu>
                </ListItem>
            );
        }
    };

export class ManageEventTemplatesModal extends React.PureComponent<IProps> {
    static propTypes: any;

    render() {
        const {handleHide} = this.props;

        const {gettext} = superdeskApi.localization;
        const {getGenericHttpEntityListPageComponent} = superdeskApi.components;
        const {GenericFormFieldType} = superdeskApi.forms;

        const nameField: IFormField<IEventTemplate> = {
            label: gettext('Template name'),
            type: GenericFormFieldType.plainText,
            field: 'template_name',
            required: true,
        };

        const formConfig: IFormGroup<IEventTemplate> = {
            direction: 'vertical',
            type: 'inline',
            form: [nameField],
        };

        const EventTemplatesComponent = getGenericHttpEntityListPageComponent<IEventTemplate, unknown>(
            'events_template',
            formConfig
        );

        return (
            <Modal
                size="x-large"
                closeOnEscape
                visible
                onHide={handleHide}
                contentPadding="none"
                headerTemplate={gettext('Manage Event Templates')}
                footerTemplate={(
                    <Button
                        type="tertiary"
                        onClick={handleHide}
                        text={gettext('Close')}
                    />
                )}
            >
                <EventTemplatesComponent
                    ItemComponent={getItemComponent(nameField)}
                    getFormConfig={() => formConfig}
                    defaultSortOption={{field: nameField.field, direction: 'ascending'}}
                    fieldForSearch={nameField}
                    refreshOnEvents={Object.keys(planningEventTemplateEvents)}
                    disallowCreatingNewItem={true}
                    disallowFiltering={true}
                    getId={(item) => item._id}
                />
            </Modal>
        );
    }
}
