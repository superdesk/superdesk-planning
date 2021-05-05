/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';

import {superdeskApi} from '../../../superdeskApi';

import {getCreator, planningUtils} from '../../../utils';
import {POST_STATE} from '../../../constants';

import {FeaturedPlanningItem} from './FeaturedPlanningItem';
import {Header, Group} from '../../UI/List';
import {PanelInfo} from '../../UI';
import {AuditInformation, StateLabel} from '../../';
import './style.scss';

export const FeaturedPlanningList = ({
    item,
    items,
    readOnly,
    lockedItems,
    currentSearchDate,
    selectedPlanningIds,
    loadingIndicator,
    desks,
    users,
    onAddToSelectedFeaturedPlanning,
    onRemoveFromSelectedFeaturedPlanning,
    sortable,
    onSortEnd,
    onSortStart,
    highlights,
    onClick,
    header,
    withMargin,
    emptyMsg,
    showAuditInformation,
    contentTypes,
    disabled,
}) => {
    const {gettext} = superdeskApi.localization;
    const getItem = (item) => (
        <FeaturedPlanningItem
            key={item._id}
            item={item}
            date={currentSearchDate}
            readOnly={readOnly}
            lockedItems={lockedItems}
            selectedPlanningIds={selectedPlanningIds}
            desks={desks}
            users={users}
            onAddToSelectedFeaturedPlanning={onAddToSelectedFeaturedPlanning}
            onRemoveFromSelectedFeaturedPlanning={onRemoveFromSelectedFeaturedPlanning}
            onClick={onClick}
            withMargin={withMargin}
            contentTypes={contentTypes}
            activated={highlights.includes(item._id)}
            disabled={disabled}
        />
    );

    const SortableItem = SortableElement(({item}) => (
        <li>{getItem(item)}</li>
    ));

    const SortableList = SortableContainer(({items}) => (
        <ul>
            {items.map((item, index) =>
                item ? <SortableItem key={item._id} index={index} item={item} /> : null
            )}
        </ul>
    )
    );

    const createdBy = getCreator(item, 'original_creator', users);
    const updatedBy = getCreator(item, 'version_creator', users);
    const postedBy = getCreator(item, 'last_posted_by', users);
    const creationDate = get(item, '_created');
    const updatedDate = get(item, '_updated');
    const postedDate = get(item, 'last_posted_time');

    return (
        <div className="ListGroup">
            <Header
                marginBottom
                title={header || gettext('Available selections')}
            />
            <div>
                {showAuditInformation && item && (
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
                {!planningUtils.isFeaturedPlanningUpdatedAfterPosting(item) && get(item, 'posted') && (
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
            </div>
            {(get(items, 'length', 0) === 0 && !loadingIndicator) ?
                (<PanelInfo heading={emptyMsg} />) :
                (
                    <Group spaceBetween={true}>
                        {!sortable ?
                            items.map((item) => (getItem(item))) : (
                                <SortableList
                                    items={items}
                                    onSortEnd={onSortEnd}
                                    onSortStart={onSortStart}
                                    distance={5}
                                    helperClass="FeatureListDraggableItem"
                                />
                            )}
                    </Group>
                )}
        </div>
    );
};

FeaturedPlanningList.propTypes = {
    items: PropTypes.array,
    readOnly: PropTypes.bool,
    currentSearchDate: PropTypes.object,
    featuredPlannings: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    onAddToSelectedFeaturedPlanning: PropTypes.func,
    onRemoveFromSelectedFeaturedPlanning: PropTypes.func,
    onSortStart: PropTypes.func,
    onSortEnd: PropTypes.func,
    highlights: PropTypes.array,
    onClick: PropTypes.func,
    header: PropTypes.string,
    withMargin: PropTypes.bool,
    lockedItems: PropTypes.object.isRequired,
    loadingIndicator: PropTypes.bool,
    desks: PropTypes.array,
    users: PropTypes.array,
    itemActions: PropTypes.object,
    hideItemActions: PropTypes.bool,
    showAddCoverage: PropTypes.bool,
    sortable: PropTypes.bool,
    emptyMsg: PropTypes.string,
    item: PropTypes.object,
    showAuditInformation: PropTypes.bool,
    contentTypes: PropTypes.array,
    disabled: PropTypes.bool,
};

FeaturedPlanningList.defaultProps = {selectedPlanningIds: []};
