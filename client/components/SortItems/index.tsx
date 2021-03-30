import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

import './style.scss';

const SortableItem = SortableElement(({item, disabled, getListElement}) =>
    (
        <li
            className={classNames('sortable-list__item',
                'draggable-list__item',
                {'sortable-list__item--no-padding': getListElement})}
        >
            {getListElement ? getListElement(item) : item.label}
        </li>
    )
);

const SortableList = SortableContainer(({items, getListElement}) => (
    <ul className="sortable-list">
        {(items || []).map((item, index, arr) => (
            <SortableItem
                key={item.id}
                index={index}
                item={item}
                disabled={arr.length === 1}
                getListElement={getListElement}
            />
        )
        )}
    </ul>
)
);

class SortItems extends React.Component {
    constructor(props) {
        super(props);
        this.onSortEnd = this.onSortEnd.bind(this);
        this.onSortStart = this.onSortStart.bind(this);
    }

    onSortEnd({oldIndex, newIndex}) {
        const newItemsOrder = arrayMove(this.props.items, oldIndex, newIndex);

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
            <SortableList
                items={this.props.items}
                onSortEnd={this.onSortEnd}
                onSortStart={this.onSortStart}
                getListElement={this.props.getListElement}
            />
        );
    }
}

SortItems.propTypes = {
    onSortChange: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
    getListElement: PropTypes.func,
};

export default SortItems;
