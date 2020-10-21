import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {get} from 'lodash';

import * as actions from '../../../actions';
import {contactsLoading, contactsTotal, contactsPage} from '../../../selectors/general';
import {CONTACTS} from '../../../constants';

import {uiUtils, onEventCapture, gettext} from '../../../utils';
import {KEYCODES} from '../../../constants';

import {SearchField, Button} from '../../UI';
import {Popup} from '../../UI/Popup';

import {ContactLabel} from '../';

import './style.scss';


export class SelectListPopupComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: false,
            activeOptionIndex: -1,
            openFilterList: false,
            filteredList: [],
            options: [],
            searchText: '',
        };

        this.dom = {
            listItems: null,
            searchField: null,
        };

        this.onKeyDown = this.onKeyDown.bind(this);
        this.closeSearchList = this.closeSearchList.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.openSearchList = this.openSearchList.bind(this);
        this.filterSearchResults = this.filterSearchResults.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.page < this.props.page && this.dom.listItems) {
            this.dom.listItems.scrollTop = 0;
        }
    }

    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey(event);
                break;
            }
        }
    }

    handleEnterKey() {
        this.onSelect(this.state.filteredList[this.state.activeOptionIndex]);
    }

    handleDownArrowKey(event) {
        if (event.target.id && event.target.id.indexOf('SearchField') >= 0) {
            // Lose focus on Search Field
            event.target.blur();

            this.setState({activeOptionIndex: 0});
        } else if (this.state.activeOptionIndex < this.state.filteredList.length - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.listItems);
        }
    }

    handleUpArrowKey(event) {
        this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
        uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.listItems);
    }

    handleScroll(event) {
        if (this.props.loading) {
            return;
        }

        const node = event.target;
        const {total, page} = this.props;

        if (node && total > get(this.state.options, 'length', 0)) {
            if (node.scrollTop + node.offsetHeight + 100 >= node.scrollHeight) {
                this.getSearchResult(this.state.searchText, page + 1);
            }
        }
    }

    onAdd(event) {
        this.closeSearchList();
        this.dom.searchField.resetSearch();
        this.props.onAdd();
    }

    onSelect(opt) {
        if (this.state.openFilterList) {
            this.props.onChange(opt);
            this.dom.searchField.resetSearch();
            this.closeSearchList();
        }
    }

    getFilteredOptionList(searchList) {
        return searchList ? searchList : this.state.options;
    }

    filterSearchResults(val) {
        if (this.props.minLength > 0 && (!val || get(val, 'length') < this.props.minLength)) {
            this.setState({
                search: false,
                filteredList: this.getFilteredOptionList(),
                openFilterList: false,
            });
            return;
        }

        const valueNoCase = (val || '').toLowerCase();

        if (valueNoCase === this.state.searchText && valueNoCase.length > 0) {
            return;
        }

        this.getSearchResult(valueNoCase);
        this.setState({
            search: true,
            openFilterList: true,
            searchText: valueNoCase,
        });
    }

    openSearchList(event) {
        if (event && get(event.target, 'value.length') >= this.props.minLength) {
            this.filterSearchResults(event.target.value);

            if (!this.state.openFilterList) {
                this.setState({
                    filteredList: this.getFilteredOptionList(),
                    openFilterList: true,
                    search: true,
                });
            }
        }
    }

    closeSearchList() {
        if (this.state.openFilterList) {
            this.setState({
                filteredList: null,
                search: false,
                openFilterList: false,
                options: [],
                searchText: '',
            });
        }
    }

    getSearchResult(text, page = 1) {
        this.props.searchContacts(text, this.props.contactType, page)
            .then((contacts) => {
                const allContacts = page <= 1 ? contacts : [...this.state.options, ...contacts];

                this.setState({
                    options: allContacts,
                    filteredList: allContacts.filter(
                        (contact) => !this.props.value.find((contactId) => contactId === contact._id)
                    ),
                });
            });
    }

    render() {
        return (
            <div>
                <SearchField
                    minLength={1}
                    onSearchClick={this.openSearchList}
                    onSearch={this.filterSearchResults}
                    ref={(node) => this.dom.searchField = node}
                    onFocus={this.props.onFocus}
                    readOnly={this.props.readOnly}
                    placeholder={this.props.placeholder || gettext('Search for a contact')}
                    autoComplete={false}
                    name="searchFieldInput"
                />
                {this.state.openFilterList && (
                    <Popup
                        close={this.closeSearchList}
                        target={this.props.target}
                        onKeyDown={this.onKeyDown}
                        inheritWidth={true}
                        noPadding={true}
                        onPopupOpen={this.props.onPopupOpen}
                        onPopupClose={this.props.onPopupClose}
                        ignoreOnClickElement="searchFieldInput"
                    >
                        <div className="Select__popup__wrapper">
                            <ul
                                className="Select__popup__list"
                                ref={(node) => this.dom.listItems = node}
                                onScroll={this.handleScroll}
                            >
                                {get(this.state, 'filteredList.length', 0) > 0 &&
                                this.state.filteredList.map((opt, index) => (
                                    <li
                                        key={index}
                                        className={classNames(
                                            'Select__popup__item',
                                            {'Select__popup__item--active': index === this.state.activeOptionIndex}
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={this.onSelect.bind(this, this.state.filteredList[index])}
                                        >
                                            <ContactLabel contact={opt} />
                                        </button>
                                    </li>
                                ))
                                }

                                {this.props.onAdd && (
                                    <li tabIndex="0">
                                        <Button
                                            size="small"
                                            expanded={true}
                                            onClick={this.onAdd}
                                            text={this.props.onAddText}
                                            icon={this.props.onAddText ? null : 'icon-plus-large'}
                                            iconOnly={!this.props.onAddText}
                                        />
                                    </li>
                                )}
                            </ul>
                        </div>
                    </Popup>
                )}
            </div>
        );
    }
}

SelectListPopupComponent.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.arrayOf(PropTypes.string),
    target: PropTypes.string,
    onFocus: PropTypes.func,
    onAdd: PropTypes.func,
    onAddText: PropTypes.string,
    readOnly: PropTypes.bool,
    searchContacts: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    contactType: PropTypes.string,
    minLength: PropTypes.number,
    placeholder: PropTypes.string,
    page: PropTypes.number,
    loading: PropTypes.bool,
    total: PropTypes.number,
};

SelectListPopupComponent.defaultProps = {minLength: 1};

const mapStateToProps = (state) => ({
    loading: contactsLoading(state),
    total: contactsTotal(state),
    page: contactsPage(state),
});

const mapDispatchToProps = (dispatch) => ({
    searchContacts: (text, contactType, page) => dispatch(
        actions.contacts.getContacts(text, CONTACTS.SEARCH_FIELDS, contactType, page)
    ),
});

export const SelectListPopup = connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectListPopupComponent);
