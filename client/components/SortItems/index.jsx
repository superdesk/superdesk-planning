import React from 'react';
import PropTypes from 'prop-types';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

import './style.scss';

const SortableItem = SortableElement(({label, disabled}) =>
    <li className="sortable-list__item draggable-list__item">{label}</li>
);

const SortableList = SortableContainer(({items}) =>
    <ul className="sortable-list">
        {(items || []).map((item, index, arr) =>
            <SortableItem key={item.id} index={index} label={item.label} disabled={arr.length === 1}/>
        )}
    </ul>
);

class SortItems extends React.Component {
    constructor(props) {
        super(props);
        this.state = {items: this.props.items};
        this.onSortEnd = this.onSortEnd.bind(this);
        this.onSortStart = this.onSortStart.bind(this);
    }

    onSortEnd({oldIndex, newIndex}) {
        const newItemsOrder = arrayMove(this.state.items, oldIndex, newIndex);

        this.setState({items: newItemsOrder});
        document.body.style.cursor = this.cursor;
        if (this.props.onSortChange) {
            this.props.onSortChange(newItemsOrder);
        }
    }

    // set cursor to move during whole drag
    onSortStart() {
        this.cursor = document.body.style.cursor;
        document.body.style.cursor = 'move';
    }

    render() {
        return (
            <SortableList items={this.state.items}
                onSortEnd={this.onSortEnd}
                onSortStart={this.onSortStart}
            />
        );
    }
}

SortItems.propTypes = {
    onSortChange: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
};

export default SortItems;
