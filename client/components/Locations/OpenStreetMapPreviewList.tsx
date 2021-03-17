import * as React from 'react';

import {ILocation, INominatimItem} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

import {ToggleBox} from '../UI';
import {Label} from '../UI/Form';
import {PreviewSimpleListItem} from '../fields/preview/base/PreviewSimpleListItem';

interface IProps {
    location?: ILocation;
}

export class OpenStreetMapPreviewList extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const location = this.props.location?.address?.external?.nominatim;

        if (location == null) {
            return null;
        }

        const fieldsToExclude: Array<keyof INominatimItem> = [
            'lon',
            'lat',
            'boundingbox',
            'extratags',
            'namedetails',
            'address',
            'licence',
            'icon',
        ];

        const metadataFields = Object.keys(location)
            .filter((field: keyof INominatimItem) => !fieldsToExclude.includes(field));

        return (
            <React.Fragment>
                <Label
                    text={gettext('OpenStreetMap Details')}
                    row={true}
                />
                {!location.licence?.length ? null : (
                    <p>{location.licence}</p>
                )}

                {!Object.keys(location.address ?? {}).length ? null : (
                    <ToggleBox
                        title={gettext('Address')}
                        isOpen={false}
                        scrollInView={true}
                    >
                        <ul className="simple-list simple-list--dotted">
                            {Object.keys(location.address).map((field) => (
                                <PreviewSimpleListItem
                                    key={field}
                                    label={field}
                                    value={location.address[field]}
                                />
                            ))}
                        </ul>
                    </ToggleBox>
                )}
                {!metadataFields.length ? null : (
                    <ToggleBox
                        title={gettext('Metadata')}
                        isOpen={false}
                        scrollInView={true}
                    >
                        <ul className="simple-list simple-list--dotted">
                            {metadataFields.map((field) => (
                                <PreviewSimpleListItem
                                    key={field}
                                    label={field}
                                    value={location[field]}
                                />
                            ))}
                        </ul>
                    </ToggleBox>
                )}
                {!Object.keys(location.extratags ?? {}).length ? null : (
                    <ToggleBox
                        title={gettext('Tags')}
                        isOpen={false}
                        scrollInView={true}
                    >
                        <ul className="simple-list simple-list--dotted">
                            {Object.keys(location.extratags).map((field) => (
                                <PreviewSimpleListItem
                                    key={field}
                                    label={field}
                                    value={location.extratags[field]}
                                />
                            ))}
                        </ul>
                    </ToggleBox>
                )}
                {!Object.keys(location.namedetails ?? {}).length ? null : (
                    <ToggleBox
                        title={gettext('Other Names')}
                        isOpen={false}
                        scrollInView={true}
                    >
                        <ul className="simple-list simple-list--dotted">
                            {Object.keys(location.namedetails).map((field) => (
                                <PreviewSimpleListItem
                                    key={field}
                                    label={field}
                                    value={location.namedetails[field]}
                                />
                            ))}
                        </ul>
                    </ToggleBox>
                )}
            </React.Fragment>
        );
    }
}
