import React from 'react';
import {List} from '../../../components/UI';
import {Label, IconButton} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../../superdeskApi';
import {getFieldNameTranslated} from '../../../utils/contentProfiles';
import AddFieldsMenu from './AddFieldsMenu';
import {IEditorProfileGroup, IProfileFieldEntry} from 'interfaces';
import {IVocabulary} from 'superdesk-api';

interface IProps {
    selectedField?: string;
    group?: IEditorProfileGroup;
    fieldEntry: IProfileFieldEntry;
    fields: Array<IProfileFieldEntry>;
    systemRequiredFields?: Array<IProfileFieldEntry['name']>;
    onClick(item: IProfileFieldEntry): void;
    unusedFields: Array<IProfileFieldEntry>;
    removeField(item: IProfileFieldEntry): void;
    vocabularies: Array<IVocabulary>;
    insertField(item: IProfileFieldEntry, groupId: IEditorProfileGroup['_id'], index: number): void;
}

export default class ProfileFieldTemplate extends React.PureComponent<IProps, any> {
    render(): React.ReactNode {
        const {gettext} = superdeskApi.localization;
        const {notify} = superdeskApi.ui;
        const {querySelectorParent} = superdeskApi.utilities;
        const {fields, fieldEntry} = this.props;

        const isLastField = fieldEntry.name === fields[fields.length - 1]?.name;
        const getAddFieldMenuItems = (offset) => this.props.unusedFields.map(
            (itemToAdd) => ({
                value: itemToAdd,
                onSelect: () => {
                    this.props.insertField(itemToAdd, this.props.group?._id, fieldEntry.field.index + offset);
                },
            })
        );
        const menuItems = {
            before: getAddFieldMenuItems(-0.1),
            after: getAddFieldMenuItems(0.1),
        };

        return (
            <List.Item
                zIndex={2000}
                flexRow
                testId={`content-list--field-${fieldEntry.name}`}
                shadow={1}
                activated={this.props.selectedField === fieldEntry.name}
                onClick={(e) => {
                    // don't trigger editor if click went to a three dot menu
                    // or other button inside the list item
                    if (
                        e.target instanceof HTMLElement &&
                        querySelectorParent(e.target, 'button', {self: true})
                    ) {
                        return;
                    }
                    this.props.onClick(fieldEntry);
                }}
                className="mt-1"
            >
                {!menuItems.before.length ? null : (
                    <div className="profile-item__add-btn">
                        <AddFieldsMenu
                            vocabularies={this.props.vocabularies}
                            options={menuItems.before}
                            buttonLabel={gettext('Add field before')}
                        />
                    </div>
                )}
                <List.Column
                    border={false}
                    grow={true}
                >
                    <List.Row>
                        <span className="sd-text__strong">
                            {fieldEntry.schema?.type === 'custom_vocabulary'
                                ? (
                                    <>
                                        {this.props.vocabularies.find((x) => x._id === fieldEntry.name).display_name}
                                        {' '}
                                        <span className="sd-text--italic sd-text--light">
                                            {gettext('(custom vocabulary)')}
                                        </span>
                                    </>
                                )
                                : getFieldNameTranslated(fieldEntry.name)
                            }
                        </span>
                    </List.Row>
                </List.Column>
                {!fieldEntry.schema?.required ? null : (
                    <List.Column border={false}>
                        <List.Row>
                            <Label
                                text={gettext('Required')}
                                type="alert"
                                style="translucent"
                            />
                        </List.Row>
                    </List.Column>
                )}
                <List.ActionMenu>
                    <IconButton
                        icon="trash"
                        ariaValue={gettext('Remove field')}
                        onClick={() => {
                            if (this.props.systemRequiredFields?.includes(fieldEntry.name)) {
                                notify.error(gettext('Delete failed! Field is required by the system'));
                            } else {
                                this.props.removeField(fieldEntry);
                            }
                        }}
                    />
                </List.ActionMenu>
                {(!isLastField || !menuItems.after.length) ? null : (
                    <div className="profile-item__add-btn profile-item__add-btn--bottom">
                        <AddFieldsMenu
                            vocabularies={this.props.vocabularies}
                            options={menuItems.after}
                            buttonLabel={gettext('Add field after')}
                        />
                    </div>
                )}
            </List.Item>
        );
    }
}
