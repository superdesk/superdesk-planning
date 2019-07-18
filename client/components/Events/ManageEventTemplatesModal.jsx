/* eslint-disable react/no-multi-comp */

import {superdeskApi} from '../../superdeskApi';

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Modal} from '../../components';

class ManageEventTemplatesModalComponent extends React.PureComponent {
    render() {
        const {handleHide} = this.props;

        const {getGenericListPageComponent, ListItemColumn, ListItem} = superdeskApi.components;
        const {getFormFieldPreviewComponent, FormFieldType} = superdeskApi.forms;

        const EventTemplatesComponent = getGenericListPageComponent('events_template');

        const nameField = {
            label: gettext('Template name'),
            type: FormFieldType.textSingleLine,
            field: 'template_name',
            required: true,
        };

        const formConfig = {
            direction: 'vertical',
            type: 'inline',
            form: [
                nameField,
            ],
        };

        const renderRow = (
            key,
            item,
            page
        ) => (
            <ListItem
                key={key}
            >
                <ListItemColumn ellipsisAndGrow noBorder>
                    {getFormFieldPreviewComponent(item, nameField)}
                </ListItemColumn>
                <ListItemColumn noBorder>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
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

        return (
            <Modal xLarge={true} show={true} onHide={handleHide}>
                <Modal.Header>
                    <a className="close" onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3 className="modal__heading">{gettext('Manage Event Templates')}</h3>
                </Modal.Header>
                <Modal.Body noPadding={true}>
                    <EventTemplatesComponent
                        renderRow={renderRow}
                        formConfig={formConfig}
                        defaultSortOption={{field: nameField.field, direction: 'ascending'}}
                        fieldForSearch={nameField}
                        disallowCreatingNewItem
                        disallowFiltering
                    />
                </Modal.Body>
            </Modal>
        );
    }
}

ManageEventTemplatesModalComponent.propTypes = {
    handleHide: PropTypes.func,
    eventTemplates: PropTypes.array,
    dispatch: PropTypes.func,
};

function mapStateToProps(state) {
    return {
        eventTemplates: state.events.eventTemplates,
    };
}

export const ManageEventTemplatesModal = connect(mapStateToProps)(ManageEventTemplatesModalComponent);

