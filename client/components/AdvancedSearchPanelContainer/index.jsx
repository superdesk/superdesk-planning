import React from 'react'
import { connect } from 'react-redux'
import { EventsAdvancedSearchForm, PlanningAdvancedSearchForm } from '../index'
import { ADVANCED_SEARCH_CONTEXT } from '../../constants'
import * as actions from '../../actions'
import './style.scss'

class AdvancedSearchPanelComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    handleClick() {
        this.props.onCloseAdvancedSearch(this.props.searchContext)
    }

    render() {
        const { className, searchContext } = this.props
        const classes = [
            'Planning__advanced-search',
            className,
        ].join(' ')
        return (
            <div className={classes}>
                <header className="subnav">
                    <h3 className="subnav__page-title">
                        <span>Advanced Search</span>
                    </h3>
                    <a onClick={this.handleClick.bind(this)} className="close">
                        <i className="icon-close-small" />
                    </a>
                </header>
                { searchContext === ADVANCED_SEARCH_CONTEXT.EVENT && <EventsAdvancedSearchForm /> }
                { searchContext === ADVANCED_SEARCH_CONTEXT.PLANNING && <PlanningAdvancedSearchForm /> }
            </div>
        )
    }
}

AdvancedSearchPanelComponent.propTypes = {
    className: React.PropTypes.string,
    onCloseAdvancedSearch: React.PropTypes.func.isRequired,
    searchContext: React.PropTypes.string,
}

const mapDispatchToProps = (dispatch) => ({
    onCloseAdvancedSearch: (context) => {
        if (context === ADVANCED_SEARCH_CONTEXT.EVENT) {
            dispatch(actions.events.ui.closeAdvancedSearch())
            return
        }

        dispatch(actions.planning.ui.closeAdvancedSearch())
    },
})

export const AdvancedSearchPanelContainer = connect(
    null, mapDispatchToProps
)(AdvancedSearchPanelComponent)
