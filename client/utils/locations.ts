import {
    IEventLocation,
    ILocation,
    INominatimItem,
} from '../interfaces';

const nominatimToAddressMap: {[key: string]: Array<keyof INominatimItem['address']>} = {
    city: [
        'city',
        'town',
        'village',
        'county',
    ],
    state: [
        'state',
        'territory',
        'region',
    ],
    locality: [
        'city',
        'state',
        'state_district',
        'region',
        'county',
        'island',
        'town',
        'moor',
        'waterways',
        'village',
        'district',
        'borough',
    ],
    area: [
        'state_district',
        'island',
        'town',
        'moor',
        'waterways',
        'village',
        'hamlet',
        'municipality',
        'district',
        'borough',
        'airport',
        'national_park',
        'suburb',
        'croft',
        'subdivision',
        'farm',
        'locality',
        'islet',
    ],
};

function mapNominatimFieldsToAddress(item: INominatimItem): Partial<ILocation['address']> {
    const location = {};

    Object.keys(nominatimToAddressMap).forEach((destinationField: keyof ILocation['address']) => {
        const sourceField = nominatimToAddressMap[destinationField].find(
            (field) => item.address[field] != null
        );

        if (sourceField) {
            location[destinationField] = item.address[sourceField];
        }
    });

    return location;
}

export function getUniqueNameForLocation(location: Partial<ILocation>) {
    return location.address?.external?.nominatim?.display_name?.length ?
        location.address.external.nominatim?.display_name :
        (location.name ?? '').concat(
            ' ',
            formatLocationToAddress(location)
        );
}

export function convertNominatimToLocation(item: INominatimItem): Partial<ILocation> {
    const location: Partial<ILocation> = {
        unique_name: item.display_name,
        is_active: true,
        address: {
            line: [
                (
                    (item.address.house_number ?? '') +
                    ' ' +
                    (item.address.road ?? '')
                ).trim(),
            ],
            ...mapNominatimFieldsToAddress(item),
            postal_code: item.address.postcode,
            country: item.address.country,
            external: {nominatim: item},
            boundingbox: item.boundingbox,
            type: item.type,
        },
    };

    location.name = item.namedetails.name ??
        location.address.line[0];

    location.translations = {
        name: item.namedetails,
    };

    if (item.address[item.class]) {
        location.address.title = item.address[item.class];
    }

    if (item.lat && item.lon) {
        location.position = {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        };
    }

    return location;
}

export function formatLocationToAddress(item: Partial<ILocation> | IEventLocation) {
    if (item.formatted_address?.length) {
        return item.formatted_address;
    }

    const formattedAddress = [
        item.address?.line?.[0],
        item.address?.area,
        item.address?.locality,
        item.address?.postal_code,
        item.address?.country,
    ].filter((d) => d).join(', ');

    return item.address?.title ?
        item.address?.title + ', ' + formattedAddress :
        formattedAddress;
}

export function getLocationsShortName(location: Partial<ILocation>) {
    const formattedAddress = formatLocationToAddress(location);
    const title = location.address?.title ?? location.name;

    return title ?
        `${title}, ${formattedAddress}` :
        formattedAddress;
}
