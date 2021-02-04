import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';


export const FeaturedPlanningListGroup = ({leftBorder, children}) => (
    <div
        className={classNames(
            'sd-page-content__content-block',
            'grid__item',
            'grid__item--col-6',
            'sd-column-box__main-column',
            'sd-column-box__main-column__listpanel',
            'FeatureListGroup',
            {'FeatureListGroup--left-border': leftBorder}
        )}
    >
        <div>
            <div
                className={classNames(
                    'sd-column-box__main-column__items',
                    'sd-column-box__main-column__items--featured'
                )}
            >
                {children}
            </div>
        </div>
    </div>
);

FeaturedPlanningListGroup.propTypes = {
    leftBorder: PropTypes.bool,
    children: PropTypes.node.isRequired,
};

FeaturedPlanningListGroup.defaultProps = {
    leftBorder: false,
};
