import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';
import {SORT_DIRECTION} from '../../constants';

import './style.scss';

export const OrderDirectionIcon = ({direction, onChange}) => {
    let onClick;
    let title;
    let icon;

    if (direction === SORT_DIRECTION.ASCENDING) {
        onClick = () => onChange(SORT_DIRECTION.DESCENDING);
        title = gettext('Ascending');
        icon = 'icon-ascending';
    } else {
        onClick = () => onChange(SORT_DIRECTION.ASCENDING);
        title = gettext('Descending');
        icon = 'icon-descending';
    }

    return (
        <button
            onClick={onClick}
            className="btn btn--icon-only order-direction__button"
            title={title}
        >
            <i className={icon} />
        </button>
    );
};

OrderDirectionIcon.propTypes = {
    direction: PropTypes.string,
    onChange: PropTypes.func,
};

OrderDirectionIcon.defaultProps = {direction: SORT_DIRECTION.ASCENDING};
