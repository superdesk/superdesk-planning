import React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import PropTypes from 'prop-types';

import {Column} from './Column';
import {isItemPublic, planningUtils, gettext} from '../../../utils';
import {TOOLTIPS} from '../../../constants';

export const PubStatus = ({item}) => {
    let badge;
    let title = null;

    if (isItemPublic(item)) {
        title = gettext(TOOLTIPS.publishedState);
        badge = <span className="badge badge--success">P</span>;
    } else if (planningUtils.isNotForPublication(item)) {
        title = gettext(TOOLTIPS.notForPublication);
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
            {title &&
                <OverlayTrigger placement="right"
                    overlay={<Tooltip id="badge_pub_status">{title}</Tooltip>}
                >
                    {badge}
                </OverlayTrigger>
            }
            {!title && (badge)}
        </Column>
    );
};

PubStatus.propTypes = {
    item: PropTypes.object.isRequired
};
