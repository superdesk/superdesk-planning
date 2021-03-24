import React from 'react';
import PropTypes from 'prop-types';

import {Item, Column, Row, Border} from '../../UI/List';
import {Label} from '../../UI/Form';

export const MenuItem = ({label, onClick, active}) => (
    <Item noBg={!active} activated={active} onClick={onClick} className="sd-collapse-box sd-shadow--z2">
        <Border />
        <Column grow={true} border={false}>
            <Row paddingBottom>
                <Label row text={label} />
            </Row>
        </Column>
    </Item>
);

MenuItem.propTypes = {
    label: PropTypes.string,
    onClick: PropTypes.func,
    active: PropTypes.bool,
};
