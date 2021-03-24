import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

export const HtmlPreview = ({html, className}) => (
    <div
        className={className}
        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(html)}}
    />
);

HtmlPreview.propTypes = {
    html: PropTypes.string.isRequired,
    className: PropTypes.string,
};

// Make sure that links are opened in a new tab
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    node.setAttribute('target', '_blank');
});
