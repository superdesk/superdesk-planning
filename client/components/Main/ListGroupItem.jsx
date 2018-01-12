import React from 'react';
import PropTypes from 'prop-types';
import {debounce} from 'lodash';

import {EventItem} from '../Events/';
import {PlanningItem} from '../Planning';

import {ITEM_TYPE, EVENTS, PLANNING} from '../../constants';
import {getItemType} from '../../utils';

import '../../planning.scss';

export class ListGroupItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {clickedOnce: undefined};
    }

    // onSingleClick, onDoubleClick and handleSingleAndDoubleClick
    // are workarounds to achieve single and double click on the same component
    onSingleClick(item) {
        this.setState({clickedOnce: undefined});
        this.props.onClick(item);
    }

    onDoubleClick(item) {
        this.props.onDoubleClick(item);
    }

    handleSingleAndDoubleClick(item) {
        if (!this._delayedClick) {
            this._delayedClick = debounce(this.onSingleClick, 250);
        }

        if (this.state.clickedOnce) {
            this._delayedClick.cancel();
            this.setState({clickedOnce: false});
            this.onDoubleClick(item);
        } else {
            this._delayedClick(item);
            this.setState({clickedOnce: true});
        }
    }

    render() {
        const {
            item,
            onClick,
            onDoubleClick,
            lockedItems,
            dateFormat,
            timeFormat,
            agendas,
            date,
            session,
            privileges,
        } = this.props;
        const itemType = getItemType(item);

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onClick && onDoubleClick ? this.handleSingleAndDoubleClick.bind(this, item) :
            onClick.bind(this, item);

        let itemProps = {
            item: item,
            onClick: clickHandler,
            lockedItems: lockedItems,
            dateFormat: dateFormat,
            timeFormat: timeFormat,
            session: session,
            privileges: privileges,
        };

        switch (itemType) {
        case ITEM_TYPE.COMBINED:
            return null;

        case ITEM_TYPE.EVENT:
            itemProps = {
                ...itemProps,
                [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
                [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
                [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
                [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
                [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
                [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
                [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
                [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
                [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
            };
            return (
                <EventItem { ... itemProps } />
            );

        case ITEM_TYPE.PLANNING:
            itemProps = {
                ...itemProps,
                date: date,
                agendas: agendas,
                [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                    this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
                [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
                    this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
                [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
                    this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
                [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                    this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
                [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                    this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
                [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
                [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
                [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
                [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
                [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                    this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
            };
            return (
                <PlanningItem { ...itemProps } />
            );
        }

        return null;
    }
}

ListGroupItem.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
};
