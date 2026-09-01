import * as React from 'react';
import {connect} from 'react-redux';

import {IPlanningItem, IG2ContentType, ILockedItems, IAgenda} from '../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {lockUtils} from '../../../utils';
import * as selectors from '../../../selectors';

import * as List from '../../UI/List';
import {ICON_COLORS} from '../../../constants';
import {ItemIcon} from '../../../components/ItemIcon';
import {LineItems} from '../../../components/UI/List/LineItems';
import {
    getPlanningCardFirstLineConfig,
    getPlanningCardSecondLineConfig,
    getPlanningSecondLineConfig,
    planningFirstLineConfig,
} from '../../../config';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {renderFields} from '../../../components/fields';
import {ILineConfig} from 'globals';
import {Checkbox} from 'superdesk-ui-framework/react';

interface IBaseProps {
    item: DeepPartial<IPlanningItem>;
    active?: boolean;
    noBg?: boolean;
    showBorder?: boolean;
    showIcon?: boolean;

    // Preview card variant: card_view config, no item type icon
    cardView?: boolean;
    shadow?: number;
    editPlanningComponent?: React.ReactNode;
    isAgendaEnabled: boolean;
    noColumnPadding?: boolean;
    onClick?(): void;
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

type IOwnProps = IWithoutCheckboxProps | IWithCheckboxProps;

interface IStateProps {
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    lockedItems: ILockedItems;
    agendas: {[agendaId: string]: IAgenda};
}

type IProps = IOwnProps & IStateProps;

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
    lockedItems: selectors.locks.getLockedItems(state),
    agendas: selectors.general.agendasById(state),
});

class RelatedPlanningListItemComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const isItemLocked = lockUtils.isItemLocked(
            this.props.item,
            this.props.lockedItems
        );
        const language = this.props.item.language || getUserInterfaceLanguageFromCV();

        const renderFieldsWithProps = (fields: Array<ILineConfig>) => renderFields(
            fields,
            this.props.item,
            {
                fieldsProps: {
                    // no field specific config needed yet
                },
            },
            language,
        );

        const {isAgendaEnabled} = this.props;
        const firstLineConfig = this.props.cardView ? getPlanningCardFirstLineConfig() : planningFirstLineConfig;
        const secondLineConfig = this.props.cardView ?
            getPlanningCardSecondLineConfig({isAgendaEnabled}) :
            getPlanningSecondLineConfig({isAgendaEnabled});

        return (
            <List.Item
                testId="related-planning-item"
                noBg={this.props.noBg}
                activated={this.props.active}
                shadow={this.props.shadow}
                onClick={this.props.onClick}
            >
                {!(this.props.showBorder && isItemLocked) ? null : (
                    <List.Border state="locked" />
                )}

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
                    <List.Column testId="item-type-icon">
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
                        firstLine={firstLineConfig.filter(({fieldId}) => fieldId !== 'related_events')}
                        secondLine={secondLineConfig.filter(({fieldId}) => fieldId !== 'related_events')}
                        renderFieldsWithProps={renderFieldsWithProps}
                    />
                </List.Column>

                {this.props.editPlanningComponent == null ? null : (
                    <List.ActionMenu>
                        {this.props.editPlanningComponent}
                    </List.ActionMenu>
                )}
            </List.Item>
        );
    }
}

export const RelatedPlanningListItem = connect<IStateProps>(mapStateToProps)(RelatedPlanningListItemComponent);
