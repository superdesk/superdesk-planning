import React from 'react'
import { Dropdown, MenuItem } from 'react-bootstrap'
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
        const { item, onClick, actions, children, active, className, draggable=false } = this.props
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
                    {actions &&
                        <Dropdown className="ListItem__more-actions" id={`dropdownMenuFor${item._id}`}>
                            <Dropdown.Toggle noCaret className="dropdown__toggle">
                                <i className="icon-dots-vertical" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="dropdown dropdown__menu more-activity-menu">
                                <li>
                                    <div className="dropdown__menu-label">
                                        Actions
                                        <button className="dropdown__menu-close">
                                            <i className="icon-close-small" />
                                        </button>
                                    </div>
                                </li>
                                <MenuItem divider />
                                {actions && actions.map((action, index) => (
                                    <li key={'action' + index} onClick={action.action}>
                                        <a>{action.label}</a>
                                    </li>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    }
                </div>
            </li>
        )
    }
}

ListItem.propTypes = {
    onClick: React.PropTypes.func.isRequired,
    actions: React.PropTypes.array,
    item: React.PropTypes.object.isRequired,
    active: React.PropTypes.bool,
    children: React.PropTypes.node.isRequired,
    className: React.PropTypes.string,
    draggable: React.PropTypes.bool,
}
