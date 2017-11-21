import React from 'react';
import PropTypes from 'prop-types';

import ListGroupItem from './ListGroupItem';

function ListGroup({ name, items }) {
    return (
        <div>
            <div className="sd-list-header">
                <span className="sd-list-header__name">{name}</span>
            </div>
            <div className="sd-list-item-group sd-list-item-group--space-between-items">
                {items.map((item) => <ListGroupItem key={item._id} item={item} />)}
            </div>
        </div>
    )
}

ListGroup.propTypes = {
    name: PropTypes.string,
    items: PropTypes.array,
};

export default ListGroup
