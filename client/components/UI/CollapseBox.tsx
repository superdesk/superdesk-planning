import React from 'react';
import classNames from 'classnames';

import {KEYCODES} from './constants';
import {onEventCapture, gettext} from './utils';

import {IconButton} from './';

interface IProps {
    isOpen?: boolean;
    noOpen?: boolean;
    scrollInView?: boolean;
    scrollIntoViewOptions?: ScrollIntoViewOptions;
    invalid?: boolean;
    tabEnabled?: boolean;
    forceScroll?: boolean;
    inner?: boolean;
    entityId?: string;
    testId?: string;

    collapsedItem: React.ReactNode;
    openItem: React.ReactNode;
    openItemTopBar: React.ReactNode;
    tools: React.ReactNode;

    onOpen?(): void;
    onClose?(): void;
    onClick?(): void;
}

interface IState {
    isOpen: boolean;
}

/**
 * @ngdoc react
 * @name CollapseBox
 * @description CollapseBox which has a closed and open view of an item
 */
export class CollapseBox extends React.Component<IProps, IState> {
    containerNode: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen};
        this.scrollInView = this.scrollInView.bind(this);
        this.handleOpenClick = this.handleOpenClick.bind(this);
        this.openBox = this.openBox.bind(this);
        this.closeBox = this.closeBox.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.containerNode = React.createRef();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.onOpen != null) {
            if (nextProps.isOpen) {
                this.openBox(nextProps);
            } else {
                this.closeBox(nextProps);
            }
        }
    }

    handleKeyDown(event) {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            // If we closed it by keydown, keep focus to show the tab route
            if (this.state.isOpen) {
                this.closeBox();
                this.containerNode.current?.focus();
            } else {
                this.openBox();
            }
        }
    }

    openBox(contextProps = this.props) {
        if (contextProps.noOpen || this.state.isOpen) {
            return;
        }

        this.setState({isOpen: true});
        if (contextProps.onOpen) {
            contextProps.onOpen();
        }
    }

    closeBox(contextProps = this.props) {
        if (this.state.isOpen) {
            this.setState({isOpen: false});
            if (contextProps.onClose) {
                contextProps.onClose();
            }
        }
    }

    handleOpenClick() {
        if (this.props.onClick) {
            this.props.onClick();
        }

        this.openBox();
    }

    scrollInView(autoOpen?: boolean) {
        const {scrollInView, noOpen, scrollIntoViewOptions} = this.props;

        if (autoOpen && !this.state.isOpen) {
            this.openBox(this.props);
        }

        if (scrollInView &&
            (this.state.isOpen || noOpen) &&
            this.containerNode.current != null
        ) {
            if (scrollIntoViewOptions) {
                this.containerNode.current.scrollIntoView(scrollIntoViewOptions);
            } else {
                this.containerNode.current.scrollIntoView();
            }
            // When just opened, lose focus to remove greyed background due to
            // initial collapsed view
            this.containerNode.current.blur();
        }
    }

    componentDidMount() {
        // Upon first rendering, if the box is open then scroll it into view
        this.scrollInView();
        if (this.state.isOpen && this.props.onOpen) {
            this.props.onOpen();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.entityId === this.props.entityId && // Rendering the same entity
            ((prevState.isOpen !== this.state.isOpen && this.state.isOpen) || // was opened
            (this.props.forceScroll && this.props.forceScroll !== prevProps.forceScroll))
        ) {
            this.scrollInView();
        }
    }

    render() {
        return (
            <div
                role="button"
                data-test-id={this.props.testId}
                tabIndex={this.props.tabEnabled ? 0 : null}
                onKeyDown={!this.state.isOpen && this.props.tabEnabled ? this.handleKeyDown : null}
                className={classNames(
                    'sd-collapse-box',
                    'sd-shadow--z2',
                    {
                        'sd-collapse-box--open': this.state.isOpen && !this.props.inner,
                        'sd-collapse-box--inner-open': this.state.isOpen && this.props.inner,
                        'sd-collapse-box--invalid': this.props.invalid,
                    }
                )}
                ref={this.containerNode}
                onClick={this.handleOpenClick}
            >
                {this.state.isOpen && (
                    <div className="sd-collapse-box__content-wraper">
                        <div
                            className={classNames(
                                'sd-collapse-box__content',
                                {'no-border': !this.props.invalid}
                            )}
                        >
                            <div className="sd-collapse-box__tools sd-collapse-box__tools--rightFlex">
                                <IconButton
                                    icon="icon-chevron-up-thin"
                                    aria-label={gettext('Collapse')}
                                    tabIndex={this.props.tabEnabled ? 0 : null}
                                    onClick={this.closeBox.bind(null, this.props)}
                                    onKeyDown={this.props.tabEnabled ? this.handleKeyDown : null}
                                />
                                {this.props.tools}
                            </div>
                            {this.props.openItemTopBar && (
                                <div className="sd-collapse-box__content-block sd-collapse-box__content-block--top">
                                    {this.props.openItemTopBar}
                                </div>
                            )}
                            {this.props.openItem}
                        </div>
                    </div>
                )}
                {!this.state.isOpen && (
                    <div
                        className={classNames(
                            'sd-collapse-box__header',
                            {
                                'sd-collapse-box__inner-header': this.props.inner,
                                'no-border': !this.props.invalid,
                            }
                        )}
                    >
                        {this.props.collapsedItem}
                    </div>
                )}
            </div>
        );
    }
}
