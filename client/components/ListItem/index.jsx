import React from 'react'
import { Dropdown, MenuItem } from 'react-bootstrap'
import './style.scss'

export const ListItem = ({ item, onClick, actions, children, active }) => {
    const classes = ['ListItem__list-item', 'list-item-view', (active ? 'active' : null)].join(' ')
    return (
        <li className={classes}>
            <div className="media-box media-text">
                <div className="item-info" onClick={onClick.bind(this, item)}>
                    {children}
                </div>
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
            </div>
        </li>
    )
}

ListItem.propTypes = {
    onClick: React.PropTypes.func.isRequired,
    actions: React.PropTypes.array,
    item: React.PropTypes.object.isRequired,
    active: React.PropTypes.bool,
    children: React.PropTypes.node.isRequired,

}
