import React from 'react'
import { AdvancedSearchForm } from '../../containers/AdvancedSearchForm/index'
import './style.scss'

export class AdvancedSearchPanel extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className={'Planning__advanced-search ' + this.props.className }>
                <AdvancedSearchForm />
            </div>
        )
    }
}

