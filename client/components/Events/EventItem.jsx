import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import {Label} from '../';
import {EVENTS, MAIN, ICON_COLORS, WORKFLOW_STATE} from '../../constants';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {EventDateTime} from './';
import {ItemActionsMenu} from '../index';
import {
    eventUtils,
    onEventCapture,
    isItemPosted,
    isItemExpired,
    isItemDifferent,
    getItemWorkflowState,
} from '../../utils';
import {gettext} from '../../utils/gettext';
import {renderFields} from '../fields';
import {getDeployConfig} from '../../selectors/config';


export class EventItemComponent extends React.Component {
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

        const {session, privileges, item, lockedItems, calendars, deployConfig} = this.props;
        const callBacks = {
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName].bind(null, item, true),
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName].bind(null, item, false, true),
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
            [EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName],
            [EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName].bind(null, item),
        };
        const itemActions = eventUtils.getEventActions(
            {item, session, privileges, lockedItems, callBacks, calendars, deployConfig}
        );

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
        const {
            item,
            onItemClick,
            lockedItems,
            dateFormat,
            timeFormat,
            activeFilter,
            toggleRelatedPlanning,
            onMultiSelectClick,
            calendars,
            listFields,
            active,
            refNode,
        } = this.props;

        if (!item) {
            return null;
        }

        const hasPlanning = eventUtils.eventHasPlanning(item);
        const isItemLocked = eventUtils.isEventLocked(item, lockedItems);
        const showRelatedPlanningLink = activeFilter === MAIN.FILTERS.COMBINED && hasPlanning;

        let borderState = false;

        if (isItemLocked)
            borderState = 'locked';
        else if (hasPlanning)
            borderState = 'active';


        const isExpired = isItemExpired(item);

        const secondaryFields = get(listFields, 'event.secondary_fields', EVENTS.LIST.SECONDARY_FIELDS);

        return (
            <Item
                shadow={1}
                activated={this.props.multiSelected || active}
                onClick={() => onItemClick(item)}
                disabled={isExpired}
                onMouseLeave={this.onItemHoverOff}
                onMouseEnter={this.onItemHoverOn}
                refNode={refNode}
            >
                <Border state={borderState} />
                <ItemType
                    item={item}
                    hasCheck={activeFilter !== MAIN.FILTERS.COMBINED}
                    checked={this.props.multiSelected}
                    onCheckToggle={onMultiSelectClick.bind(null, item)}
                    color={!isExpired && ICON_COLORS.DARK_BLUE_GREY}
                />
                <PubStatus item={item} isPublic={isItemPosted(item) &&
                    getItemWorkflowState(item) !== WORKFLOW_STATE.KILLED}/>
                <Column
                    grow={true}
                    border={false}>
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {renderFields(get(listFields, 'event.primary_fields',
                                EVENTS.LIST.PRIMARY_FIELDS), item)}
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

                        {secondaryFields.includes('state') && renderFields('state', item) }
                        {secondaryFields.includes('actionedState') &&
                            renderFields('actionedState', item, {
                                onClick: (e) => {
                                    onEventCapture(e);
                                    onItemClick({
                                        _id: item.reschedule_from,
                                        type: 'event',
                                    });
                                },
                            })
                        }
                        {eventUtils.isEventCompleted(item) && (
                            <Label
                                text={gettext('Event Completed')}
                                iconType="success"
                                isHollow={true}
                            />
                        )}
                        {secondaryFields.includes('calendars') && renderFields('calendars', item, {
                            calendars: calendars,
                        }) }

                        {secondaryFields.includes('files') && renderFields('files', item)}


                        {(showRelatedPlanningLink) &&
                            <span
                                className="sd-overflow-ellipsis sd-list-item__element-lm-10">
                                <a className="sd-line-input__input--related-item-link"
                                    onClick={toggleRelatedPlanning} >
                                    <i className="icon-calendar" />
                                    {this.props.relatedPlanningText}
                                </a>
                            </span>
                        }

                        {secondaryFields.includes('location') && renderFields('location', item)}


                    </Row>
                </Column>
                {this.renderItemActions()}
            </Item>
        );
    }
}

EventItemComponent.propTypes = {
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
    refNode: PropTypes.func,
    active: PropTypes.bool,
    deployConfig: PropTypes.object.isRequired,
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

EventItemComponent.defaultProps = {
    togglePlanningItem: () => { /* no-op */ },
};

function mapStateToProps(state) {
    return {
        deployConfig: getDeployConfig(state),
    };
}

export const EventItem = connect(mapStateToProps)(EventItemComponent);