import React from 'react';
import PropTypes from 'prop-types';

import {Column} from './Column';
import {isItemPublic, planningUtils} from '../../../utils';
import {TOOLTIPS} from '../../../constants';

export const PubStatus = ({item}) => {
    let badge;

    if (isItemPublic(item)) {
        badge = <span className="badge badge--success"
            data-sd-tooltip={TOOLTIPS.publishedState}
            data-flow="down">P</span>;
    } else if (planningUtils.isNotForPublication(item)) {
        badge = <i
            className="icon-ban-circle icon--red"
            style={{
                width: '22px',
                height: '22px',
                fontSize: '22px'
            }}
        />;
    } else {
        badge = <span className="badge badge--light">&nbsp;</span>;
    }

    return (
        <Column>
            {badge}
        </Column>
    );
};

PubStatus.propTypes = {
    item: PropTypes.object.isRequired
};
