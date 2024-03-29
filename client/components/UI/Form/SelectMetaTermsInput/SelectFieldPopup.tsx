import React from 'react';
import {SearchBar} from '../../';
import {differenceBy, get} from 'lodash';
import {scrollListItemIfNeeded, onEventCapture, gettext} from '../../utils';
import classNames from 'classnames';
import './style.scss';

import {Popup} from '../../Popup';
import {KEYCODES} from '../../constants';
import {getVocabularyItemFieldTranslated} from '../../../../utils/vocabularies';

interface IProps {
    options: Array<any>;
    onCancel(): void;
    onChange(option: any);
    labelKey?: string; // defaults to 'name'
    valueKey?: string; // defaults to 'qcode'
    searchKey?: string; // defaults to 'name'
    multiLevel?: boolean;
    value: any;
    target: string;
    groupField?: string;
    popupContainer(): HTMLElement;
    onPopupOpen(): void;
    onPopupClose(): void;
    language?: string;
}

interface IState {
    currentParent?: any;
    selectedAncestry: Array<any>;
    search: boolean;
    activeOptionIndex: number;
    filteredList: Array<any>;
}

/**
 * @ngdoc react
 * @name SelectFieldPopup
 * @description Popup component for SelectMetaTermsInput
 */
export class SelectFieldPopup extends React.Component<IProps, IState> {
    dom: {
        root: any;
        list: any;
        search: any;
    };

