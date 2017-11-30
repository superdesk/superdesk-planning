import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { get } from 'lodash'
import { ActionsMenu } from './ActionsMenu'
import { GENERIC_ITEM_ACTIONS } from '../../constants'
import './style.scss'
import { renderToBody, closeActionsMenu } from 'superdesk-core/scripts/apps/search/helpers'

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

        if ((!domNode && event.target.className !== 'ItemActionsMenu__action')) {
            if (this.state.isOpen) {
                this.closeMenu()
            }
        }
    }

    closeMenu(event) {
        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }

        closeActionsMenu()
        this.setState({ isOpen: false })
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
        if (this.isEmptyActions() || this.state.isOpen) {
            return null
        }

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
                <button className={buttonClasses} onClick={this.renderMenu.bind(this)}>
                    <i className="icon-dots-vertical" />
                </button>
            </div>
        )
    }

    renderMenu(event) {
        event.preventDefault()
        event.stopPropagation()
        let elem = React.createElement(ActionsMenu, {
            actions: this.props.actions,
            closeMenu: this.closeMenu.bind(this),
        })

        let icon = ReactDOM.findDOMNode(this).getElementsByClassName('icon-dots-vertical')[0]
        renderToBody(elem, icon)

        this.setState({ isOpen: true })
    }
}

ItemActionsMenu.propTypes = {
    actions: PropTypes.array.isRequired,
    buttonClass: PropTypes.string,
}

ItemActionsMenu.defaultProps = { actions: [] }