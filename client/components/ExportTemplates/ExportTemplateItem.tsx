import React from 'react';
import {IPlanningExportTemplate} from 'interfaces';
import {IPropsGenericFormItemComponent} from 'superdesk-api';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'superdesk-core/scripts/core/components/ListItem';
import {getFormFieldPreviewComponent} from 'superdesk-core/scripts/core/ui/components/generic-form/form-field';
import {gettext} from '../../utils';
import {getNameField} from './ManageExportTemplates';

export class ExportTemplateItem extends React.PureComponent<IPropsGenericFormItemComponent<IPlanningExportTemplate>> {
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
