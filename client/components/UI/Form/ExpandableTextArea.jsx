import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get, debounce} from 'lodash';

import './style.scss';

export class ExpandableTextArea extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
            showExpandedButton: false,
            hover: false,
            focus: false,
        };
        this.dom = {input: null};
        this.delayedResize = null;

        this.setDomNode = this.setDomNode.bind(this);
        this.onChange = this.onChange.bind(this);
        this.toggleExpanded = this.toggleExpanded.bind(this);

        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
    }

    setDomNode(node) {
        this.dom.input = node;

        if (this.props.refNode) {
            this.props.refNode(node);
        }
    }

    onMouseEnter() {
        this.setState({hover: true});
    }

    onMouseLeave() {
        this.setState({hover: false});
    }

    onFocus() {
        this.setState({focus: true});
    }

    onBlur() {
        this.setState({focus: false});
    }

    componentDidMount() {
        const {initialFocus, autoHeightTimeout} = this.props;

        this.delayedResize = debounce(this.autoResize, autoHeightTimeout);

        this.autoResize();

        if (initialFocus) {
            this.dom.input.focus();
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (get(nextProps, 'value.length', 0) !== get(this.props, 'value.length')) {
            this.delayedResize(nextProps.value);
        }
    }

    autoResize(value = null) {
        if (!this.dom.input) {
            return;
        }

        if (value !== null) {
            this.dom.input.value = value;
        }

        // This is required so that when the height is reduced, the scrollHeight
        // is recalculated based on the new height, otherwise it will not
        // shrink the height back down
        this.dom.input.style.height = '5px';

        if (this.state.expanded) {
            // Now set the height to the scrollHeight value to display the entire
            // text content
            this.dom.input.style['overflow-y'] = null;
            this.dom.input.style.height = `${this.dom.input.scrollHeight}px`;

            if (this.dom.input.scrollHeight <= 100) {
                this.setState({
                    expanded: false,
                    showExpandedButton: false,
                });
            }
        } else if (this.dom.input.scrollHeight <= 100) {
            // Now set the height to the scrollHeight value to display the entire
            // text content
            this.dom.input.style['overflow-y'] = null;
            this.dom.input.style.height = `${this.dom.input.scrollHeight}px`;

            if (this.state.showExpandedButton) {
                this.setState({showExpandedButton: false});
            }
        } else {
            // Add scrollbar if required, and set height to the maximum height
            this.dom.input.style['overflow-y'] = 'auto';
            this.dom.input.style.height = '100px';

            const scrollbarRequired = (this.dom.input.clientHeight + 5) < this.dom.input.scrollHeight;

            this.setState({showExpandedButton: scrollbarRequired});
        }
    }

    onChange(event) {
        const {onChange, field, nativeOnChange} = this.props;

        if (nativeOnChange) {
            onChange(event);
        } else {
            onChange(field, event.target.value);
        }
    }

    toggleExpanded() {
        const expand = !this.state.expanded;

        this.setState(
            {expanded: expand},
            () => {
                this.autoResize();
                if (expand && this.dom.input && this.dom.input.parentNode) {
                    this.dom.input.parentNode.scrollIntoView();
                }
            }
        );
    }

    render() {
        const {
            field,
            value,
            placeholder,
            readOnly,
            className,

            // Remove these variables from the props variable
            // So they are not passed down to the textarea dom node
            // eslint-disable-next-line no-unused-vars
            onChange, nativeOnChange, initialFocus, refNode, autoHeightTimeout,

            ...props
        } = this.props;

        return (
            <Fragment>
                <textarea
                    ref={this.setDomNode}
                    className={classNames(
                        'sd-line-input__input',
                        'sd-line-input__input--auto-height',
                        {'sd-line-input__input--expandable': this.state.showExpandedButton},
                        className
                    )}
                    value={value}
                    name={field}
                    disabled={readOnly}
                    placeholder={readOnly ? '' : placeholder}
                    {...props}
                    onChange={readOnly ? null : this.onChange}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                />

                {this.state.showExpandedButton && (
                    <div
                        className={classNames(
                            'sd-line-input__expand_btn',
                            {
                                'sd-line-input__expand_btn--hover': this.state.hover,
                                'sd-line-input__expand_btn--focus': this.state.focus,
                            }
                        )}
                    >
                        <button onClick={this.toggleExpanded}>
                            {this.state.expanded ? (
                                <i className="icon-chevron-up-thin" />
                            ) : (
                                <i className="icon-chevron-down-thin" />
                            )}
                        </button>
                    </div>
                )}
            </Fragment>
        );
    }
}

ExpandableTextArea.propTypes = {
    field: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    nativeOnChange: PropTypes.bool,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    className: PropTypes.string,
    initialFocus: PropTypes.bool,
    refNode: PropTypes.func,
    autoHeightTimeout: PropTypes.number,
};

ExpandableTextArea.defaultProps = {
    nativeOnChange: false,
    readOnly: false,
    initialFocus: false,
    autoHeightTimeout: 50,
};
