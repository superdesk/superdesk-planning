import React from 'react';
import classNames from 'classnames';

import {gettext} from './utils';
import {KEYCODES} from './constants';

interface IProps {
    label: string;
    value?: string;
    activeFilter?: string;
    allowRemove?: boolean;
    border?: 'r' | 'l' | 'l-r' | 'bottom';
    focusOnMount?: boolean;
    search(value?: string): void;
}

interface IState {
    inputValue?: string;
    focused: boolean;
}

/**
 * @ngdoc react
 * @name SearchBox
 * @description Search box with input to search
 */
class SearchBox extends React.Component<IProps, IState> {
    inputElement: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);
        this.state = {
            inputValue: this.props.value ?? '',
            focused: false,
        };
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.onKeyPressHandler = this.onKeyPressHandler.bind(this);
        this.resetSearch = this.resetSearch.bind(this);

        this.inputElement = React.createRef();
    }

    componentDidMount() {
        if (this.props.focusOnMount) {
            this.focus();
        }
    }

    focus() {
        this.inputElement.current?.focus();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value &&
         this.props.activeFilter !== nextProps.activeFilter) {
            this.setState({inputValue: nextProps.value});
        }

        if (this.state.inputValue !== '' && this.props.value !== '' &&
            nextProps.value === '' && this.props.activeFilter === nextProps.activeFilter) {
            this.setState({inputValue: nextProps.value});
        }
    }

    onChangeHandler(evt) {
        this.setState({inputValue: evt.target.value});
    }

    onKeyPressHandler(evt) {
        if (evt.charCode === KEYCODES.ENTER) {
            this.props.search(this.state.inputValue);
        }
    }

    resetSearch() {
        this.setState({
            inputValue: '',
        });
        this.props.search();
    }
    render() {
        const searchClass = classNames(
            'sd-searchbar',
            {
                'sd-searchbar--focused': this.state.focused,
                'sd-searchbar--border-r': this.props.border === 'r',
                'sd-searchbar--border-l': this.props.border === 'l',
                'sd-searchbar--border-l-r': this.props.border === 'l-r',
                'sd-searchbar--border-bottom': this.props.border === 'bottom',
            }
        );

        return (
            <div className={searchClass}>
                <label htmlFor="search-input" className="sd-searchbar__icon" />
                <input
                    type="text"
                    id="search-input"
                    ref={this.inputElement}
                    autoComplete="off"
                    className="sd-searchbar__input"
                    placeholder={gettext(this.props.label)}
                    value={this.state.inputValue}
                    onChange={this.onChangeHandler}
                    onKeyPress={this.onKeyPressHandler}
                    onFocus={() => {
                        this.setState({focused: true});
                    }}
                    onBlur={() => {
                        this.setState({focused: false});
                    }}
                />
                {this.props.allowRemove && this.state.inputValue && (
                    <button
                        type="button"
                        className="search-close visible"
                        onClick={this.resetSearch}
                        aria-label={gettext('Clear Search')}
                    >
                        <i className="icon-remove-sign" />
                    </button>
                )}
                <button
                    className="sd-searchbar__search-btn"
                    onClick={() => this.props.search(this.state.inputValue)}
                    aria-label={gettext('Search')}
                >
                    <i className="big-icon--chevron-right" />
                </button>
            </div>
        );
    }
}

export default SearchBox;
