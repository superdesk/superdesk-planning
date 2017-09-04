import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { get } from 'lodash'
import { GENERIC_ITEM_ACTIONS } from '../../constants'
import './style.scss'

export class ItemActionsMenu extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isOpen: false }
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.setState({ isOpen: false })
        }
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

    ignoreAction(event) {
        event.preventDefault()
        event.stopPropagation()
    }

    isEmptyActions() {
        if (get(this.props, 'actions.length', 0) < 1) {
            return true
        } else {
            // Do we have only dividers ?
            return this.props.actions.filter((action) =>
                action.label !== GENERIC_ITEM_ACTIONS.DIVIDER.label).length <= 0
        }
    }

    render() {
        if (this.isEmptyActions()) {
            return null
        }

        const toggleMenu = this.toggleMenu.bind(this)
        const menu = this.state.isOpen ? this.renderMenu(this.props.actions) : null
        const classes = classNames(
            'dropdown',
            'ItemActionsMenu',
            'pull-right',
            { open: this.state.isOpen }
        )

        const buttonClasses = classNames(
            'dropdown__toggle',
            { [this.props.buttonClass]: this.props.buttonClass }
        )

        return (
            <div className={classes}>
                <button className={buttonClasses} onClick={toggleMenu}>
                    <i className="icon-dots-vertical" />
                </button>
                {menu}
            </div>
        )
    }

    renderMenu(actions) {
        let items = actions.map(this.renderItem.bind(this))

        return (
            <ul className="dropdown__menu">
                <li onClick={this.ignoreAction.bind(this)}>
                    <div className="dropdown__menu-label">Actions<button className='dropdown__menu-close'
                        onClick={this.toggleMenu.bind(this)}>
                        <i className='icon-close-small' /></button>
                    </div>
                </li>
                <li className="dropdown__menu-divider" />
                {items}
            </ul>
        )
    }

    renderItem(action) {
        const key = action.key ? action.key : action.label

        if (Array.isArray(action.callback)) {
            let items = action.callback.map(this.renderItem.bind(this))

            if (!items.length) {
                items = <li><button onClick={this.closeMenu.bind(this)}>There are no actions available.</button></li>
            }

            const submenuDirection = get(action, 'direction', 'left')

            return (
                <li key={'submenu-' + key}>
                    <div className="dropdown">
                        <button className="dropdown__toggle" onClick={this.closeMenu.bind(this)}>
                            {action.icon && (<i className={action.icon}/>)}
                            {action.label}
                        </button>
                        <ul className={'dropdown__menu dropdown__menu--submenu-' + submenuDirection}>
                            {items}
                        </ul>
                    </div>
                </li>
            )
        }

        if (action.label === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            return <li key={key} className="dropdown__menu-divider" />
        }

        const trigger = this.triggerAction.bind(this, action)
        return (
            <li key={key}>
                <button onClick={trigger}>
                    {action.icon && (<i className={action.icon}/>)}
                    {action.label}
                </button>
            </li>
        )
    }
}

ItemActionsMenu.propTypes = {
    actions: PropTypes.array.isRequired,
    buttonClass: PropTypes.string,
}
