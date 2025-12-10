import * as React from 'react';
import {connect} from 'react-redux';

import {IPlanningItem, IG2ContentType, ILockedItems, IAgenda} from '../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';

import {lockUtils} from '../../../utils';
import * as selectors from '../../../selectors';

import * as List from '../../UI/List';
import {ICON_COLORS} from '../../../constants';
import {ItemIcon} from '../../../components/ItemIcon';
import {LineItems} from '../../../components/UI/List/LineItems';
import {getPlanningSecondLineConfig, planningFirstLineConfig} from '../../../config';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {renderFields} from '../../../components/fields';

interface IOwnProps {
    item: DeepPartial<IPlanningItem>;
    active?: boolean;
    noBg?: boolean;
    showBorder?: boolean;
    showIcon?: boolean;
    shadow?: number;
    editPlanningComponent?: React.ReactNode;
    isAgendaEnabled: boolean;
    onClick?(): void;
}

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
                        firstLine={planningFirstLineConfig.filter(({fieldId}) => fieldId !== 'related_events')}
                        secondLine={
                            getPlanningSecondLineConfig({isAgendaEnabled: this.props.isAgendaEnabled})
                                .filter(({fieldId}) => fieldId !== 'related_events')
                        }
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
