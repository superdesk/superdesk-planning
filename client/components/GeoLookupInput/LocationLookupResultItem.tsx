import * as React from 'react';
import classNames from 'classnames';

import {ILocation} from '../../interfaces';

import {getLocationsShortName} from '../../utils/locations';

interface IProps {
    onClick?(): void;
    active?: boolean;
    location: Partial<ILocation>;
}

export class LocationLookupResultItem extends React.PureComponent<IProps> {
    render() {
        return (
            <li
                onClick={this.props.onClick}
                className={classNames(
                    'sd-list-item__row',
                    'addgeolookup__item',
                    {'addgeolookup__item--active': this.props.active}
                )}
            >
                <span className="sd-overflow-ellipsis">
                    {getLocationsShortName(this.props.location)}
                </span>
            </li>
        );
    }
}
