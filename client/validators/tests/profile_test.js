import {formProfile} from '../profile';

describe('profileValidators', () => {
    let profile;
    let event;
    let errors;
    let errorMessages;

    beforeEach(() => {
        profile = {
            editor: {
                slugline: {enabled: true},
                name: {enabled: true},
                definition_short: {enabled: true},
                definition_long: {enabled: false},
                files: {enabled: true},
            },
            schema: {
                slugline: {
                    minlength: 5,
                    maxlength: 10,
                    required: true,
                    type: 'string',
                },
                name: {required: true},
                definition_short: {required: false},
                definition_long: {required: true},
                files: {
                    required: false,
                    minlength: 2,
                    maxlength: 5,
                    type: 'list',
                },
            },
        };

        event = {
            slugline: '',
            name: '',
            definition_short: '',
            definition_long: '',
        };

        errors = {};
        errorMessages = [];
    });

    const testValidate = (field, response, messages = []) => {
        formProfile(null, null, field, event[field], profile, errors, errorMessages);
        expect(errors).toEqual(response);
        expect(errorMessages).toEqual(messages);
    };

    it('ignores disabled fields', () => {
        delete event.definition_long;

        testValidate('definition_long', {});
    });

    it('checks the minimum length of a string', () => {
        event.slugline = '1';
        testValidate(
            'slugline',
            {slugline: 'Too short'},
            ['{{ name }} is too short']
        );

        errorMessages = [];
        event.slugline = '12345';
        testValidate('slugline', {});
    });

    it('checks the minimum length of an array', () => {
        event.files = ['1'];
        testValidate(
            'files',
            {files: 'Not enough'},
            ['Not enough {{ name }}']
        );

        errorMessages = [];
        event.files = ['1', '2'];
        testValidate('files', {});
    });

    it('checks the maximum length of a string', () => {
        event.slugline = '12345';
        testValidate('slugline', {});

        errorMessages = [];
        event.slugline = '12345678901';
        testValidate(
            'slugline',
            {slugline: 'Too long'},
            ['{{ name }} is too long']
        );
    });

    it('checks the maximum length of an array', () => {
        event.files = ['1', '2'];
        testValidate('files', {});

        errorMessages = [];
        event.files = ['1', '2', '3', '4', '5', '6'];
        testValidate(
            'files',
            {files: 'Too many files'},
            ['Too many {{ name }}']
        );
    });

    it('checks string field is required', () => {
        delete event.slugline;
        testValidate(
            'slugline',
            {slugline: 'This field is required'},
            ['{{ name }} is a required field']
        );

        errorMessages = [];
        event.slugline = '12345';
        testValidate('slugline', {});
    });

    it('checks array field is required', () => {
        profile.schema.files.required = true;
        profile.schema.files.minlength = 0;
        event.files = [];
        testValidate(
            'files',
            {files: 'This field is required'},
            ['{{ name }} is a required field']
        );

        errorMessages = [];
        event.files = ['1'];
        testValidate('files', {});
    });
});
