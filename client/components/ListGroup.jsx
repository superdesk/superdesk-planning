import React from 'react';
import PropTypes from 'prop-types';

import ListGroupItem from './ListGroupItem';

class ListGroup extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {name, items} = this.props;

        return (
            <div>
                <div className="sd-list-header">
                    <span className="sd-list-header__name">{name}</span>
                </div>
                <div className="sd-list-item-group sd-list-item-group--space-between-items">
                    {items.map((item) =>
                        <ListGroupItem
                            key={item._id}
                            item={item}
                            onClick={() => this.props.onItemClick(item)}
                        />
                    )}
                </div>
            </div>
        );
    }
}

ListGroup.propTypes = {
    name: PropTypes.string,
    items: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
};

export default ListGroup;
