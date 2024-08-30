import * as React from 'react';
import {connect} from 'react-redux';

import {IPlanningItem, IG2ContentType, ILockedItems, IAgenda} from '../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {lockUtils, getItemWorkflowStateLabel} from '../../../utils';
import * as selectors from '../../../selectors';

import {Label} from 'superdesk-ui-framework/react';
import * as List from '../../UI/List';
import {AgendaNameList} from '../../Agendas';
import {CoverageIcons} from '../../Coverages/CoverageIcons';

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
        const {gettext} = superdeskApi.localization;
        const isItemLocked = lockUtils.isItemLocked(
            this.props.item,
            this.props.lockedItems
        );
        const stateLabel = getItemWorkflowStateLabel(this.props.item);
        const agendas = (this.props.item.agendas ?? [])
            .map((agendaId) => this.props.agendas[agendaId])
            .filter((agenda) => agenda != null);
        const itemDescription = this.props.item.name || this.props.item.description_text || '';

        return (
            <List.Group spaceBetween={true} className="m-0">
                <List.Item
                    noBg={this.props.noBg}
                    activated={this.props.active}
                    shadow={this.props.shadow}
                    onClick={this.props.onClick}
                >
                    {!(this.props.showBorder && isItemLocked) ? null : (
                        <List.Border state="locked" />
                    )}
                    <List.Column
                        grow={true}
                        border={false}
                    >
                        <List.Row>
                            {this.props.showIcon !== true ? null : (
                                <i
                                    role="presentation"
                                    className="icon-calendar icon--light-blue"
                                />
                            )}
                            {(this.props.item.slugline?.length ?? 0) === 0 ? null : (
                                <span className="sd-list-item__slugline">
                                    {this.props.item.slugline}
                                </span>
                            )}
                            {itemDescription.length === 0 ? null : (
                                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                    {this.props.item.name || this.props.item.description_text}
                                </span>
                            )}
                        </List.Row>
                        <List.Row
                            classes="sd-list-item__row--overflow-visible me-1"
                            style={{overflow: 'visible'}} // Adding static style here, so it works with Superdesk 2.7
                        >
                            <Label
                                text={stateLabel.label}
                                style="translucent"
                                type={stateLabel.iconType}
                            />
                            {this.props.isAgendaEnabled === false ? null : (
                                <div className="sd-display--flex">
                                    <span className="sd-list-item__text-label">
                                        {gettext('Agenda:')}
                                    </span>
                                    <span
                                        className="ms-0-5 sd-overflow--ellipsis
                                        sd-list-item__text-strong sd-list-item--element-grow"
                                    >
                                        <AgendaNameList agendas={agendas} />
                                    </span>
                                </div>
                            )}
                            <span className="sd-margin-s--auto">
                                <CoverageIcons
                                    coverages={(this.props.item.coverages ?? [])}
                                    users={this.props.users}
                                    desks={this.props.desks}
                                    contentTypes={this.props.contentTypes}
                                />
                            </span>
                        </List.Row>
                    </List.Column>
                    {this.props.editPlanningComponent == null ? null : (
                        <List.ActionMenu>
                            {this.props.editPlanningComponent}
                        </List.ActionMenu>
                    )}
                </List.Item>
            </List.Group>
        );
    }
}

export const RelatedPlanningListItem = connect<IStateProps>(mapStateToProps)(RelatedPlanningListItemComponent);
