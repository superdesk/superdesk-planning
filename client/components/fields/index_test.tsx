import {renderProfileGroupedFields, renderProfileFieldsFlat} from './index';
import {ToggleBox} from '../UI/ToggleBox';

describe('profile driven field rendering', () => {
    // A fresh profile per test: rendering sorts and re-indexes fields in place
    const getProfile = () => ({
        editor: {
            name: {enabled: true, group: 'main', index: 0},
            slugline: {enabled: true, group: 'main', index: 1},
            ednote: {enabled: true, group: 'details', index: 2},
            internal_note: {enabled: false, group: 'details', index: 3},
            headline: {enabled: true, index: 4}, // enabled, but not part of any group
        },
        schema: {},
        groups: {
            main: {_id: 'main', name: 'Main', index: 0},
            details: {_id: 'details', name: 'Details', index: 1, useToggleBox: true},
        },
    });

    const globalProps = {item: {}, language: 'en', renderEmpty: true};
    const getFieldKeys = (children) => children.map((child) => child.key);

    describe('renderProfileGroupedFields', () => {
        it('renders groups in profile order, with fields in editor order', () => {
            const groups: any = renderProfileGroupedFields('form-preview', getProfile(), globalProps, {});

            expect(groups.length).toBe(2);

            expect(groups[0].type).toBe('div');
            expect(groups[0].key).toBe('main');
            expect(getFieldKeys(groups[0].props.children)).toEqual(['name-0', 'slugline-1']);

            expect(groups[1].type).toBe(ToggleBox);
            expect(groups[1].key).toBe('details');
            expect(groups[1].props.title).toBe('Details');
            expect(groups[1].props.isOpen).toBe(false);
            expect(getFieldKeys(groups[1].props.children)).toEqual(['ednote-0']);
        });

        it('skips excluded fields, dropping groups left empty', () => {
            const groups: any = renderProfileGroupedFields(
                'form-preview', getProfile(), globalProps, {}, ['ednote'],
            );

            expect(groups.length).toBe(1);
            expect(groups[0].key).toBe('main');
        });

        it('falls back to flat rendering when the profile defines no groups', () => {
            const profile = {...getProfile(), groups: {}};
            const fields: any = renderProfileGroupedFields('form-preview', profile, globalProps, {});

            expect(getFieldKeys(fields)).toEqual(['name-0', 'slugline-1', 'ednote-2', 'headline-3']);
        });

        it('marks fields inside toggle box groups with noToggle to prevent nested toggles', () => {
            const profile = {
                editor: {
                    files: {enabled: true, group: 'attachments', index: 0},
                    slugline: {enabled: true, group: 'main', index: 0},
                },
                schema: {},
                groups: {
                    main: {_id: 'main', name: 'Main', index: 0},
                    attachments: {_id: 'attachments', name: 'Attachments', index: 1, useToggleBox: true},
                },
            };
            const groups: any = renderProfileGroupedFields('form-preview', profile, globalProps, {});

            expect(groups[0].props.children[0].props.noToggle).toBeUndefined();
            expect(groups[1].type).toBe(ToggleBox);
            expect(groups[1].props.children[0].props.noToggle).toBe(true);
        });

        it('renders the priority field at its profile position in a non-toggle group', () => {
            // Priority as an integer field inside a plain group, like real planning profiles
            const profile = {
                editor: {
                    description_text: {enabled: true, group: 'description', index: 0},
                    priority: {enabled: true, group: 'description', index: 1},
                    internal_note: {enabled: true, group: 'description', index: 2},
                },
                schema: {priority: {type: 'integer', required: false}},
                groups: {
                    description: {_id: 'description', name: 'Description', index: 0, useToggleBox: false},
                },
            };
            const groups: any = renderProfileGroupedFields(
                'form-preview', profile, {item: {priority: 2}, language: 'en', renderEmpty: true}, {},
            );

            expect(groups.length).toBe(1);
            expect(getFieldKeys(groups[0].props.children))
                .toEqual(['description_text-0', 'priority-1', 'internal_note-2']);
        });

        it('returns null for a profile without an editor config', () => {
            expect(renderProfileGroupedFields('form-preview', null, globalProps, {})).toBe(null);
            expect(renderProfileGroupedFields('form-preview', {}, globalProps, {})).toBe(null);
        });
    });

    describe('renderProfileFieldsFlat', () => {
        it('renders enabled fields flat in profile order, ignoring groups', () => {
            const fields: any = renderProfileFieldsFlat('form-preview', getProfile(), globalProps, {});

            expect(getFieldKeys(fields)).toEqual(['name-0', 'slugline-1', 'ednote-2', 'headline-3']);
        });

        it('skips excluded fields', () => {
            const fields: any = renderProfileFieldsFlat(
                'form-preview', getProfile(), globalProps, {}, ['ednote', 'headline'],
            );

            expect(getFieldKeys(fields)).toEqual(['name-0', 'slugline-1']);
        });

        it('returns null when the profile has no editor config', () => {
            expect(renderProfileFieldsFlat('form-preview', null, globalProps, {})).toBe(null);
            expect(renderProfileFieldsFlat('form-preview', {}, globalProps, {})).toBe(null);
        });
    });
});
