import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {gettext, onEventCapture} from '../utils';
import {KEYCODES} from '../constants';

import './style.scss';

/**
 * @ngdoc react
 * @name ToggleBox
 * @description ToggleBox used to open/close a set of details
 */
export class ToggleBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen};
        this.scrollInView = this.scrollInView.bind(this);
        this.toggle = this.toggle.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.dom = {node: null};
    }

    componentDidMount() {
        if (this.props.scrollInView && this.props.forceScroll) {
            this.scrollInView();
        }
    }

    handleKeyDown(event) {
        if (event.keyCode === KEYCODES.RIGHT && !this.state.isOpen) {
            onEventCapture(event);
            this.setState({isOpen: true});
        } else if (event.keyCode === KEYCODES.LEFT && this.state.isOpen) {
            onEventCapture(event);
            this.setState({isOpen: false});
        } else if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            this.toggle();
        }
    }

    toggle() {
        this.setState({isOpen: !this.state.isOpen});

        if (this.state.isOpen && this.props.onClose) {
            this.props.onClose();
        } else if (this.props.onOpen) {
            this.props.onOpen();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.isOpen !== nextProps.isOpen) {
            this.setState({isOpen: nextProps.isOpen});
        }
    }

    scrollInView() {
        if (this.state.isOpen && this.dom.node) {
            this.dom.node.scrollIntoView();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if ((prevState.isOpen !== this.state.isOpen && this.props.scrollInView) ||
            this.props.forceScroll && this.props.forceScroll !== prevProps.forceScroll
        ) {
            this.scrollInView();
        }
    }

    render() {
        const {
            style,
            title,
            children,
            hideUsingCSS,
            invalid,
            noMargin,
            paddingTop,
            badgeValue,
            testId,
        } = this.props;

        return (
            <div
                className={classNames(
                    'toggle-box toggle-box--circle',
                    style,
                    {
                        hidden: !this.state.isOpen,
                        'toggle-box--invalid': invalid,
                        'toggle-box--no-margin': noMargin,
                        'toggle-box--padding-top': paddingTop,
                    }
                )}
                ref={(node) => this.dom.node = node}
                data-test-id={testId}
            >
                <a
                    className="toggle-box__header"
                    onClick={this.toggle}
                    role="button"
                    tabIndex={0}
                    onKeyDown={this.handleKeyDown}
                >
                    <div className="toggle-box__chevron">
                        <i className="icon-chevron-right-thin" />
                    </div>
                    <div className="toggle-box__label">
                        {gettext(title)}
                        {badgeValue && <span className="badge badge--light badge--margined">{badgeValue}</span>}
                    </div>
                    <div
                        className={classNames(
                            'toggle-box__line', {'toggle-box__line--badged': badgeValue}
                        )}
                    />
                </a>
                <div className="toggle-box__content-wraper">
                    {this.state.isOpen && !hideUsingCSS && (
                        <div className="toggle-box__content">
                            {children}
                        </div>
                    )}

                    {hideUsingCSS && (
                        <div
                            className={classNames(
                                'toggle-box__content',
                                {'toggle-box__content--hidden': !this.state.isOpen}
                            )}
                        >
                            {children}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

ToggleBox.propTypes = {
    style: PropTypes.string,
    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    refNode: PropTypes.func,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    scrollInView: PropTypes.bool,
    hideUsingCSS: PropTypes.bool,
    invalid: PropTypes.bool,
    noMargin: PropTypes.bool,
    forceScroll: PropTypes.bool,
    paddingTop: PropTypes.bool,
    badgeValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    testId: PropTypes.string,
};

ToggleBox.defaultProps = {
    isOpen: true,
    scrollInView: false,
    hideUsingCSS: false,
    invalid: false,
    noMargin: false,
};
