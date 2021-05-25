import * as React from 'react';
import {connect} from 'react-redux';

import {IEventItem, ILockedItems} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import {ICON_COLORS} from '../../../constants';

import {eventUtils} from '../../../utils';
import * as selectors from '../../../selectors';

import * as List from '../../UI/List';
import {ItemIcon} from '../../ItemIcon';
import {StateLabel} from '../../StateLabel';

interface IProps {
    item: DeepPartial<IEventItem>;
    active?: boolean;
    noBg?: boolean;
    showBorder?: boolean;
    showIcon?: boolean;
    shadow?: number;
    dateOnly?: boolean;
    editEventComponent?: React.ReactNode;
    onClick?(): void;

    // Redux Store
    lockedItems: ILockedItems;
}

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
});

class RelatedEventListItemComponent extends React.PureComponent<IProps> {
    render() {
        const isItemLocked = eventUtils.isEventLocked(
            this.props.item,
            this.props.lockedItems
        );
        const dateStr = eventUtils.getDateStringForEvent(
            this.props.item,
            this.props.dateOnly,
            true,
            false
        );

        return (
            <List.Item
                noBg={this.props.noBg}
                activated={this.props.active}
                shadow={this.props.shadow}
                onClick={this.props.onClick}
            >
                {!(this.props.showBorder && isItemLocked) ? null : (
                    <List.Border state="locked" />
                )}
                <div className="sd-list-item__border" />
                {!this.props.showIcon ? null : (
                    <List.Column>
                        <ItemIcon
                            item={this.props.item}
                            color={ICON_COLORS.DARK_BLUE_GREY}
                        />
                    </List.Column>
                )}
                <List.Column
                    grow={true}
                    border={false}
                >
                    <List.Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">{this.props.item.name}</span>
                        </span>
                    </List.Row>
                    <List.Row>
                        <time className="no-padding">
                            <i className="icon-time" />
                            {dateStr}
                        </time>
                    </List.Row>
                </List.Column>
                <List.Column>
                    <StateLabel
                        item={this.props.item}
                        verbose={true}
                        className="pull-right"
                        withExpiredStatus={true}
                    />
                </List.Column>
                {!this.props.editEventComponent ? null : (
                    <List.ActionMenu>
                        {this.props.editEventComponent}
                    </List.ActionMenu>
                )}
            </List.Item>
        );
    }
}

export const RelatedEventListItem = connect(mapStateToProps)(RelatedEventListItemComponent);
