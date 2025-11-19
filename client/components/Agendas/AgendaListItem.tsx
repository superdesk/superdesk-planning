import React from 'react';
import moment from 'moment';
import {IAgendaEntity} from '../../interfaces';
import {IPropsGenericFormItemComponent} from 'superdesk-api';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'superdesk-core/scripts/core/components/ListItem';
import {getFormFieldPreviewComponent} from 'superdesk-core/scripts/core/ui/components/generic-form/form-field';
import {gettext} from '../../utils';
import {getNameField} from './ManageAgendasModal';
import {IconButton, Label} from 'superdesk-ui-framework';
import {superdeskApi} from '../../superdeskApi';

export class AgendaListItem extends React.PureComponent<IPropsGenericFormItemComponent<IAgendaEntity>> {
    render() {
        const {item, page, inEditMode, inPreviewMode} = this.props;
        const borderState = item.is_enabled || item.is_enabled == null ? 'active' : 'idle';

        return (
            <ListItem
                onClick={() => page.openPreview(item._id)}
                onDoubleClick={() => page.startEditing(item._id)}
                data-test-id="agenda-item"
                className={inEditMode || inPreviewMode ? 'sd-list-item--selected' : ''}
            >
                <div className={`sd-list-item__border sd-list-item__border--${borderState}`} />
                <ListItemColumn ellipsisAndGrow={!!(item.is_enabled === true || item.is_enabled == null)} noBorder>
                    {getFormFieldPreviewComponent(item, getNameField())}
                </ListItemColumn>
                {item.is_enabled === false && (
                    <ListItemColumn ellipsisAndGrow noBorder>
                        <Label
                            type="warning"
                            style="translucent"
                            text={superdeskApi.localization.gettext('Disabled')}
                        />
                    </ListItemColumn>
                )}
                <ListItemColumn noBorder>
                    <time style={{color: 'var(--sd-colour-text-light)', fontSize: '1.2rem'}}>
                        {gettext('updated') + ' ' + moment(item._updated).fromNow()}
                    </time>
                </ListItemColumn>
                <ListItemActionsMenu>
                    <div style={{display: 'flex'}}>
                        <IconButton
                            onClick={(event) => {
                                event.stopPropagation();
                                page.startEditing(item._id);
                            }}
                            ariaValue={gettext('Edit')}
                            data-test-id="edit"
                            size="small"
                            icon="pencil"
                        />
                        <IconButton
                            onClick={(event) => {
                                event.stopPropagation();
                                page.deleteItem(item);
                            }}
                            icon="trash"
                            ariaValue={gettext('Remove')}
                            data-test-id="delete"
                            size="small"
                        />
                    </div>
                </ListItemActionsMenu>
            </ListItem>
        );
    }
}
