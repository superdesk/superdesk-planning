import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import './style.scss'

export class ItemActionsMenu extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isOpen: false }
    }

    toggleMenu(event) {
        event.preventDefault()
        event.stopPropagation()
        this.setState({ isOpen: !this.state.isOpen })
    }

    closeMenu(event) {
        event.preventDefault()
        event.stopPropagation()
        this.setState({ isOpen: false })
    }

    triggerAction(action, event) {
        this.closeMenu(event)
        action.callback()
    }

    render() {
        const toggleMenu = this.toggleMenu.bind(this)
        const menu = this.state.isOpen ? this.renderMenu(this.props.actions) : null
        const classes = classNames('dropdown', 'ItemActionsMenu', 'pull-right', { open: this.state.isOpen })

        return (
            <div className={classes}>
                <button className="dropdown__toggle" onClick={toggleMenu}>
                    <i className="icon-dots-vertical" />
                </button>
                {menu}
            </div>
        )
    }

    renderMenu(actions) {
        let items = actions.map(this.renderItem.bind(this))

        if (!items.length) {
            items = <li><button onClick={this.closeMenu.bind(this)}>There are no actions available.</button></li>
        }

        return (
            <ul className="dropdown__menu">
                {items}
            </ul>
        )
    }

    renderItem(action) {
        const trigger = this.triggerAction.bind(this, action)
        return (
            <li key={action.label}>
                <button onClick={trigger}>{action.label}</button>
            </li>
        )
    }
}

ItemActionsMenu.propTypes = { actions: PropTypes.array.isRequired }
