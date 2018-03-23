import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';

export class CollapseBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen};
        this.scrollInView = this.scrollInView.bind(this);
        this.toggleOpenState = this.toggleOpenState.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.dom = {node: null};
    }

    handleKeyDown(event) {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            this.toggleOpenState();

            // If we closed it by keydown, keep focus to show the tab route
            if (this.state.isOpen) {
                this.dom.node.focus();
            }
        }
    }

    toggleOpenState() {
        this.setState({isOpen: !this.state.isOpen});
    }

    scrollInView() {
        if (this.props.scrollInView && this.state.isOpen && this.dom.node) {
            this.dom.node.scrollIntoView();
        }
    }

    componentDidMount() {
        // Upon first rendering, if the box is open then scroll it into view
        this.scrollInView();
    }

    componentDidUpdate(prevProps, prevState) {
        // Scroll into view only upon first opening
        if (prevState.isOpen !== this.state.isOpen) {
            this.scrollInView();
        }
    }

    render() {
        return (
            <div
                role="button"
                tabIndex={this.props.tabEnabled ? 0 : null}
                onKeyDown={!this.state.isOpen && this.props.tabEnabled ? this.handleKeyDown : null}
                className={classNames(
                    'sd-collapse-box',
                    'sd-shadow--z2',
                    {
                        'sd-collapse-box--open': this.state.isOpen,
                        'sd-collapse-box--invalid': this.props.invalid
                    }
                )}
                ref={(node) => this.dom.node = node}
                onClick={this.state.isOpen ? null : this.toggleOpenState}
            >
                {this.state.isOpen && (
                    <div className="sd-collapse-box__content-wraper">
                        <div className="sd-collapse-box__content">
                            <div className="sd-collapse-box__tools">
                                {this.props.tools}
                                <a tabIndex={this.props.tabEnabled ? 0 : null}
                                    className="icn-btn"
                                    onClick={this.toggleOpenState}
                                    onKeyDown={this.props.tabEnabled ? this.handleKeyDown : null} >
                                    <i className="icon-chevron-up-thin" />
                                </a>
                            </div>
                            {this.props.openItemTopBar &&
                            <div className="sd-collapse-box__content-block sd-collapse-box__content-block--top">
                                {this.props.openItemTopBar}
                            </div>}
                            {this.props.openItem}
                        </div>
                    </div>
                ) || (
                    <div className="sd-collapse-box__header">
                        {this.props.collapsedItem}
                    </div>
                )}
            </div>
        );
    }
}

CollapseBox.propTypes = {
    collapsedItem: PropTypes.node.isRequired,
    openItem: PropTypes.node.isRequired,
    openItemTopBar: PropTypes.node,
    tools: PropTypes.node,
    isOpen: PropTypes.bool,
    scrollInView: PropTypes.bool,
    invalid: PropTypes.bool,
    tabEnabled: PropTypes.bool,
};

CollapseBox.defaultProps = {
    isOpen: false,
    scrollInView: false,
    invalid: false,
};
