import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../superdeskApi';
import {ILocation, IEventLocation} from '../../interfaces';

import {Item, Column, Row, Border, ActionMenu} from '../UI/List';
import {Button} from '../UI';
import {Location} from '../Location';

import {onEventCapture} from '../../utils';
import {formatLocationToAddress} from '../../utils/locations';

interface IProps {
    location?: ILocation | IEventLocation;
    active?: boolean;
    readOnly?: boolean;
    onRemoveLocation?(): void;
}

export class LocationItem extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const location = this.props.location;

        return (
            <Item
                noBg={!this.props.active}
                activated={this.props.active}
                className="sd-collapse-box sd-shadow--z2"
            >
                <Border />
                <Column grow={true} border={false}>
                    <Row paddingBottom>
                        <Location
                            name={this.props.location.name}
                            address={formatLocationToAddress(this.props.location)}
                            multiLine={true}
                            details={get(location, 'details[0]')}
                        />
                        <ActionMenu className="pull-right">
                            {(this.props.readOnly || this.props.onRemoveLocation == null) ? null : (
                                <Button
                                    data-sd-tooltip={gettext('Remove Location')}
                                    data-flow="left"
                                    onClick={(event) => {
                                        onEventCapture(event);
                                        this.props.onRemoveLocation();
                                    }}
                                    icon="icon-trash"
                                    pullRight={true}
                                    empty={true}
                                />
                            )}
                        </ActionMenu>
                    </Row>
                </Column>
            </Item>
        );
    }
}
