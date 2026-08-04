import * as React from 'react';
import {connect} from 'react-redux';

import {IEventItem, ILockedItems} from '../../../interfaces';
import {ICON_COLORS} from '../../../constants';
import {superdeskApi} from '../../../superdeskApi';

import {lockUtils} from '../../../utils';
import * as selectors from '../../../selectors';

import * as List from '../../UI/List';
import {ItemIcon} from '../../ItemIcon';
import {LineItems} from '../../../components/UI/List/LineItems';
import {
    eventFirstLineConfig,
    eventSecondLineConfig,
    getEventCardFirstLineConfig,
    getEventCardSecondLineConfig,
} from '../../../config';
import {renderFields} from '../../../components/fields';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {ILineConfig} from 'globals';
import {Checkbox} from 'superdesk-ui-framework/react';

interface IBaseProps {
    item: DeepPartial<IEventItem>;
    active?: boolean;
    noBg?: boolean;
    showBorder?: boolean;
    showIcon?: boolean;

    // Preview card variant: card_view config, no item type icon
    cardView?: boolean;
    shadow?: number;
    dateOnly?: boolean;
    eventActions?: React.ReactNode;
    noColumnPadding?: boolean;
    onClick?(): void;

    // Redux Store
    lockedItems: ILockedItems;
}

interface IWithoutCheckboxProps extends IBaseProps {
    showCheckbox?: never;
    checked?: never;
    onCheckToggle?: never;
}

interface IWithCheckboxProps extends IBaseProps {
    showCheckbox: true;
    checked: boolean;
    onCheckToggle(value: boolean): void;
}

type IProps = IWithoutCheckboxProps | IWithCheckboxProps;

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
});

class RelatedEventListItemComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
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

        const firstLineConfig = this.props.cardView ? getEventCardFirstLineConfig() : eventFirstLineConfig;
        const secondLineConfig = this.props.cardView ? getEventCardSecondLineConfig() : eventSecondLineConfig;

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

                {!this.props.showCheckbox ? null : (
                    <List.Column>
                        <Checkbox
                            label={{
                                text: gettext('Selected'),
                                hidden: true,
                            }}
                            checked={this.props.checked}
                            onChange={this.props.onCheckToggle}
                        />
                    </List.Column>
                )}

                {(this.props.cardView || !this.props.showIcon) ? null : (
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
                    style={this.props.noColumnPadding ? undefined : {paddingBlock: 'var(--space--1)'}}
                >
                    <LineItems
                        firstLine={firstLineConfig.filter(({fieldId}) => fieldId !== 'related_plannings')}
                        secondLine={secondLineConfig.filter(({fieldId}) => fieldId !== 'related_plannings')}
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