    constructor(props) {
        super(props);

        this.state = {
            currentParent: null,
            selectedAncestry: [],
            search: false,
            activeOptionIndex: -1,
            filteredList: [],
        };

        this.onKeyDown = this.onKeyDown.bind(this);
        this.filterSearchResults = this.filterSearchResults.bind(this);
        this.popParent = this.popParent.bind(this);
        this.chooseEntireCategory = this.chooseEntireCategory.bind(this);

        this.dom = {
            root: null,
            list: null,
            search: null,
        };
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#onKeyDown
     * @description onKeyDown method to handle keyboard selection of options
     */
    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey();
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey();
                break;
            case KEYCODES.LEFT:
                onEventCapture(event);
                if (this.state.selectedAncestry.length > 0) {
                    this.popParent(true);
                }
                break;
            case KEYCODES.RIGHT:
                onEventCapture(event);
                if (this.state.activeOptionIndex !== -1) {
                    this.onMutiLevelSelect(
                        this.state.filteredList[this.state.activeOptionIndex],
                        true
                    );
                }
                break;
            }
        }
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#handleEnterKey
     * @description handleEnterKey method to handle enter-key press on a selected option
     */
    handleEnterKey() {
        if (this.props.multiLevel) {
            if (this.state.activeOptionIndex !== -1) {
                this.onSelect(this.state.filteredList[this.state.activeOptionIndex]);
            } else if (this.state.filteredList.length === 1) {
                this.onSelect(this.state.filteredList[0]);
            }
        } else if (this.state.activeOptionIndex !== -1) {
            this.onSelect(this.state.filteredList[this.state.activeOptionIndex]);
        } else if (this.state.filteredList.length === 1) {
            this.onSelect(this.state.filteredList[0]);
        }
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#handleDownArrowKey
     * @description handleDownArrowKey method to handle down-key press to select options
     */
    handleDownArrowKey(event) {
        if (event.target.id && event.target.id.indexOf('SearchBar') >= 0) {
            // Lose focus on SearchBar
            event.target.blur();

            this.setState({activeOptionIndex: 0});
        } else if (this.state.activeOptionIndex < this.state.filteredList.length - 1) {
            this.setState(
                (state) => ({activeOptionIndex: state.activeOptionIndex + 1})
            );
            scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.list);
        }
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#handleUpArrowKey
     * @description handleUpArrowKey method to handle up-key press to select options
     */
    handleUpArrowKey() {
        if (this.state.activeOptionIndex === 0) {
            if (this.state.selectedAncestry.length === 0) {
                // Search bar handle
                // Focus the searchBar input
                this.dom.search.dom.searchIcon.focus();
                this.setState({activeOptionIndex: -1});
            } else {
                // Choose entire category
                this.setState({activeOptionIndex: -1});
            }
        } else {
            this.setState(
                (state) => ({activeOptionIndex: state.activeOptionIndex - 1})
            );
            scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.list);
        }
    }

    componentWillMount() {
        this.setState({filteredList: this.getFilteredOptionList()});
    }

    componentDidMount() {
        this.dom.search.dom.searchIcon.focus();
    }

    onSelect(opt) {
        this.props.onChange(opt);
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#getFilteredOptionList
     * @description getFilteredOptionList method to filter options list based on search text input
     */
    getFilteredOptionList(currentParent?: any, searchList?: Array<any>) {
        if (this.props.multiLevel) {
            const valueKey = this.props.valueKey ?? 'qcode';
            let filteredList;

            if (searchList) {
                filteredList = searchList;
            } else {
                filteredList = currentParent ?
                    this.props.options.filter((option) => (
                        option.parent === get(currentParent, valueKey)
                    ), this) :
                    this.props.options.filter((option) => !option.parent);
            }
            return filteredList;
        } else {
            return searchList ? searchList : this.props.options;
        }
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#onMutiLevelSelect
     * @description onMutiLevelSelect method handle selection of a parent option
     */
    onMutiLevelSelect(opt, keyDown = false) {
        if (opt && this.isOptionAParent(opt)) {
            const valueKey = this.props.valueKey ?? 'qcode';

            if (!this.state.selectedAncestry.find((o) => (opt[valueKey] === o[valueKey]))) {
                this.setState((state) => ({
                    currentParent: opt,
                    selectedAncestry: [...state.selectedAncestry, opt],
                    filteredList: this.getFilteredOptionList(opt, null),
                    activeOptionIndex: 0,
                }));
            }
        } else if (!keyDown) {
            this.onSelect(opt);
        }
    }

    isOptionAParent(opt) {
        return this.props.options.filter((option) => (
            option.parent === get(opt, this.props.valueKey ?? 'qcode')
        )).length > 0;
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#chooseEntireCategory
     * @description chooseEntireCategory method choose selection of an entire parent option
     */
    chooseEntireCategory() {
        this.onSelect(this.state.currentParent);
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#popParent
     * @description popParent method traverse up a parent level of options
     */
    popParent(keydown) {
        onEventCapture(keydown);

        this.setState((state) => {
            const len = state.selectedAncestry.length;
            const opt = len > 1 ? state.selectedAncestry[len - 2] : null;
            const activeOption = keydown === true ? 0 : -1;

            return {
                currentParent: opt,
                selectedAncestry: state.selectedAncestry.splice(0, len - 1),
                filteredList: this.getFilteredOptionList(opt, null),
                activeOptionIndex: activeOption,
            };
        });

        return true;
    }


    filterSearchResults(val) {
        if (!val) {
            this.setState({
                search: false,
                filteredList: this.getFilteredOptionList(null),
            });
            return;
        }

        const valueNoCase = val.toLowerCase();
        const searchKey = this.props.searchKey ?? 'name';

        let searchResults = this.props.options.filter((opt) => {
            const label = opt.translations?.name?.[this.props.language] ?? opt[searchKey];

            return label.toLowerCase().substr(0, val.length) === valueNoCase ||
                label.toLowerCase().indexOf(valueNoCase) >= 0;
        });

        if (this.props.multiLevel && this.props.value) {
            searchResults = differenceBy(searchResults, this.props.value, this.props.valueKey ?? 'qcode');
        }

        this.setState({
            search: true,
            filteredList: this.getFilteredOptionList(null, searchResults),
        });
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#renderSingleLevelSelect
     * @description renderSingleLevelSelect method to render a single level options list
     * @returns {JSX}
     */
    renderSingleLevelSelect() {
        let noGroupList = this.props.groupField ? [] : [...this.state.filteredList];
        let groupsList = {};

        if (this.props.groupField) {
            this.state.filteredList.forEach((o) => {
                if (o[this.props.groupField]) {
                    groupsList[o[this.props.groupField]] = [...get(groupsList, o[this.props.groupField], []), o];
                } else {
                    noGroupList.push(o);
                }
            });
        }

        const renderList = (list, noGroup = false) => (
            list.map((opt, index) => (
                <li
                    key={index}
                    className={classNames(
                        'Select__popup__item',
                        {'Select__popup__item--active': index === this.state.activeOptionIndex},
                        {'Select__popup__item--no-group': noGroup}
                    )}
                >
                    <button
                        type="button"
                        onClick={this.onSelect.bind(
                            this,
                            list[index]
                        )}
                    >
                        <span>
                            {getVocabularyItemFieldTranslated(
                                opt,
                                this.props.labelKey ?? 'name',
                                this.props.language
                            )}
                        </span>
                    </button>
                </li>
            ))
        );

        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.onKeyDown}
                popupContainer={this.props.popupContainer}
                onPopupOpen={this.props.onPopupOpen}
                onPopupClose={this.props.onPopupClose}
            >
                <div className="Select__popup" ref={(node) => this.dom.root = node}>
                    <div className="Select__popup__search">
                        <SearchBar
                            onSearch={this.filterSearchResults}
                            minLength={1}
                            extendOnOpen={true}
                            ref={(node) => this.dom.search = node}
                            timeout={100}
                            allowCollapsed={false}
                        />
                    </div>
                    <ul className="Select__popup__list" ref={(node) => this.dom.list = node}>
                        {Object.keys(groupsList).map((g) => (
                            <li key={g}>
                                <div className="Select__popup__group">{g}</div>
                                {renderList(groupsList[g], !!g)}
                            </li>
                        ))
                        }
                        {this.state.filteredList.length === 0 &&
                            <li>{gettext('No items found')}</li>
                        }
                        {renderList(noGroupList, true)}
                    </ul>
                </div>
            </Popup>
        );
    }

    /**
     * @ngdoc method
     * @name SelectFieldPopup#renderMultiLevelSelect
     * @description renderMultiLevelSelect method to render a multi level options list
     * @returns {JSX}
     */
    renderMultiLevelSelect() {
        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.onKeyDown}
                popupContainer={this.props.popupContainer}
                onPopupOpen={this.props.onPopupOpen}
                onPopupClose={this.props.onPopupClose}
            >
                <div className="Select__popup" ref={(node) => this.dom.root = node}>
                    <div className="Select__popup__search">
                        { this.state.currentParent && (
                            <div className="search-handler">
                                <i className="backlink" onClick={this.popParent} />
                                <button
                                    type="button"
                                    className={classNames(
                                        'Select__popup__category',
                                        {'Select__popup__item--active': this.state.activeOptionIndex === -1}
                                    )}
                                    onClick={this.chooseEntireCategory}
                                >
                                    <div className="Select__popup__parent">
                                        {getVocabularyItemFieldTranslated(
                                            this.state.currentParent,
                                            this.props.labelKey ?? 'name',
                                            this.props.language
                                        )}
                                    </div>
                                    <div className="Select__popup__parent--choose">
                                        Choose entire category
                                    </div>
                                </button>
                            </div>
                        ) || (
                            <SearchBar
                                onSearch={this.filterSearchResults}
                                minLength={1}
                                extendOnOpen={true}
                                ref={(node) => this.dom.search = node}
                                timeout={100}
                                allowCollapsed={false}
                            />
                        )}
                    </div>
                    <ul className="dropdown-menu Select__popup__list" ref={(node) => this.dom.list = node}>
                        {this.state.filteredList.map((opt, index) => (
                            <li
                                key={index}
                                className={classNames(
                                    'Select__popup__item',
                                    {'Select__popup__item--active': index === this.state.activeOptionIndex}
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={this.onMutiLevelSelect.bind(
                                        this,
                                        this.state.filteredList[index],
                                        false
                                    )}
                                >
                                    <span>
                                        {getVocabularyItemFieldTranslated(
                                            opt,
                                            this.props.labelKey ?? 'name',
                                            this.props.language
                                        )}
                                    </span>
                                    {!this.state.search && this.isOptionAParent(opt) && (
                                        <i className="icon-chevron-right-thin" />
                                    )}
                                </button>
                            </li>
                        ))}
                        {this.state.filteredList.length === 0 &&
                            <li>{gettext('No items found')}</li>
                        }
                    </ul>
                </div>
            </Popup>
        );
    }

    render() {
        return this.props.multiLevel ? this.renderMultiLevelSelect() : this.renderSingleLevelSelect();
    }
}
