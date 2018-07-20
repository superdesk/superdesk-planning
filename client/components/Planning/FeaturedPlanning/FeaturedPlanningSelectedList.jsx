import React from 'react';
import PropTypes from 'prop-types';
import {FeaturedPlanningList} from './FeaturedPlanningList';
import './style.scss';

export const FeaturedPlanningSelectedList = ({
    items,
    readOnly,
    lockedItems,
    currentSearchDate,
    dateFormat,
    timeFormat,
    loadingIndicator,
    desks,
    users,
    leftBorder,
    onRemoveFromSelectedFeaturedPlanning,
    selectedPlanningIds,
    onSortEnd,
    onSortStart,
    highlights,
    onClick,
}) => (
    <FeaturedPlanningList
        items={items}
        readOnly={readOnly}
        lockedItems={lockedItems}
        currentSearchDate={currentSearchDate}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        loadingIndicator={loadingIndicator}
        desks={desks}
        users={users}
        onRemoveFromSelectedFeaturedPlanning={onRemoveFromSelectedFeaturedPlanning}
        selectedPlanningIds={selectedPlanningIds}
        hideItemActions
        onSortEnd={onSortEnd}
        onSortStart={onSortStart}
        sortable={!readOnly}
        leftBorder={leftBorder}
        header={gettext('Currently selected')}
        highlights={highlights}
        onClick={onClick}
        withMargin
        emptyMsg={gettext('No selected featured stories')}
    />
);

FeaturedPlanningSelectedList.propTypes = {
    featuredPlannings: PropTypes.array,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    loadingIndicator: PropTypes.bool,
    desks: PropTypes.array,
    users: PropTypes.array,
    items: PropTypes.array,
    readOnly: PropTypes.bool,
    currentSearchDate: PropTypes.object,
    leftBorder: PropTypes.bool,
    onRemoveFromSelectedFeaturedPlanning: PropTypes.func,
    selectedPlanningIds: PropTypes.array,
    onSortStart: PropTypes.func,
    onSortEnd: PropTypes.func,
    highlights: PropTypes.array,
    onClick: PropTypes.func,
};
