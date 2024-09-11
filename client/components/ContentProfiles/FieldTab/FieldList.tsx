import * as React from 'react';

import {IEditorProfile, IEditorProfileGroup, IProfileFieldEntry} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {getFieldNameTranslated, getProfileGroupNameTranslated} from '../../../utils/contentProfiles';

import {Button, IconButton, ToggleBox, Menu, Label} from 'superdesk-ui-framework/react';
import * as List from '../../UI/List';
import SortItems from '../../SortItems';

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
    }

    getListElement(item: IProfileFieldEntry) {
        const {gettext} = superdeskApi.localization;
        const {notify} = superdeskApi.ui;
        const {querySelectorParent} = superdeskApi.utilities;
        const {fields} = this.props;
        const isLastField = item.name === fields[fields.length - 1]?.name;
        const getAddFieldMenuItems = (offset) => this.props.unusedFields.map(
            (itemToAdd) => ({
                label: getFieldNameTranslated(itemToAdd.name),
                onClick: () => {
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
                testId={`content-list--field-${item.name}`}
                shadow={1}
                draggable={true}
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
            >
                {!menuItems.before.length ? null : (
                    <div className="profile-item__add-btn">
                        <div>
                            <Menu items={menuItems.before}>
                                {(toggle) => (
                                    <Button
                                        text={gettext('Add field before')}
                                        iconOnly={true}
                                        icon="plus-large"
                                        shape="round"
                                        type="primary"
                                        onClick={(event) => {
                                            toggle(event);
                                        }}
                                    />
                                )}
                            </Menu>
                        </div>
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
                        <div>
                            <Menu items={menuItems.after}>
                                {(toggle) => (
                                    <Button
                                        text={gettext('Add field after')}
                                        iconOnly={true}
                                        icon="plus-large"
                                        shape="round"
                                        type="primary"
                                        onClick={(event) => {
                                            toggle(event);
                                        }}
                                    />
                                )}
                            </Menu>
                        </div>
                    </div>
                )}
            </List.Item>
        );
    }

    renderList() {
        const {gettext} = superdeskApi.localization;

        return !this.props.fields.length ? (
            <div className="planning-profile__empty-list">
                <div>
                    <Menu
                        items={this.props.unusedFields.map((item) => ({
                            label: item.name,
                            onClick: () => {
                                this.props.insertField(item, this.props.group?._id, 0);
                            }
                        }))}
                    >
                        {(toggle) => (
                            <Button
                                text={gettext('Add first field')}
                                iconOnly={true}
                                icon="plus-large"
                                shape="round"
                                type="primary"
                                onClick={(event) => {
                                    toggle(event);
                                }}
                            />
                        )}
                    </Menu>
                </div>
            </div>
        ) : (
            <List.Group spaceBetween={true}>
                <SortItems
                    onSortChange={this.props.onSortChange}
                    items={this.props.fields}
                    getListElement={this.getListElement}
                    useCustomStyle={true}
                    lockAxis="y"
                    lockToContainerEdges={true}
                    distance={10}
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
