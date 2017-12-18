import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {ListGroupItem} from './';

export class ListGroup extends React.Component {
    render() {
        const {name, items, lockedItems, dateFormat, timeFormat, agendas} = this.props;

        return (
            <div>
                <div className="sd-list-header">
                    <span className="sd-list-header__name">{moment(name).format('dddd LL')}</span>
                </div>
                <div className="sd-list-item-group sd-list-item-group--space-between-items">
                    {items.map((item) =>
                        <ListGroupItem
                            key={item._id}
                            date={name}
                            item={item}
                            onClick={this.props.onItemClick.bind(null, item)}
                            onDoubleClick={this.props.onDoubleClick.bind(null, item)}
                            lockedItems={lockedItems}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                            agendas={agendas}
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
    onDoubleClick: PropTypes.func,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
};
