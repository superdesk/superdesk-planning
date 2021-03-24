import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../../utils';

import {Item, Column, Row, Border} from '../../UI/List';
import {Label} from '../../UI/Form';
import {get} from 'lodash';

export const EventFiles = ({item, onClick, active}) => (
    <Item
        className="sd-collapse-box sd-shadow--z2"
        noBg={!active}
        activated={active}
        onClick={onClick}
    >
        <Border />
        <Column grow={true} border={false}>
            <Row paddingBottom>
                <span className="sd-list-item--element-grow">
                    <Label row text={gettext('Files')} />
                </span>
                {get(item, 'files.length', 0) > 0 &&
                    <span className="badge badge--light pull-right">{item.files.length}</span>
                }
            </Row>
        </Column>
    </Item>
);

EventFiles.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
};
