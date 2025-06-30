import React from 'react';
import {List} from '../../../components/UI';
import {superdeskApi} from '../../../superdeskApi';
import {Button, Icon, IconButton} from 'superdesk-ui-framework/react';
import {getProfileGroupNameTranslated} from '../../../utils/contentProfiles';
import {IEditorProfileGroup} from 'interfaces';

interface IProps {
    group: IEditorProfileGroup;
    groups: Array<IEditorProfileGroup>;
    selectedGroup?: IEditorProfileGroup;
    onClick(group: IEditorProfileGroup): void;
    onSortChange(groups: Array<IEditorProfileGroup>): void;
    insertGroup(index: number): void;
    removeGroup(group: IEditorProfileGroup): void;
}

export default class GroupElementTemplate extends React.PureComponent<IProps, any> {
    render(): React.ReactNode {
        const {gettext} = superdeskApi.localization;
        const {querySelectorParent} = superdeskApi.utilities;
        const {groups, group} = this.props;
        const isLastGroup = group._id === groups[groups.length - 1]?._id;

        return (
            <List.Item
                className="mt-1"
                shadow={1}
                flexRow
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
                        onClick={() => {
                            this.props.insertGroup(group.index - 0.1);
                        }}
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
                        onClick={() => {
                            this.props.removeGroup(group);
                        }}
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
                            onClick={() => {
                                this.props.insertGroup(group.index + 0.1);
                            }}
                        />
                    </div>
                )}
            </List.Item>
        );
    }
}
