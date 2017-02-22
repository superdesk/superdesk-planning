import React from 'react'
import './style.scss'

export class ListItem extends React.Component {
    constructor(props) {
        super(props)
    }
    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData(
            `application/superdesk.item.${this.props.item._type}`,
            JSON.stringify(this.props.item)
        )
    }
    render() {
        const { item, onClick, children, active, className, draggable=false } = this.props
        const classes = [
            'ListItem__list-item',
            'list-item-view',
            (active ? 'active' : null),
            className,
        ].join(' ')
        return (
            <li className={classes} draggable={draggable} onDragStart={this.handleDragStart.bind(this)}>
                <div className="media-box media-text">
                    <div className="item-info" onClick={onClick.bind(this, item)}>
                        {children}
                    </div>
                </div>
            </li>
        )
    }
}

ListItem.propTypes = {
    onClick: React.PropTypes.func.isRequired,
    item: React.PropTypes.object.isRequired,
    active: React.PropTypes.bool,
    children: React.PropTypes.node.isRequired,
    className: React.PropTypes.string,
    draggable: React.PropTypes.bool,
}
