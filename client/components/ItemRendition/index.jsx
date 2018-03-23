import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import * as actions from '../../actions';

export const ItemRenditionComponent = ({previewImage, item, rendition}) => (
    <figure className="media preview-overlay-on" onClick={previewImage.bind(null, item)}>
        <img src={get(item, `renditions.${rendition}.href`)} />
        <div className="preview-overlay">
            <i className="icon-fullscreen" />
        </div>
    </figure>
);

ItemRenditionComponent.propTypes = {
    previewImage: PropTypes.func,
    item: PropTypes.object,
    rendition: PropTypes.string,
};

ItemRenditionComponent.defaultProps = {rendition: 'viewImage'};

const mapDispatchToProps = (dispatch) => (
    {previewImage: (item) => dispatch(actions.assignments.ui.onArchivePreviewImageClick(item))}
);

export const ItemRendition = connect(
    null,
    mapDispatchToProps
)(ItemRenditionComponent);
