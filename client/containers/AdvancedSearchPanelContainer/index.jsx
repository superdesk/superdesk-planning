import React from 'react'
import { connect } from 'react-redux'
import { AdvancedSearchForm } from '../../containers/AdvancedSearchForm/index'
import * as actions from '../../actions'
import './style.scss'

export class AdvancedSearchPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    onCloseSearch() {
        this.props.closeAdvancedSearch()
    }

    render() {
        const { closeAdvancedSearch } = this.props
        return (
            <div className={'Planning__advanced-search ' + this.props.className }>
                <header className="subnav">
                    <h3 className="subnav__page-title">
                        <span>Advanced Search</span>
                    </h3>
                    <a onClick={this.onCloseSearch.bind(this)} className="close">
                        <i className="icon-close-small" />
                    </a>
                </header>
                <AdvancedSearchForm />
            </div>
        )
    }
}

AdvancedSearchPanel.propTypes = {
    className: React.PropTypes.string,
    closeAdvancedSearch: React.PropTypes.func.isRequired
}

const mapDispatchToProps = (dispatch) => ({
    closeAdvancedSearch: () => (dispatch(actions.closeAdvancedSearch()))
})

export const AdvancedSearchPanelContainer = connect(
    null, mapDispatchToProps
)(AdvancedSearchPanel)
