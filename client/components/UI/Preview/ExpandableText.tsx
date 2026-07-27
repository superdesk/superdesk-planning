import React from 'react';
import PropTypes from 'prop-types';

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

    truncate(lines) {
        const {expandAt, expandAtChars} = this.props;
        const truncated = [];
        let charsUsed = 0;

        for (const line of lines) {
            if (truncated.length >= expandAt || charsUsed >= expandAtChars) {
                break;
            }

            const charsRemaining = expandAtChars - charsUsed;

            truncated.push(line.length > charsRemaining ? line.slice(0, charsRemaining) : line);
            charsUsed += Math.min(line.length, charsRemaining);
        }

        return truncated;
    }

    render() {
        const {value, className, expandAt, expandAtChars} = this.props;
        const {expanded} = this.state;

        if (!value) {
            return null;
        }

        const lines = value.replace(/\r/g, '')
            .split('\n');

        // Count visible characters like truncate() does, so the link never appears when nothing is hidden
        const contentLength = lines.reduce((total, line) => total + line.length, 0);
        const needsTruncation = lines.length > expandAt || contentLength > expandAtChars;
        let text = lines;

        if (needsTruncation) {
            const linkText = expanded ?
                gettext('Show less') :
                gettext('Show all');

            text = [
                ...(expanded ? lines : this.truncate(lines)),
                <a
                    key="expandable-link"
                    className="sd-text__expandable-link"
                    onClick={this.toggleExpanded}
                >
                    ... {linkText}
                </a>,
            ];
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
    expandAtChars: PropTypes.number,
};

ExpandableText.defaultProps = {
    expandAt: 3,
    expandAtChars: 500,
};
