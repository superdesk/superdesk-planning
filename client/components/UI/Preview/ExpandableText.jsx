import React, {useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../../utils';

import './style.scss';

export function ExpandableText({value, className, expandAt}) {
    const valueRef = useRef();
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => {
        setExpanded(!expanded);
        if (valueRef.current && valueRef.current.parentNode) {
            valueRef.current.parentNode.scrollIntoView();
        }
    };

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
            <a className="sd-text__expandable-link" onClick={toggleExpanded}>
                ... {linkText}
            </a>
        );
    }

    return (
        <p className={className} ref={valueRef}>
            {text.map((item, key) => (
                <span key={key}>{item}<br/></span>
            ))}
        </p>
    );
}

ExpandableText.propTypes = {
    value: PropTypes.string,
    className: PropTypes.string,
    expandAt: PropTypes.number,
};

ExpandableText.defaultProps = {
    expandAt: 3,
};
