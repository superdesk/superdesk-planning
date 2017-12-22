import React from 'react';
import PropTypes from 'prop-types';
import {debounce} from 'lodash';

import {EventItem} from '../Events/';
import {PlanningItem} from '../Planning';

import {ITEM_TYPE, EVENTS} from '../../constants';
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
                    this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]
            };
            return (
                <EventItem { ... itemProps } />
            );

        case ITEM_TYPE.PLANNING:
            return (
                <PlanningItem
                    item={item}
                    date={date}
                    onClick={clickHandler}
                    lockedItems={lockedItems}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    agendas={agendas}
                />
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
};
