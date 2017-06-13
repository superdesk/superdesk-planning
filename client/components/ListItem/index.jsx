import React from 'react'
import './style.scss'
import classNames from 'classnames'
import { debounce } from 'lodash'

export class ListItem extends React.Component {
    constructor(props) {
        super(props)
        this.state = { clickedOnce: undefined }
    }

    // onSingleClick, onDoubleClick and handleSingleAndDoubleClick
    // are workarounds to achieve single and double click on the same component
    onSingleClick(item) {
        this.setState({ clickedOnce: undefined })
        this.props.onClick(item)
    }

    onDoubleClick(item) {
        this.props.onDoubleClick(item)
    }

    handleSingleAndDoubleClick(item) {
        if (!this._delayedClick) {
            this._delayedClick = debounce(this.onSingleClick, 250)
        }

        if (this.state.clickedOnce) {
            this._delayedClick.cancel()
            this.setState({ clickedOnce: false })
            this.onDoubleClick(item)
        } else {
            this._delayedClick(item)
            this.setState({ clickedOnce: true })
        }
    }

    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData(
            `application/superdesk.item.${this.props.item._type}`,
            JSON.stringify(this.props.item)
        )
    }
    render() {
        const { item, onClick, onDoubleClick, children, active, className, draggable=false } = this.props

        // If there is just singleClick, use it. Change it only if doubleClick is also defined.
        const clickHandler = onClick && onDoubleClick ? this.handleSingleAndDoubleClick.bind(this, item) :
            onClick.bind(this, item)

        const classes = classNames(
            className,
            'ListItem',
            'sd-list-item',
            'sd-shadow--z1',
            { 'sd-list-item--activated': active }
        )
        return (
            <div className={classes}
                draggable={draggable}
                onDragStart={this.handleDragStart.bind(this)}
                onClick={clickHandler}>
                <div className="sd-list-item__border"/>
                {children}
            </div>
        )
    }
}

ListItem.propTypes = {
    onClick: React.PropTypes.func.isRequired,
    onDoubleClick: React.PropTypes.func,
    item: React.PropTypes.object.isRequired,
    active: React.PropTypes.bool,
    children: React.PropTypes.node.isRequired,
    className: React.PropTypes.string,
    draggable: React.PropTypes.bool,
}
