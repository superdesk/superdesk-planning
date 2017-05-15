import React from 'react'
import DebounceInput from 'react-debounce-input'
import { isNil, uniqueId } from 'lodash'
import './style.scss'

export default class SearchBar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // initialize state from props
            searchBarExtended: !isNil(this.props.value),
            searchInputValue: this.props.value || '',
            uniqueId: uniqueId('SearchBar'),
        }
    }

    toggleSearchBar() {
        this.setState({ searchBarExtended: !this.state.searchBarExtended })
    }

    /** Reset the field value, close the search bar and load events */
    resetSearch() {
        this.setState({
            searchBarExtended: false,
            searchInputValue: '',
        })
        this.props.onSearch()
    }

    /** Search events by keywords */
    onSearchChange(event) {
        const value = event.target.value
        this.setState(
            { searchInputValue: value || '' },
            // update the input value since we are using the DebounceInput `value` prop
            () => this.props.onSearch(value)
        )
    }

    render() {
        const { searchBarExtended, uniqueId } = this.state
        return (
            <div className={'SearchBar flat-searchbar' + (searchBarExtended ? ' extended' : '')}>
                <div className="search-handler">
                    <label
                        htmlFor={uniqueId}
                        className="trigger-icon"
                        onClick={this.toggleSearchBar.bind(this)}>
                        <i className="icon-search" />
                    </label>
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={500}
                        value={this.state.searchInputValue}
                        onChange={this.onSearchChange.bind(this)}
                        id={uniqueId}
                        placeholder="Search"
                        type="text"/>
                    <button
                        className="search-close visible"
                        onClick={this.resetSearch.bind(this)}>
                        <i className="icon-remove-sign" />
                    </button>
                    <button className="search-close">
                        <i className="svg-icon-right" />
                    </button>
                </div>
            </div>
        )
    }
}

SearchBar.propTypes = {
    onSearch: React.PropTypes.func.isRequired,
    value: React.PropTypes.string,
}
