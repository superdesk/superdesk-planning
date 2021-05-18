import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {gettext, onEventCapture} from '../utils';
import {KEYCODES} from '../constants';

import './style.scss';

interface IProps {
    style?: string;
    isOpen?: boolean; // defaults to true
    onOpen?(): void;
    onClose?(): void;
    refNode?(node: HTMLElement): void;
    title: string;
    scrollInView?: boolean;
    hideUsingCSS?: boolean;
    invalid?: boolean;
    noMargin?: boolean;
    forceScroll?: boolean;
    paddingTop?: boolean;
    badgeValue?: string | number;
    testId?: string;
}

interface IState {
    isOpen: boolean;
}

/**
 * @ngdoc react
 * @name ToggleBox
 * @description ToggleBox used to open/close a set of details
 */
export class ToggleBox extends React.Component<IProps, IState> {
    dom: {node: React.RefObject<HTMLDivElement>};

    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen ?? true};
        this.scrollInView = this.scrollInView.bind(this);
        this.toggle = this.toggle.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.dom = {node: React.createRef<HTMLDivElement>()};
    }

    componentDidMount() {
        if (this.props.scrollInView && this.props.forceScroll) {
            this.scrollInView();
        }
    }

    getBoundingClientRect() {
        return this.dom.node.current != null ?
            this.dom.node.current.getBoundingClientRect() :
            null;
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
        this.setState({isOpen: !this.state.isOpen}, () => {
            if (!this.state.isOpen && this.props.onClose) {
                this.props.onClose();
            } else if (this.props.onOpen) {
                this.props.onOpen();
            }
        });
    }

    focus() {
        if (!this.state.isOpen) {
            this.toggle();
        } else if (this.props.onOpen) {
            this.props.onOpen();
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((this.props.isOpen ?? true) !== (nextProps.isOpen ?? true)) {
            this.setState({isOpen: nextProps.isOpen});
        }
    }

    scrollInView() {
        if (this.state.isOpen && this.dom.node.current != null) {
            this.dom.node.current.scrollIntoView({behavior: 'smooth'});
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
                ref={this.dom.node}
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
