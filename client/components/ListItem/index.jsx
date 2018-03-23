import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';
import {debounce} from 'lodash';
import {List} from '../UI';

export class ListItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {clickedOnce: undefined};
        this.handleDragStart = this.handleDragStart.bind(this);
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

    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData(
            `application/superdesk.item.${this.props.item.type}`,
            JSON.stringify(this.props.item)
        );
    }

    render() {
        const {
            item,
            onClick,
            onDoubleClick,
            children,
            active,
            className,
            draggable = false,
            state,
            shadow,
        } = this.props;

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onClick && onDoubleClick ? this.handleSingleAndDoubleClick.bind(this, item) :
            onClick.bind(this, item);

        return (
            <List.Item
                className={className}
                shadow={shadow}
                activated={active}
                onClick={clickHandler}
                draggable={draggable}
                onDragStart={this.handleDragStart}
            >
                <List.Border state={state} />
                {children}
            </List.Item>
        );
    }
}

ListItem.propTypes = {
    onClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    item: PropTypes.object.isRequired,
    active: PropTypes.bool,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    draggable: PropTypes.bool,
    state: PropTypes.oneOf([
        'success',
        'error',
        'locked',
        'active',
        'idle',
    ]),
    shadow: PropTypes.oneOf([1, 2, 3, 4]),
};

ListItem.defaultProps = {shadow: 2};
