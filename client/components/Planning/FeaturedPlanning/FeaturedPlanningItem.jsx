import React from 'react';
import PropTypes from 'prop-types';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {Item, Border, ItemType, PubStatus, Column, Row} from '../../UI/List';
import {Button as NavButton} from '../../UI/Nav';
import {PlanningDateTime} from '../';
import {ICON_COLORS} from '../../../constants';

import {
    planningUtils,
    isItemPublic,
    getItemId,
    isItemExpired,
    gettext,
} from '../../../utils';

export const FeaturedPlanningItem = ({
    item,
    lockedItems,
    dateFormat,
    timeFormat,
    date,
    users,
    desks,
    selectedPlanningIds,
    onAddToSelectedFeaturedPlanning,
    onRemoveFromSelectedFeaturedPlanning,
    readOnly,
    activated,
    onClick,
    withMargin,
}) => {
    if (!item) {
        return null;
    }

    const isItemLocked = planningUtils.isPlanningLocked(item, lockedItems);
    const isExpired = isItemExpired(item);
    let borderState = false;

    if (isItemLocked)
        borderState = 'locked';

    return (
        <Item
            shadow={1}
            disabled={isExpired}
            activated={activated}
            onClick={onClick.bind(null, item._id)}
            margin={withMargin}
        >
            {!readOnly && selectedPlanningIds.includes(item._id) && <Column>
                <OverlayTrigger placement="right"
                    overlay={
                        <Tooltip id={getItemId(item)}>
                            {gettext('Remove from Feature Stories')}
                        </Tooltip>
                    }
                >
                    <NavButton
                        navbtn={false}
                        className="dropdown sd-create-btn"
                        onClick={onRemoveFromSelectedFeaturedPlanning.bind(null, item)}
                        icon="icon-chevron-left-thin"
                    >
                        <span className="circle" />
                    </NavButton>
                </OverlayTrigger>
            </Column>}
            <Border state={borderState} />
            <ItemType
                item={item}
                color={!isExpired && ICON_COLORS.LIGHT_BLUE}
            />
            <PubStatus item={item} isPublic={isItemPublic(item)}/>
            <Column
                grow={true}
                border={false}
            >
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline &&
                            <span className="sd-list-item__slugline">{item.slugline}</span>
                        }
                    </span>
                    <PlanningDateTime
                        item={item}
                        date={date.format('YYYY-MM-DD')}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        users={users}
                        desks={desks} />
                </Row>
            </Column>
            {!readOnly && !selectedPlanningIds.includes(item._id) && <Column>
                <OverlayTrigger placement="left"
                    overlay={
                        <Tooltip id={getItemId(item)}>
                            {gettext('Add to Feature Stories')}
                        </Tooltip>
                    }
                >
                    <NavButton
                        className="dropdown sd-create-btn"
                        onClick={onAddToSelectedFeaturedPlanning.bind(null, item)}
                        icon="icon-chevron-right-thin"
                    >
                        <span className="circle" />
                    </NavButton>
                </OverlayTrigger>
            </Column>}
        </Item>
    );
};

FeaturedPlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.object,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    selectedPlanningIds: PropTypes.array,
    highlights: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    showAddCoverage: PropTypes.bool,
    onAddToSelectedFeaturedPlanning: PropTypes.func,
    onRemoveFromSelectedFeaturedPlanning: PropTypes.func,
    readOnly: PropTypes.bool,
    onClick: PropTypes.func,
    withMargin: PropTypes.bool,
    activated: PropTypes.bool,
};
