import React from 'react'
import PropTypes from 'prop-types'
import * as actions from '../../actions'

export class AuthoringMenu extends React.Component {
    constructor(props) {
        super(props)
        this.handleClick = this.handleClick.bind(this)
        this.state = { canLinkItem: true }
    }

    handleClick(action, type) {
        let item = this.props.store.getState().item
        // this dispatch is to start the superdesk activity to launch modal.
        return this.props.store.dispatch(
            actions.assignments.ui.onAuthoringMenuClick(action, type, item)
        )
    }

    componentDidMount() {
        let item = this.props.store.getState().item
        // this dispatch is to check if the user can link item.
        this.props.store.dispatch(actions.assignments.ui.canLinkItem(item))
        .then((result) => {
            this.setState({ canLinkItem: result })
        })
    }

    render() {
        if(!this.state.canLinkItem) {
            return null
        }

        return (
            <ul key="planning-authoring-menu">
                <li key="planning-authoring-menu-divider" className="dropdown__menu-divider" />
                <li key="planning-authoring-menu-label">
                    <span className="dropdown__menu-label">Planning</span>
                </li>
                <li key="planning-authoring-menu-fulfil-assignment">
                    <button
                        id="fulfil-assignment"
                        type="button"
                        onClick={() => this.handleClick('planning', 'fulfil')}>
                        FulFil Assignment</button>
                </li>
                <li key="planning-authoring-menu-addto-planning">
                    <button
                        id="addto-planning"
                        type="button"
                        onClick={() => this.handleClick('planning', 'addto')}>
                        Add to Planning</button>
                </li>
            </ul>
        )
    }
}

AuthoringMenu.propTypes = { store: PropTypes.object }
