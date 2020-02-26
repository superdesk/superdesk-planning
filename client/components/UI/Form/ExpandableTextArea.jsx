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
        };
        this.dom = {input: null};
        this.delayedResize = null;

        this.setDomNode = this.setDomNode.bind(this);
        this.onChange = this.onChange.bind(this);
        this.toggleExpanded = this.toggleExpanded.bind(this);
    }

    setDomNode(node) {
        this.dom.input = node;

        if (this.props.refNode) {
            this.props.refNode(node);
        }
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

        if (this.dom.input.scrollHeight <= 100) {
            // Now set the height to the scrollHeight value to display the entire
            // text content
            this.dom.input.style['overflow-y'] = null;
            this.dom.input.style.height = `${this.dom.input.scrollHeight}px`;
            this.setState({
                expanded: false,
                showExpandedButton: false,
            });
        } else {
            const maxHeight = this.state.expanded ? 500 : 100;

            if (this.dom.input.scrollHeight >= maxHeight) {
                // Add scrollbar if required, and set height to the maximum height
                this.dom.input.style['overflow-y'] = 'auto';
                this.dom.input.style.height = `${maxHeight}px`;
            } else {
                // Now set the height to the scrollHeight value to display the entire
                // text content
                this.dom.input.style['overflow-y'] = null;
                this.dom.input.style.height = `${this.dom.input.scrollHeight}px`;
            }

            if (!this.state.expanded) {
                const scrollbarRequired = (this.dom.input.clientHeight + 5) < this.dom.input.scrollHeight;

                this.setState({showExpandedButton: scrollbarRequired});
            }
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
                        className
                    )}
                    value={value}
                    name={field}
                    disabled={readOnly}
                    placeholder={readOnly ? '' : placeholder}
                    {...props}
                    onChange={readOnly ? null : this.onChange}
                />

                {this.state.showExpandedButton && (
                    <button className="sd-line-input__expand_btn" onClick={this.toggleExpanded}>
                        {this.state.expanded ? (
                            <i className="icon-chevron-up-thin"/>
                        ) : (
                            <i className="icon-chevron-down-thin"/>
                        )}
                    </button>
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
