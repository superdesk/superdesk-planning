import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Item, Column, Row, Border, ActionMenu} from '../UI/List';
import {Button} from '../UI';
import {Location} from '../Location';

import {onEventCapture, formatAddress} from '../../utils';

export const LocationItem = ({location, streetMapUrl, active, onRemoveLocation, readOnly}) => (
    <Item noBg={!active} activated={active} className="sd-collapse-box sd-shadow--z2">
        <Border/>
        <Column grow={true} border={false}>
            <Row paddingBottom>
                <Location
                    name={get(location, 'name')}
                    address={'formatted_address' in location ? location.formatted_address :
                        get(formatAddress(get(location, 'nominatim', location)), 'formattedAddress')}
                    mapUrl={streetMapUrl}
                    multiLine={true} />
                <ActionMenu className="pull-right">
                    {!readOnly && <Button
                        data-sd-tooltip={gettext('Remove Location')}
                        data-flow="left"
                        onClick={() => {
                            onEventCapture(event);
                            onRemoveLocation();
                        }}
                        icon="icon-trash"
                        pullRight
                        empty />}
                </ActionMenu>
            </Row>
        </Column>
    </Item>
);

LocationItem.propTypes = {
    streetMapUrl: PropTypes.string,
    location: PropTypes.object,
    active: PropTypes.bool,
    onRemoveLocation: PropTypes.func,
    readOnly: PropTypes.bool,
};
