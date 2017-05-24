import React from 'react'
import { SearchBar } from '../../components'
import ReactDOM from 'react-dom'
import './style.scss'

export class CoverageAssignSelect extends React.Component {
    constructor(props) {
        super(props)
        this.handleClickOutside = this.handleClickOutside.bind(this)
        this.state = {
            filteredUserList: this.props.users,
            filteredDeskList: this.props.desks,
        }
    }

    filterList(value) {
        if (!value) {
            this.setState({
                filteredUserList: this.props.users,
                filteredDeskList: this.props.desks,
            })
            return
        }

        const valueNoCase = value.toLowerCase()

        const newUserList = this.props.users.filter((user) => (
            user.display_name.toLowerCase().substr(0, value.length) === valueNoCase ||
                user.display_name.toLowerCase().indexOf(valueNoCase) >= 0
        ))
        const newDeskList = this.props.desks.filter((desk) => (
            desk.name.toLowerCase().substr(0, value.length) === valueNoCase ||
                desk.name.toLowerCase().indexOf(valueNoCase) >= 0
        ))

        this.setState({
            filteredUserList: newUserList,
            filteredDeskList: newDeskList,
        })
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel()
        }
    }

    onDeskAssignChange(value) {
        this.props.onDeskAssignChange(value)
        this.props.onCancel()
    }

    onUserAssignChange(value) {
        this.props.onUserAssignChange(value)
        this.props.onCancel()
    }

    render() {
        return (<div className='coverageassignselect'>
            <label>Assign</label>
            <div className='coverageassignselect__search'>
                <SearchBar onSearch={(value) => {this.filterList(value)}} minLength={1}/>
            </div>
            <ul className='coverageassignselect__list'>
                {this.state.filteredDeskList.map((desk, index) => (
                    <li key={index} className='coverageassignselect__item'>
                        <button type='button' onClick={this.onDeskAssignChange.bind(this, desk._id)}>
                            <figure className='avatar desk'/>
                            <div className='coverageassignselect__label'>{desk.name}</div>
                        </button>
                    </li>
                ))}
                {this.state.filteredUserList.map((user, index) => (
                    <li key={index} className='coverageassignselect__item'>
                        <button type='button' onClick={this.onUserAssignChange.bind(this, user._id)}>
                            <figure className='avatar initials coverageassign__initials'>
                                <span>{user.display_name.replace(/\W*(\w)\w*/g, '$1').toUpperCase()}</span>
                            </figure>
                            <div className='coverageassignselect__label'>{user.display_name}</div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>)
    }
}

CoverageAssignSelect.propTypes = {
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    onCancel: React.PropTypes.func.isRequired,
    onDeskAssignChange: React.PropTypes.func.isRequired,
    onUserAssignChange: React.PropTypes.func.isRequired,
}
