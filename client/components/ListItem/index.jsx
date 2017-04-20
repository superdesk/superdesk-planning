import React from 'react'
import './style.scss'

export class ListItem extends React.Component {
    constructor(props) {
        super(props)
    }
    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData(
            `application/superdesk.item.${this.props.item._type}`,
            JSON.stringify(this.props.item)
        )
    }
    render() {
        const { item, onClick, children, active, className, draggable=false } = this.props
        const classes = [
            'ListItem',
            'sd-list-item',
            'sd-shadow--z1',
            (active ? 'active' : null),
            className,
        ].join(' ')
        return (
            <div className={classes}
                draggable={draggable}
                onDragStart={this.handleDragStart.bind(this)}
                onClick={onClick.bind(this, item)}>
                <div className="sd-list-item__border"/>
                {children}
            </div>
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
