import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { SearchBar } from '../../index'
import $ from 'jquery'
import './style.scss'

export class SelectFieldPopup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            multiLevel: false,
            currentParent: null,
            selectedAncestry: [],
            search: false,
            activeOptionIndex: -1,
        }
        this.handleClickOutside = this.handleClickOutside.bind(this)
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this)
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch(event.keyCode) {
                case 27:
                    // ESC key
                    event.preventDefault()
                    this.props.onCancel()
                    break
                case 13:
                    // ENTER key
                    event.preventDefault()
                    this.handleEnterKey(event)
                    break
                case 40:
                    // arrowDown key
                    event.preventDefault()
                    this.handleDownArrowKey(event)
                    break
                case 38:
                    // arrowUp key
                    event.preventDefault()
                    this.handleUpArrowKey(event)
                    break
                case 37:
                    // left key
                    event.preventDefault()
                    if (this.state.selectedAncestry.length > 0) {
                        this.popParent(true)
                    }
                    break
                case 39:
                    // right key
                    event.preventDefault()
                    if (this.state.activeOptionIndex !== -1) {
                        this.onMutiLevelSelect(this.state.filteredList[this.state.activeOptionIndex],
                            true)
                    }
                    break
            }
        }
    }

    handleEnterKey() {
        if (this.state.multiLevel) {
            if (this.state.activeOptionIndex !== -1) {
                this.onSelect(this.state.filteredList[this.state.activeOptionIndex])
            } else {
                this.onSelect(this.state.currentParent)
            }
        } else {
            if (this.state.activeOptionIndex !== -1) {
                this.onSelect(this.state.filteredList[this.state.activeOptionIndex])
            }
        }
    }

    handleDownArrowKey(event) {
        if ( event.target.id && event.target.id.indexOf('SearchBar') >= 0 ) {
            // Lose focus on SearchBar
            event.target.blur()

            this.setState({ activeOptionIndex: 0 })
        } else if ( this.state.activeOptionIndex < this.state.filteredList.length - 1 ) {
            this.setState({ activeOptionIndex: this.state.activeOptionIndex + 1 })
            this.scrollListItemIfNeeded(this.state.activeOptionIndex + 1)
        }
    }

    handleUpArrowKey() {
        if (this.state.activeOptionIndex === 0) {
            if (this.state.selectedAncestry.length === 0) {
                // Search bar handle
                // Focus the searchBar input
                this.refs.searchBar.refs.searchIcon.focus()
                this.setState({ activeOptionIndex: -1 })
            } else {
                // Choose entire category
                this.setState({ activeOptionIndex: -1 })
            }
        } else {
            this.setState({ activeOptionIndex: this.state.activeOptionIndex - 1 })
            this.scrollListItemIfNeeded(this.state.activeOptionIndex - 1)
        }
    }

    scrollListItemIfNeeded(index)
    {
        if (this.refs.itemList.children.length > 0) {
            let activeElement = this.refs.itemList.children[index]
            if (activeElement) {
                let distanceOfSelItemFromVisibleTop = $(activeElement).offset().top - $(document).scrollTop() -
                $(this.refs.itemList).offset().top - $(document).scrollTop()

                // If the selected item goes beyond container view, scroll it to middle.
                if (distanceOfSelItemFromVisibleTop >= this.refs.itemList.clientHeight ||
                    distanceOfSelItemFromVisibleTop < 0) {
                    $(this.refs.itemList).scrollTop($(this.refs.itemList).scrollTop() + distanceOfSelItemFromVisibleTop -
                    this.refs.itemList.offsetHeight * 0.5)
                }
            }
        }
    }

    componentWillMount() {
        const multi = this.props.options.filter((o) => (o.value.parent)).length > 0 ?
            true : false

        // There is at least one parent or multi-level option
        this.setState({
            multiLevel: multi,
            filteredList: this.getFilteredOptionList(multi),
        })
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
        document.addEventListener('keydown', this.handleKeyBoardEvent )
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
        document.removeEventListener('keydown', this.handleKeyBoardEvent )
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel()
        }
    }

    onSelect(opt) {
        this.props.onChange(opt)
    }

    getFilteredOptionList(multiLevel, currentParent, searchList) {
        if (multiLevel) {
            let filteredList

            if (searchList) {
                filteredList = searchList
            } else {
                filteredList = currentParent ?
                    this.props.options.filter((option) => (
                        option.value.parent === currentParent.value.qcode
                    ), this) :
                    this.props.options.filter((option) => (!option.value.parent))
            }
            return filteredList
        } else {
            return searchList ? searchList : this.props.options
        }

    }

    onMutiLevelSelect(opt, keyDown=false) {
        if (opt && !this.state.searchList && this.isOptionAParent(opt)) {
            if (!this.state.selectedAncestry.find((o) => (opt[this.props.valueKey] === o[this.props.valueKey]))) {
                this.setState({
                    currentParent: opt,
                    selectedAncestry: [...this.state.selectedAncestry, opt],
                    filteredList: this.getFilteredOptionList(this.state.multiLevel,
                        opt, null),
                    activeOptionIndex: 0,
                })
            }
        } else if (!keyDown) {
            this.onSelect(opt)
        }
    }

    isOptionAParent(opt) {
        return this.props.options.filter((option) => (
                option.value.parent === opt.value.qcode
            )).length > 0
    }

    chooseEntireCategory() {
        this.onSelect(this.state.currentParent)
    }

    popParent(keydown) {
        const len = this.state.selectedAncestry.length
        const opt = len > 1 ? this.state.selectedAncestry[len - 2] : null
        const activeOption = keydown === true ? 0 : -1
        this.setState({
            currentParent: opt,
            selectedAncestry: this.state.selectedAncestry.splice(0, len - 1),
            filteredList: this.getFilteredOptionList(this.state.multiLevel,
                opt, null),
            activeOptionIndex: activeOption,
        })
    }

    filterSearchResults(val) {
        if (!val) {
            this.setState({
                search: false,
                filteredList: this.getFilteredOptionList(this.state.multiLevel,
                    null),
            })
            return
        }

        const valueNoCase = val.toLowerCase()
        const searchResults = this.props.options.filter((opt) => (
            opt[this.props.valueKey].toLowerCase().substr(0, val.length) === valueNoCase ||
                opt[this.props.valueKey].toLowerCase().indexOf(valueNoCase) >= 0
        ))

        this.setState({
            search: true,
            filteredList: this.getFilteredOptionList(this.state.multiLevel,
                null, searchResults),
        })
    }

    renderSingleLevelSelect() {
        return (<div className='Select__popup'>
            <div>
                <div className='Select__popup__search'>
                    <SearchBar onSearch={(val) => {this.filterSearchResults(val)}} minLength={1}
                        extendOnOpen={true} ref='searchBar'/>
                </div>
                <ul className='Select__popup__list' ref='itemList'>
                    {this.state.filteredList.map((opt, index) => (
                        <li key={index} className={ (index === this.state.activeOptionIndex ?
                            'Select__popup__item--active ' : '') + 'Select__popup__item'}>
                            <button type='button' onClick={this.onSelect.bind(this,
                                this.state.filteredList[index])} >
                                <span>{ opt.label }</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>)
    }

    renderMultiLevelSelect() {
        return (<div className='Select__popup'>
                <div className='Select__popup__search'>
                        { (this.state.currentParent &&
                            (<div>
                                <i className='backlink' onClick={this.popParent.bind(this)}/>
                                <button type='button' className={(this.state.activeOptionIndex === -1 ?
                                    'Select__popup__item--active ' : '') + 'Select__popup__category'}
                            onClick={this.chooseEntireCategory.bind(this)}>
                                    <div id='parent' className='Select__popup__parent'>{this.state.currentParent.label}</div>
                                    <div id='choose' className='Select__popup__parent--choose'>Choose entire category</div>
                                </button>
                            </div>))
                        || <SearchBar onSearch={(val) => {this.filterSearchResults(val)}} minLength={1}
                            extendOnOpen={true}  ref='searchBar'/> }
                </div>
                <ul className='dropdown-menu Select__popup__list' ref='itemList'>
                    {this.state.filteredList.map((opt, index) => (
                        <li key={index} className={ (index === this.state.activeOptionIndex ?
                                'Select__popup__item--active ' : '') + 'Select__popup__item'} >
                            <button type='button' onClick={this.onMutiLevelSelect.bind(this,
                                this.state.filteredList[index], false)}>
                                <span>{ opt.label }</span>
                                { !this.state.search && this.isOptionAParent(opt) && <i className='icon-chevron-right-thin' /> }
                            </button>
                        </li>
                    ))}
                </ul>
        </div>)
    }

    render() {
        return this.state.multiLevel ? this.renderMultiLevelSelect() : this.renderSingleLevelSelect()
    }
}

SelectFieldPopup.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    valueKey: PropTypes.string,
}

SelectFieldPopup.defaultProps = { valueKey: 'label' }
