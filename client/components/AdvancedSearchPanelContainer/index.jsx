import React from 'react'
import { connect } from 'react-redux'
import { AdvancedSearchForm } from '../index'
import * as actions from '../../actions'
import './style.scss'

export function AdvancedSearchPanel({ onCloseAdvancedSearch, className }) {
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
                <a onClick={onCloseAdvancedSearch} className="close">
                    <i className="icon-close-small" />
                </a>
            </header>
            <AdvancedSearchForm />
        </div>
    )
}

AdvancedSearchPanel.propTypes = {
    className: React.PropTypes.string,
    onCloseAdvancedSearch: React.PropTypes.func.isRequired,
}

const mapDispatchToProps = (dispatch) => ({ onCloseAdvancedSearch: () => (dispatch(actions.closeAdvancedSearch())) })

export const AdvancedSearchPanelContainer = connect(
    null, mapDispatchToProps
)(AdvancedSearchPanel)
