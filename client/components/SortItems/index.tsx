import React from 'react';
import classNames from 'classnames';
import {SortableContainer, SortableElement, arrayMove, SortableContainerProps} from 'react-sortable-hoc';

import './style.scss';

const SortableItem = SortableElement(({item, disabled, getListElement, useCustomStyle}) =>
    useCustomStyle ?
        getListElement(item) :
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

const SortableList = SortableContainer(({items, useCustomStyle, getListElement}) => (
    <ul className="sortable-list">
        {(items || []).map((item, index, arr) => (
            <SortableItem
                key={item.id ?? item._id ?? index}
                index={index}
                item={item}
                disabled={arr.length === 1}
                getListElement={getListElement}
                useCustomStyle={useCustomStyle}
            />
        )
        )}
    </ul>
)
);

interface IProps extends SortableContainerProps {
    items: Array<any>;
    useCustomStyle?: boolean;
    onSortChange(items: Array<any>): void;
    getListElement(item: any): any
}

class SortItems extends React.PureComponent<IProps> {
    cursor: string;

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
        const {
            items,
            onSortChange,
            getListElement,
            useCustomStyle,
            ...props
        } = this.props;

        return (
            <SortableList
                items={items}
                onSortEnd={this.onSortEnd}
                onSortStart={this.onSortStart}
                getListElement={getListElement}
                useCustomStyle={useCustomStyle}
                {...props}
            />
        );
    }
}

export default SortItems;
