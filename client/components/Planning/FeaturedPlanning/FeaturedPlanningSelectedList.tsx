import React from 'react';
import PropTypes from 'prop-types';
import {FeaturedPlanningList} from './FeaturedPlanningList';
import './style.scss';

export const FeaturedPlanningSelectedList = ({
    item,
    readOnly,
    ...props
}) => (
    <FeaturedPlanningList
        {...props}
        item={item}
        readOnly={readOnly}
        hideItemActions
        sortable={!readOnly}
        header={gettext('Currently selected')}
        withMargin
        emptyMsg={gettext('No selected featured stories')}
        showAuditInformation
    />
);


FeaturedPlanningSelectedList.propTypes = {
    readOnly: PropTypes.bool,
    item: PropTypes.object,
};
