import * as React from 'react';

import {IEditorProfileGroup} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {getProfileGroupNameTranslated} from '../../../utils/contentProfiles';

import {Icon, Button, IconButton} from 'superdesk-ui-framework/react';
import * as List from '../../UI/List';
import SortItems from '../../SortItems';

interface IProps {
    groups: Array<IEditorProfileGroup>;
    selectedGroup?: IEditorProfileGroup;
    onClick(group: IEditorProfileGroup): void;
    onSortChange(groups: Array<IEditorProfileGroup>): void;
    insertGroup(index: number): void;
    removeGroup(group: IEditorProfileGroup): void;
}

export class GroupList extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.getListElement = this.getListElement.bind(this);
    }

    getListElement(group: IEditorProfileGroup) {
        const {gettext} = superdeskApi.localization;
        const {querySelectorParent} = superdeskApi.utilities;
        const {groups} = this.props;
        const isLastGroup = group._id === groups[groups.length - 1]?._id;

        return (
            <List.Item
                shadow={1}
                draggable={true}
                activated={this.props.selectedGroup?._id === group._id}
                onClick={(e) => {
                    // don't trigger editor if click went to a three dot menu
                    // or other button inside the list item
                    if (
                        e.target instanceof HTMLElement &&
                        querySelectorParent(e.target, 'button', {self: true})
                    ) {
                        return;
                    }
                    this.props.onClick(group);
                }}
            >
                <div className="profile-item__add-btn">
                    <Button
                        text={gettext('Add group before')}
                        iconOnly={true}
                        icon="plus-large"
                        shape="round"
                        type="primary"
                        onClick={() => this.props.insertGroup(group.index - 0.1)}
                    />
                </div>
                {!group.icon.length ? null : (
                    <List.Column border={false}>
                        <Icon name={group.icon} />
                    </List.Column>
                )}
                <List.Column
                    border={false}
                    grow={true}
                >
                    <List.Row>
                        <span className="sd-text__strong">
                            {getProfileGroupNameTranslated(group)}
                        </span>
                    </List.Row>
                </List.Column>
                <List.ActionMenu>
                    <IconButton
                        icon="trash"
                        ariaValue={gettext('Remove group')}
                        onClick={() => this.props.removeGroup(group)}
                    />
                </List.ActionMenu>
                {!isLastGroup ? null : (
                    <div className="profile-item__add-btn profile-item__add-btn--bottom">
                        <Button
                            text={gettext('Add group after')}
                            iconOnly={true}
                            icon="plus-large"
                            shape="round"
                            type="primary"
                            onClick={() => this.props.insertGroup(group.index + 0.1)}
                        />
                    </div>
                )}
            </List.Item>
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return !this.props.groups.length ? (
            <div className="planning-profile__empty-list sd-padding-x--2 sd-padding-y--3">
                <Button
                    text={gettext('Add first group')}
                    iconOnly={true}
                    icon="plus-large"
                    shape="round"
                    type="primary"
                    onClick={() => this.props.insertGroup(0)}
                />
            </div>
        ) : (
            <List.Group
                spaceBetween={true}
                className="sd-padding-x--2 sd-padding-y--3"
            >
                <SortItems
                    key={this.props.selectedGroup?._id}
                    onSortChange={this.props.onSortChange}
                    items={this.props.groups}
                    getListElement={this.getListElement}
                    useCustomStyle={true}
                    lockAxis="y"
                    lockToContainerEdges={true}
                    distance={10}
                />
            </List.Group>
        );
    }
}
