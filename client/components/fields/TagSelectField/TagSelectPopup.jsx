import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {uiUtils} from '../../../utils';

export class TagSelectPopup extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.state = {activeOptionIndex: -1};
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch (event.keyCode) {
            case 27:
                // ESC key
                event.preventDefault();
                event.stopPropagation();
                this.props.onCancel();
                break;
            case 13:
                // ENTER key
                event.preventDefault();
                event.stopPropagation();
                this.handleEnterKey(event);
                break;
            case 40:
                // arrowDown key
                event.preventDefault();
                event.stopPropagation();
                this.handleDownArrowKey(event);
                break;
            case 38:
                // arrowUp key
                event.preventDefault();
                event.stopPropagation();
                this.handleUpArrowKey(event);
                break;
            }
        }
    }

    handleEnterKey(event) {
        if (this.state.activeOptionIndex > -1) {
            const selectedVal = this.props.options[this.state.activeOptionIndex];

            this.props.onChange(selectedVal);
        } else {
            this.props.onChange(event.target.value);
        }
    }

    handleDownArrowKey() {
        if (this.state.activeOptionIndex < this.props.options.length - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.refs.itemList);
        }
    }

    handleUpArrowKey() {
        if (this.state.activeOptionIndex > -1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.refs.itemList);
        }
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this);

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel();
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
        document.addEventListener('keydown', this.handleKeyBoardEvent);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
        document.removeEventListener('keydown', this.handleKeyBoardEvent);
    }

    render() {
        return (
            <div>
                {this.props.options.length > 0 && <div className="Select__popup">
                    <ul className="Select__popup__list" ref="itemList">
                        {this.props.options.map((o, index) => (<li key={index} className={ (index === this.state.activeOptionIndex ?
                            'Select__popup__item--active ' : '') + 'Select__popup__item'}>
                            <button onClick={this.props.onChange.bind(null, o)}>
                                <span>&nbsp;&nbsp;{o.name}</span>
                            </button>
                        </li>))}
                    </ul>
                </div>}
            </div>);
    }
}

TagSelectPopup.propTypes = {
    options: PropTypes.array,
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
};

TagSelectPopup.defaultProps = {options: []};
