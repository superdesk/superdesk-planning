import React from 'react'
import './style.scss'

export class QuickAddPlanning extends React.Component {

    constructor(props) {
        super(props)
        this.state = { slugline: '' }
    }

    handleChange(event) {
        this.setState({ slugline: event.target.value })
    }

    handleSubmit(event) {
        event.preventDefault()
        this.setState({ slugline: '' })
        this.props.onPlanningCreation({ slugline: this.state.slugline })
    }

    render() {
        const { slugline } = this.state
        return (
            <div className="ListItem quick-add-planning">
                <i className="icon-plus-sign" onClick={this.handleSubmit.bind(this)}/>
                <form onSubmit={this.handleSubmit.bind(this)}>
                    <input type="text" className="line-input" placeholder="Add" value={slugline} onChange={this.handleChange.bind(this)}/>
                </form>
            </div>
        )
    }
}

QuickAddPlanning.propTypes = { onPlanningCreation: React.PropTypes.func.isRequired }
