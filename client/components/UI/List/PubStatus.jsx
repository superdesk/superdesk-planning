import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Column} from './Column';
import {isItemPublic} from '../../../utils';

export const PubStatus = ({item}) => {
    let badge;

    if (isItemPublic(item)) {
        badge = <span className="badge badge--success">P</span>;
    } else if (get(item, 'flags.marked_for_not_publication', false)) {
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
