import React from 'react';
import PropTypes from 'prop-types';
import {debounce} from 'lodash';

import {EventItem} from '../Events/';

import {ITEM_TYPE} from '../../constants';
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
            timeFormat
        } = this.props;
        const itemType = getItemType(item);

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onClick && onDoubleClick ? this.handleSingleAndDoubleClick.bind(this, item) :
            onClick.bind(this, item);

        switch (itemType) {
        case ITEM_TYPE.COMBINED:
            return null;

        case ITEM_TYPE.EVENT:
            return (
                <EventItem
                    item={item}
                    onClick={clickHandler}
                    lockedItems={lockedItems}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                />
            );

        case ITEM_TYPE.PLANNING:
            return null;
        }

        return null;
    }
}

ListGroupItem.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
};
