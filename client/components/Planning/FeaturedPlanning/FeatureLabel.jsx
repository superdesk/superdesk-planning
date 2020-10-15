import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../../../utils';

export const FeatureLabel = ({item, tooltipFlowDirection}) => {
    if (get(item, 'featured') === true) {
        return (
            <span data-sd-tooltip={gettext('Featured')} data-flow={tooltipFlowDirection}>
                <i className="icon-star red" />
            </span>
        );
    }

    return null;
};

FeatureLabel.propTypes = {
    item: PropTypes.object,
    tooltipFlowDirection: PropTypes.string,
};

FeatureLabel.defaultProps = {tooltipFlowDirection: 'left'};
