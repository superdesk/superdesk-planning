/* eslint-disable react/no-multi-comp */

import {IFormGroup, IBaseRestApiResponse, IFormField, IPropsGenericFormItemComponent} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';

import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from '../index';
import {planningEventTemplateEvents} from '../../actions/events/notifications';

interface IProps {
    handleHide(): void;
}

interface IEventTemplate extends IBaseRestApiResponse {
    template_name: string;
}

const getItemComponent = (nameField: IFormField) =>
    class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<any>> {
        render(): React.ReactNode {
            const {item, page} = this.props;

            const {ListItem, ListItemColumn} = superdeskApi.components;
            const {getFormFieldPreviewComponent} = superdeskApi.forms;

            return (
                <ListItem>
                    <ListItemColumn ellipsisAndGrow noBorder>
                        {getFormFieldPreviewComponent(item, nameField)}
                    </ListItemColumn>
                    <ListItemColumn noBorder>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <button onClick={() => page.startEditing(item._id)}>
                                <i className="icon-pencil" />
                            </button>
                            <button onClick={() => page.deleteItem(item)}>
                                <i className="icon-trash" />
                            </button>
                        </div>
                    </ListItemColumn>
                </ListItem>
            );
        }
    };

export class ManageEventTemplatesModal extends React.PureComponent<IProps> {
    static propTypes: any;

    render() {
        const {handleHide} = this.props;

        const {getGenericHttpEntityListPageComponent} = superdeskApi.components;
        const {FormFieldType} = superdeskApi.forms;

        const {gettext} = superdeskApi.localization;

        const nameField = {
            label: gettext('Template name'),
            type: FormFieldType.plainText,
            field: 'template_name',
            required: true,
        };

        const formConfig: IFormGroup = {
            direction: 'vertical',
            type: 'inline',
            form: [
                nameField,
            ],
        };

        const EventTemplatesComponent = getGenericHttpEntityListPageComponent<IEventTemplate>(
            'events_template',
            formConfig
        );

        return (
            <Modal xLarge={true} show={true} onHide={handleHide}>
                <Modal.Header>
                    <h3 className="modal__heading">{gettext('Manage Event Templates')}</h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body noPadding={true}>
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
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn" type="button" onClick={handleHide}>{gettext('Close')}</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

ManageEventTemplatesModal.propTypes = {
    handleHide: PropTypes.func,
};
