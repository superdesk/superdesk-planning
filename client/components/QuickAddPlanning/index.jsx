import React from 'react'
import './style.scss'

const COMPONENT_CLASS_NAME = 'quick-add-planning'

export class QuickAddPlanning extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            editMode: false,
            slugline: ''
        }
    }

    disable() {
        this.setState({
            editMode: false,
            slugline: '',
        })
    }

    enable() {
        this.setState({ editMode: true })
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
        const { className } = this.props
        const { editMode, slugline } = this.state
        const classes = [
            COMPONENT_CLASS_NAME,
            editMode ?  `${COMPONENT_CLASS_NAME}--enabled` : null,
            className,
        ].join(' ')
        return (
            <li className={classes} onClick={this.enable.bind(this)}>
                {!editMode &&
                    <span><i className="svg-icon-plus" /> Add a planning</span>
                }
                {editMode &&
                    <form onSubmit={this.handleSubmit.bind(this)}>
                        <label>Add a planning</label>
                        <div className={`${COMPONENT_CLASS_NAME}__field`}>
                            <input type="text" className="line-input" placeholder="Slugline" autoFocus value={slugline} onChange={this.handleChange.bind(this)}/>
                            <i className="icon-close-small" onClick={(e)=>{e.stopPropagation(); this.disable()}} />
                        </div>
                    </form>
                }
            </li>
        )
    }
}

QuickAddPlanning.propTypes = {
    className: React.PropTypes.string,
    onPlanningCreation: React.PropTypes.func.isRequired,
}
