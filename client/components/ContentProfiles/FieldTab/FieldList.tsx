import * as React from 'react';

import {IEditorProfile, IEditorProfileGroup, IProfileFieldEntry} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {getFieldNameTranslated, getProfileGroupNameTranslated} from '../../../utils/contentProfiles';

import {Button, IconButton, ToggleBox, Label, TreeMenu} from 'superdesk-ui-framework/react';
import * as List from '../../UI/List';
import {arrayMove, WithSortable} from '@sourcefabric/common';
import {shouldNotStartDragging} from '../utils';

interface IProps {
    profile: IEditorProfile;
    group?: IEditorProfileGroup;
    fields: Array<IProfileFieldEntry>;
    unusedFields: Array<IProfileFieldEntry>;
    systemRequiredFields?: Array<string>;
    selectedField?: string;

    onSortChange(fields: Array<IProfileFieldEntry>): void;
    onClick(item: IProfileFieldEntry): void;
    insertField(item: IProfileFieldEntry, groupId: IEditorProfileGroup['_id'], index: number): void;
    removeField(item: IProfileFieldEntry): void;
}

export class FieldList extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.getListElement = this.getListElement.bind(this);
        this.getTreeMenu = this.getTreeMenu.bind(this);
    }

    getTreeMenu(options: Array<{value: IProfileFieldEntry; onSelect: () => void;}>, buttonLabel: string) {
        const {gettext} = superdeskApi.localization;

        return (
            <TreeMenu
                getId={(field) => field.name}
                optionTemplate={(item) => item.schema?.type === 'custom_vocabulary' ? (
                    <>
                        {item.name}
                        <span className="sd-text--italic sd-text--light">
                            &nbsp;({gettext('custom vocabulary')})
                        </span>
                    </>
                ) : (
                    <>
                        {item.name}
                    </>
                )}
                getLabel={(item) => getFieldNameTranslated(item.name)}
                getOptions={() => options}
            >
                {(toggle) => (
                    <Button
                        text={buttonLabel}
                        iconOnly={true}
                        icon="plus-large"
                        shape="round"
                        type="primary"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            toggle(e);
                        }}

                    />
                )}
            </TreeMenu>
        );
    }

    getListElement(item: IProfileFieldEntry) {
        const {gettext} = superdeskApi.localization;
        const {notify} = superdeskApi.ui;
        const {querySelectorParent} = superdeskApi.utilities;
        const {fields} = this.props;
        const isLastField = item.name === fields[fields.length - 1]?.name;
        const getAddFieldMenuItems = (offset) => this.props.unusedFields.map(
            (itemToAdd) => ({
                value: itemToAdd,
                onSelect: () => {
                    this.props.insertField(itemToAdd, this.props.group?._id, item.field.index + offset);
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
                testId={`content-list--field-${item.name}`}
                shadow={1}
                activated={this.props.selectedField === item.name}
                onClick={(e) => {
                    // don't trigger editor if click went to a three dot menu
                    // or other button inside the list item
                    if (
                        e.target instanceof HTMLElement &&
                        querySelectorParent(e.target, 'button', {self: true})
                    ) {
                        return;
                    }
                    this.props.onClick(item);
                }}
                className="mt-1"
            >
                {!menuItems.before.length ? null : (
                    <div className="profile-item__add-btn">
                        {this.getTreeMenu(menuItems.after, gettext('Add field before'))}
                    </div>
                )}
                <List.Column
                    border={false}
                    grow={true}
                >
                    <List.Row>
                        <span className="sd-text__strong">
                            {getFieldNameTranslated(item.name)}
                        </span>
                    </List.Row>
                </List.Column>
                {!item.schema?.required ? null : (
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
                            if (this.props.systemRequiredFields?.includes(item.name)) {
                                notify.error(gettext('Delete failed! Field is required by the system'));
                            } else {
                                this.props.removeField(item);
                            }
                        }}
                    />
                </List.ActionMenu>
                {(!isLastField || !menuItems.after.length) ? null : (
                    <div className="profile-item__add-btn profile-item__add-btn--bottom">
                        {this.getTreeMenu(menuItems.after, gettext('Add field after'))}
                    </div>
                )}
            </List.Item>
        );
    }

    renderList() {
        const {gettext} = superdeskApi.localization;

        return !this.props.fields.length ? (
            <div className="planning-profile__empty-list">
                {this.getTreeMenu(
                    this.props.unusedFields.map((item) => ({
                        value: item,
                        onSelect: () => this.props.insertField(item, this.props.group?._id, 0),
                    })),
                    gettext('Add first field')
                )}
            </div>
        ) : (
            <List.Group spaceBetween>
                <WithSortable
                    items={this.props.fields}
                    getId={(item) => item.name}
                    itemTemplate={(item) => <>{this.getListElement(item.item)}</>}
                    options={{
                        shouldCancelStart: shouldNotStartDragging,
                        onSortEnd: ({
                            oldIndex,
                            newIndex
                        }) => {
                            const itemsSorted = arrayMove(this.props.fields, oldIndex, newIndex);

                            this.props.onSortChange(itemsSorted);
                        }
                    }}
                />
            </List.Group>
        );
    }

    render() {
        return this.props.group?._id == null ? (
            this.renderList()
        ) : (
            <ToggleBox
                variant="simple"
                key={this.props.group._id}
                title={getProfileGroupNameTranslated(this.props.group)}
                className="toggle-box--circle toggle-box--no-line"
                initiallyOpen={true}
            >
                {this.renderList()}
            </ToggleBox>
        );
    }
}
