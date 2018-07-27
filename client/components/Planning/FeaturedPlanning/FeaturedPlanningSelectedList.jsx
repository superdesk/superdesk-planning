import React from 'react';
import PropTypes from 'prop-types';
import {FeaturedPlanningList} from './FeaturedPlanningList';
import './style.scss';

export const FeaturedPlanningSelectedList = ({
    readOnly,
    ...props
}) => (
    <FeaturedPlanningList
        {...props}
        readOnly={readOnly}
        hideItemActions
        sortable={!readOnly}
        header={gettext('Currently selected')}
        withMargin
        emptyMsg={gettext('No selected featured stories')}
    />
);

FeaturedPlanningSelectedList.propTypes = {readOnly: PropTypes.bool};
