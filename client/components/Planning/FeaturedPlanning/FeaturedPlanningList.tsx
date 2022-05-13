/* eslint-disable react/no-multi-comp */
import React from 'react';
import {get} from 'lodash';
import {connect} from 'react-redux';
import moment from 'moment-timezone';

import {IDesk, IUser} from 'superdesk-api';
import {IFeaturedPlanningItem, IG2ContentType, ILockedItems, IPlanningItem} from '../../../interfaces';

import {superdeskApi} from '../../../superdeskApi';
import * as selectors from '../../../selectors';

import {getCreator, planningUtils} from '../../../utils';
import {POST_STATE} from '../../../constants';

import {ListItemLoader} from 'superdesk-ui-framework/react';
import {FeaturedPlanningItem} from './FeaturedPlanningItem';
import {Header, Group} from '../../UI/List';
import {PanelInfo} from '../../UI';
import {AuditInformation, StateLabel} from '../../';
import SortItems from '../../SortItems';
import './style.scss';

interface IProps {
    testId: string;
    disabled?: boolean;
    withMargin?: boolean;
    readOnly: boolean;
    item: IFeaturedPlanningItem;
    items: Array<IPlanningItem>;
    selectedPlanningIds: Array<IPlanningItem['_id']>;
    header?: string;
    showAuditInformation?: boolean;
    emptyMsg?: string;
    sortable?: boolean;

    // Redux Props
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    loading: boolean;
    lockedItems: ILockedItems;
    currentSearchDate: moment.Moment;
    highlights: Array<IPlanningItem['_id']>;
    onAddToSelectedFeaturedPlanning(item: IPlanningItem, event: any): void;
    onRemoveFromSelectedFeaturedPlanning(item: IPlanningItem, event: any): void;
    onClick(item: IPlanningItem, event: React.MouseEvent<HTMLLIElement>): void;
    onSortChange?(items: Array<IPlanningItem>): void;
}

class FeaturedPlanningListComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.renderItem = this.renderItem.bind(this);
    }

    renderItem(item: IPlanningItem) {
        return (
            <FeaturedPlanningItem
                key={item._id}
                item={item}
                date={this.props.currentSearchDate}
                readOnly={this.props.readOnly}
                lockedItems={this.props.lockedItems}
                selectedPlanningIds={this.props.selectedPlanningIds || []}
                desks={this.props.desks}
                users={this.props.users}
                onAddToSelectedFeaturedPlanning={this.props.onAddToSelectedFeaturedPlanning}
                onRemoveFromSelectedFeaturedPlanning={this.props.onRemoveFromSelectedFeaturedPlanning}
                onClick={this.props.onClick}
                withMargin={this.props.withMargin}
                contentTypes={this.props.contentTypes}
                activated={this.props.highlights.includes(item._id)}
                disabled={this.props.disabled}
            />
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const createdBy = getCreator(this.props.item, 'original_creator', this.props.users);
        const updatedBy = getCreator(this.props.item, 'version_creator', this.props.users);
        const postedBy = getCreator(this.props.item, 'last_posted_by', this.props.users);
        const creationDate = get(this.props.item, '_created');
        const updatedDate = get(this.props.item, '_updated');
        const postedDate = get(this.props.item, 'last_posted_time');

        return (
            <div
                className="ListGroup"
                data-test-id={this.props.testId}
            >
                <Header
                    marginBottom
                    title={this.props.header || gettext('Available selections')}
                />
                {this.props.loading ? (
                    <div>
                        <Group spaceBetween={true}>
                            <ListItemLoader />
                        </Group>
                    </div>
                ) : (
                    <React.Fragment>
                        <div>
                            {!this.props.showAuditInformation ? null : (
                                <React.Fragment>
                                    {this.props.item && (
                                        <div className="grid__item grid__item--col-6">
                                            <AuditInformation
                                                createdBy={createdBy}
                                                updatedBy={updatedBy}
                                                postedBy={postedBy}
                                                createdAt={creationDate}
                                                updatedAt={updatedDate}
                                                postedAt={postedDate}
                                            />
                                        </div>
                                    )}
                                    {(
                                        !planningUtils.isFeaturedPlanningUpdatedAfterPosting(this.props.item) &&
                                        this.props.item?.posted
                                    ) && (
                                        <div className="grid__item grid__item--col-6">
                                            <div className="pull-right">
                                                <StateLabel
                                                    item={{pubstatus: POST_STATE.USABLE}}
                                                    verbose={true}
                                                    noState
                                                />
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                        </div>
                        {(get(this.props.items, 'length', 0) === 0 && !this.props.loading) ?
                            (<PanelInfo heading={this.props.emptyMsg} />) :
                            (
                                <Group spaceBetween={true}>
                                    {!this.props.sortable ?
                                        this.props.items.map((item) => this.renderItem(item)) :
                                        (
                                            <SortItems
                                                onSortChange={this.props.onSortChange}
                                                items={this.props.items}
                                                getListElement={this.renderItem}
                                                useCustomStyle={true}
                                                lockAxis="y"
                                                lockToContainerEdges={true}
                                                distance={5}
                                                helperClass="FeatureListDraggableItem"
                                            />
                                        )
                                    }
                                </Group>
                            )}
                    </React.Fragment>
                )}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),

    loading: selectors.featuredPlanning.loading(state),
    lockedItems: selectors.locks.getLockedItems(state),
    currentSearchDate: selectors.featuredPlanning.currentSearchDate(state),
    highlights: selectors.featuredPlanning.highlightsList(state),
});

export const FeaturedPlanningList = connect(mapStateToProps)(FeaturedPlanningListComponent);
