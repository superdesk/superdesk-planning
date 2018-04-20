import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../../utils';

import {Item, Column, Row, Border} from '../../UI/List';
import {Label} from '../../UI/Form';

export const EventLinks = ({item, onClick, active}) => (
    <Item noBg={!active} activated={active} onClick={onClick} className="sd-collapse-box sd-shadow--z2">
        <Border/>
        <Column grow={true} border={false}>
            <Row paddingBottom>
                <Label row text={gettext('Details')} />
            </Row>
        </Column>
    </Item>
);

EventLinks.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
};
