import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';


export class ExpandableRow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
            showExpandedButton: false,
            maxHeight: 100,
        };
        this.dom = {value: null};

        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.setDomNode = this.setDomNode.bind(this);
    }

    setDomNode(node) {
        this.dom.value = node;
    }

    toggleExpanded() {
        const expanded = !this.state.expanded;

        this.setState({
            expanded: expanded,
            maxHeight: expanded ? 500 : 100,
        }, () => {
            if (this.dom.value && this.dom.value.parentNode) {
                this.dom.value.parentNode.scrollIntoView();
            }
        });
    }

    renderValue() {
        const {value, className} = this.props;

        if (!value) {
            return null;
        }

        const showExpandedButton = get(this.props, 'value.length', 0) > 5;
        const style = !showExpandedButton ? {} : {
            maxHeight: `${this.state.maxHeight}px`,
            overflowY: 'auto',
            borderBottom: '1px solid rgba(0, 0, 0, 0.15)',
        };
        const pClass = className ? `sd-text__${className}` : '';

        return (
            <Fragment>
                <p className={pClass} style={style} ref={this.setDomNode}>
                    {value}
                </p>

                {showExpandedButton && (
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

    render() {
        if (!this.props.enabled) {
            return null;
        }

        const {label, value, className, children, noPadding, flex, rowItem} = this.props;

        return (
            <div
                className={classNames(
                    {
                        form__row: !rowItem,
                        'form__row-item': rowItem,
                        'no-padding': noPadding,
                        'form__row--flex': flex,
                        [className]: className && !value,
                    }
                )}
            >
                {label && <label className="form-label form-label--light">{label}</label>}
                {this.renderValue()}
                {children}
            </div>
        );
    }
}

ExpandableRow.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.node,
    ]),
    className: PropTypes.string,
    children: PropTypes.node,
    noPadding: PropTypes.bool,
    enabled: PropTypes.bool,
    flex: PropTypes.bool,
    rowItem: PropTypes.bool,
};

ExpandableRow.defaultProps = {
    noPadding: false,
    enabled: true,
    flex: false,
    rowItem: false,
};
