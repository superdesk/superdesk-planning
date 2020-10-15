import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../../utils';

import './style.scss';

export class ExpandableText extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expanded: false};
        this.dom = {parent: null};
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.setDomRef = this.setDomRef.bind(this);
    }

    toggleExpanded() {
        this.setState({expanded: !this.state.expanded});
        if (this.dom.parent && this.dom.parent.parentNode) {
            this.dom.parent.parentNode.scrollIntoView();
        }
    }

    setDomRef(ref) {
        this.dom.parent = ref;
    }

    render() {
        const {value, className, expandAt} = this.props;
        const {expanded} = this.state;

        if (!value) {
            return null;
        }

        let text = value.replace(/\r/g, '')
            .split('\n');

        if (get(text, 'length', 0) > expandAt) {
            if (!expanded) {
                text = text.slice(0, expandAt);
            }

            const linkText = expanded ?
                gettext('Show less') :
                gettext('Show all');

            text.push(
                <a className="sd-text__expandable-link" onClick={this.toggleExpanded}>
                    ... {linkText}
                </a>
            );
        }

        return (
            <p className={className} ref={this.setDomRef}>
                {text.map((item, key) => (
                    <span key={key}>{item}<br /></span>
                ))}
            </p>
        );
    }
}

ExpandableText.propTypes = {
    value: PropTypes.string,
    className: PropTypes.string,
    expandAt: PropTypes.number,
};

ExpandableText.defaultProps = {
    expandAt: 3,
};
