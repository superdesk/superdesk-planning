import React from 'react';
import PropTypes from 'prop-types';

import Datetime from './Datetime';

class ListGroupItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hover: false };
    }

    render() {
        const {item, onClick} = this.props;
        return (
            <div className="sd-list-item sd-shadow--z1" onClick={onClick}>
                <div className="sd-list-item__border" />
                <div className="sd-list-item__column">
                    <i className="icon-calendar-list" />
                </div>
                <div className="sd-list-item__column">
                    <span className="badge badge--light">{' '}</span>
                </div>
                <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                    <div className="sd-list-item__row">
                        <span className="label label--hollow">Draft</span>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__slugline">{item.slugline}</span>
                            {item.name}
                        </span>
                        <Datetime date={item.dates.start} />
                    </div>
                </div>
                <div className="sd-list-item__action-menu">
                    <button className="icn-btn">
                        <i className="icon-dots-vertical" />
                    </button>
                </div>
            </div>
        )
    }
}

ListGroupItem.propTypes = {
    item: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default ListGroupItem;
