import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {Label, Location} from '../';
import {EVENTS, MAIN, ICON_COLORS} from '../../constants';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {EventDateTime} from './';
import {ItemActionsMenu} from '../index';
import {
    eventUtils,
    getItemWorkflowStateLabel,
    getItemActionedStateLabel,
    onEventCapture,
    isItemPublic,
    isItemExpired,
    isItemDifferent,
} from '../../utils';
import {gettext} from '../../utils/gettext';
import {renderFields} from '../fields';

const PRIMARY_FIELDS = ['slugline', 'internalnote', 'name'];


export class EventItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hover: false};
        this.onItemHoverOn = this.onItemHoverOn.bind(this);
        this.onItemHoverOff = this.onItemHoverOff.bind(this);
        this.renderItemActions = this.renderItemActions.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return isItemDifferent(this.props, nextProps) || this.state.hover !== nextState.hover;
    }

    onItemHoverOn() {
        this.setState({hover: true});
    }

    onItemHoverOff() {
        this.setState({hover: false});
    }

    renderItemActions() {
        if (!this.state.hover) {
            return null;
        }

        const {session, privileges, item, lockedItems, calendars} = this.props;
        const callBacks = {
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName].bind(null, item, true),
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName],
        };
        const itemActions = eventUtils.getEventActions({item, session, privileges, lockedItems, callBacks, calendars});

        if (get(itemActions, 'length', 0) === 0) {
            return null;
        }

        return (
            <ActionMenu>
                <ItemActionsMenu actions={itemActions} wide={true}/>
            </ActionMenu>
        );
    }

    render() {
        const {item, onItemClick, lockedItems, dateFormat, timeFormat,
            activeFilter, toggleRelatedPlanning, onMultiSelectClick, calendars, listFields} = this.props;

        if (!item) {
            return null;
        }

        const hasPlanning = eventUtils.eventHasPlanning(item);
        const isItemLocked = eventUtils.isEventLocked(item, lockedItems);
        const state = getItemWorkflowStateLabel(item);
        const actionedState = getItemActionedStateLabel(item);
        const hasLocation = !!get(item, 'location.name') ||
            !!get(item, 'location.formatted_address');
        const showRelatedPlanningLink = activeFilter === MAIN.FILTERS.COMBINED && hasPlanning;

        let borderState = false;

        if (isItemLocked)
            borderState = 'locked';
        else if (hasPlanning)
            borderState = 'active';


        const isExpired = isItemExpired(item);
        const isCalendarActive = (cal) => (get(calendars.find((c) => c.qcode === cal.qcode), 'is_active', false));

        return (
            <Item
                shadow={1}
                activated={this.props.multiSelected}
                onClick={() => onItemClick(item)}
                disabled={isExpired}
                onMouseLeave={this.onItemHoverOff}
                onMouseEnter={this.onItemHoverOn}
            >
                <Border state={borderState} />
                <ItemType
                    item={item}
                    hasCheck={activeFilter !== MAIN.FILTERS.COMBINED}
                    checked={this.props.multiSelected}
                    onCheckToggle={onMultiSelectClick.bind(null, item)}
                    color={!isExpired && ICON_COLORS.DARK_BLUE_GREY}
                />
                <PubStatus item={item} isPublic={isItemPublic(item)}/>
                <Column
                    grow={true}
                    border={false}>
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {renderFields(get(listFields, 'event.primary_fields', PRIMARY_FIELDS), item)}
                        </span>
                        <EventDateTime
                            item={item}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                        />
                    </Row>
                    <Row>
                        {isExpired && (
                            <Label
                                text={gettext('Expired')}
                                iconType="alert"
                                isHollow={true}
                            />
                        )}
                        <Label
                            text={gettext(state.label)}
                            iconType={state.iconType}
                        />
                        {!!actionedState && <Label
                            onClick={(e) => {
                                onEventCapture(e);
                                onItemClick({
                                    _id: item.reschedule_from,
                                    type: 'event',
                                });
                            }}
                            text={gettext(actionedState.label)}
                            iconType={actionedState.iconType}
                        />}
                        <span className="sd-list-item__text-label">{gettext('Calendar:')}</span>
                        {<span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-rm-10">
                            {get(item, 'calendars.length', 0) > 0 && item.calendars.map((c, index, arr) =>
                                <span key={c.qcode}
                                    className={!isCalendarActive(c) ? 'sd-list-item__text--disabled' : ''}>
                                    {c.name}{arr.length - 1 > index && ', '}
                                </span>)
                            }
                            {get(item, 'calendars.length', 0) === 0 && <span>{gettext('No  calendar assigned')}</span>}
                        </span>}
                        {(showRelatedPlanningLink || hasLocation) &&
                            <span
                                className="sd-overflow-ellipsis sd-list-item--element-grow sd-list-item__element-lm-10">
                                {showRelatedPlanningLink &&
                                <a
                                    className="sd-line-input__input--related-item-link"
                                    onClick={toggleRelatedPlanning}
                                >
                                    <i className="icon-calendar" />
                                    {this.props.relatedPlanningText}
                                </a>}
                                {hasLocation && <Location
                                    name={get(item, 'location.name')}
                                    address={get(item, 'location.formatted_address')}
                                />}
                            </span>
                        }

                    </Row>
                </Column>
                {this.renderItemActions()}
            </Item>
        );
    }
}

EventItem.propTypes = {
    item: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    toggleRelatedPlanning: PropTypes.func,
    relatedPlanningText: PropTypes.string,
    multiSelected: PropTypes.bool,
    onMultiSelectClick: PropTypes.func,
    calendars: PropTypes.array,
    listFields: PropTypes.object,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]: PropTypes.func,
};

EventItem.defaultProps = {
    togglePlanningItem: () => { /* no-op */ },
};
