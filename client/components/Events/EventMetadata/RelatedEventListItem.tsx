import * as React from 'react';
import {connect} from 'react-redux';

import {IEventItem, ILockedItems} from '../../../interfaces';
import {ICON_COLORS} from '../../../constants';

import {lockUtils} from '../../../utils';
import * as selectors from '../../../selectors';

import * as List from '../../UI/List';
import {ItemIcon} from '../../ItemIcon';
import {LineItems} from '../../../components/UI/List/LineItems';
import {eventFirstLineConfig, eventSecondLineConfig} from '../../../config';
import {renderFields} from '../../../components/fields';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {ILineConfig} from 'globals';

interface IProps {
    item: DeepPartial<IEventItem>;
    active?: boolean;
    noBg?: boolean;
    showBorder?: boolean;
    showIcon?: boolean;
    shadow?: number;
    dateOnly?: boolean;
    eventActions?: React.ReactNode;
    onClick?(): void;

    // Redux Store
    lockedItems: ILockedItems;
}

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
});

class RelatedEventListItemComponent extends React.PureComponent<IProps> {
    render() {
        const {item} = this.props;
        const isItemLocked = lockUtils.isItemLocked(
            item,
            this.props.lockedItems
        );

        const language = item.language || getUserInterfaceLanguageFromCV();

        const renderFieldsWithProps = (fields: Array<ILineConfig>) => renderFields(
            fields,
            item,
            {
                fieldsProps: {
                    // nothing field specific needed
                },
            },
            language,
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
                    style={{paddingBlock: 'var(--space--1)'}}
                >
                    <LineItems
                        firstLine={eventFirstLineConfig.filter(({fieldId}) => fieldId !== 'related_plannings')}
                        secondLine={eventSecondLineConfig.filter(({fieldId}) => fieldId !== 'related_plannings')}
                        renderFieldsWithProps={renderFieldsWithProps}
                    />
                </List.Column>

                {!this.props.eventActions ? null : (
                    <List.ActionMenu>
                        {this.props.eventActions}
                    </List.ActionMenu>
                )}
            </List.Item>
        );
    }
}

export const RelatedEventListItem = connect(mapStateToProps)(RelatedEventListItemComponent);
