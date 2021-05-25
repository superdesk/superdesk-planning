import * as React from 'react';
import {connect} from 'react-redux';

import {IPlanningItem, IG2ContentType, ILockedItems} from '../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {ICON_COLORS} from '../../../constants';

import {planningUtils} from '../../../utils';
import * as selectors from '../../../selectors';

import * as List from '../../UI/List';
import {ItemIcon} from '../../ItemIcon';
import {AgendaNameList} from '../../Agendas';
import {CoverageIcon} from '../../Coverages';
import {StateLabel} from '../../StateLabel';

interface IProps {
    item: DeepPartial<IPlanningItem>;
    active?: boolean;
    noBg?: boolean;
    showBorder?: boolean;
    showIcon?: boolean;
    shadow?: number;
    editPlanningComponent?: React.ReactNode;
    onClick?(): void;

    // Redux Store
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    lockedItems: ILockedItems;
}

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
    lockedItems: selectors.locks.getLockedItems(state),
});

class RelatedPlanningListItemComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const isItemLocked = planningUtils.isPlanningLocked(
            this.props.item,
            this.props.lockedItems
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
                            <span className="sd-list-item__text-strong">{this.props.item.slugline}</span>
                        </span>
                    </List.Row>
                    <List.Row>
                        <span className="no-padding">
                            <span className="sd-list-item__text-label">{gettext('Agenda:')}</span>
                            <span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-grow">
                                <AgendaNameList agendas={this.props.item._agendas} />
                            </span>
                        </span>
                    </List.Row>
                </List.Column>
                <List.Column>
                    <List.Row>
                        <span className="sd-no-wrap">
                            {(this.props.item.coverages ?? []).map((coverage, index) => (
                                <CoverageIcon
                                    key={index}
                                    coverage={coverage}
                                    users={this.props.users}
                                    desks={this.props.desks}
                                    contentTypes={this.props.contentTypes}
                                />
                            ))}
                        </span>
                    </List.Row>
                    <StateLabel
                        item={this.props.item}
                        verbose={true}
                        className="pull-right"
                    />
                </List.Column>
                {!this.props.editPlanningComponent ? null : (
                    <List.ActionMenu>
                        {this.props.editPlanningComponent}
                    </List.ActionMenu>
                )}
            </List.Item>
        );
    }
}

export const RelatedPlanningListItem = connect(mapStateToProps)(RelatedPlanningListItemComponent);
