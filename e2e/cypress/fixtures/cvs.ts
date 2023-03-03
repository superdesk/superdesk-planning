
export const CVs = {
    COUNTRIES: {
        _id: 'countries',
        display_name: 'Countries',
        type: 'manageable',
        unique_field: 'qcode',
        items: [
            {qcode: 'AFG', name: 'Afghanistan'},
            {qcode: 'ALA', name: 'Aland Islands'},
            {qcode: 'ALB', name: 'Albania'},
            {qcode: 'DZA', name: 'Algeria'},
            {qcode: 'ASM', name: 'American Samoa'},
            {qcode: 'AND', name: 'Andorra'},
            {qcode: 'AGO', name: 'Angola'},
            {qcode: 'AIA', name: 'Anguilla'},
            {qcode: 'ATA', name: 'Antarctica'},
            {qcode: 'ATG', name: 'Antigua and Barbuda'},
            {qcode: 'ARG', name: 'Argentina'},
            {qcode: 'AUS', name: 'Australia'},
        ]
    },
    REGIONS: {
        _id: 'regions',
        type: 'manageable',
        selection_type: 'multi selection',
        unique_field: 'qcode',
        display_name: 'State / Region',
        items: [
            {qcode: 'NSW', name: 'New South Wales'},
            {qcode: 'VIC', name: 'Victoria'},
            {qcode: 'TAS', name: 'Tasmania'},
            {qcode: 'WA', name: 'West Australia'},
            {qcode: 'QLD', name: 'Queensland'},
            {qcode: 'NT', name: 'Northern Territory'},
            {qcode: 'ACT', name: 'Australian Capital Territory'},
            {qcode: 'SA', name: 'South Australia'},
        ]
    },
    LANGUAGES: {
        _id: 'languages',
        display_name: 'Languages',
        type: 'manageable',
        unique_field: 'qcode',
        service: {all: 1},
        items: [
            {qcode: 'nl', name: 'Dutch', is_active: true},
            {qcode: 'fr', name: 'French', is_active: true},
            {qcode: 'en', name: 'English', is_active: true},
            {qcode: 'de', name: 'German', is_active: true},
        ]
    },
};
