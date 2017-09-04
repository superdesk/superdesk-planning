import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

export class ToggleBox extends React.Component {
    constructor(props) {
        super(props)
        this.state = { isOpen: this.props.isOpen }
    }

    toggle() {
        this.setState({ isOpen: !this.state.isOpen })
    }

    render() {
        const {
            style,
            title,
            children,
        } = this.props

        return (
            <div className={classNames('toggle-box', style, { 'hidden': !this.state.isOpen })}>
                <div className="toggle-box__header" onClick={this.toggle.bind(this)}>
                    <div className="toggle-box__chevron"><i className="icon-chevron-right-thin"/></div>
                    <div className="toggle-box__label">{title}</div>
                    <div className="toggle-box__line"/>
                </div>
                <div className="toggle-box__content-wraper">
                {
                    this.state.isOpen &&
                    <div className="toggle-box__content">
                        {children}
                    </div>
                }
                </div>
            </div>
        )
    }
}

ToggleBox.propTypes = {
    style: PropTypes.string,
    isOpen: PropTypes.bool,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
}

ToggleBox.defaultProps = { isOpen: true }
