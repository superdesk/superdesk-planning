import {MaxLengthValidatorFactory} from './index';

describe('validators', () => {
    describe('MaxLengthValidatorFactory', () => {
        it('checks length', () => {
            const validator = MaxLengthValidatorFactory({name: 5});

            expect(validator({name: 'pouet'})).toEqual({});
            expect(validator({name: 'pouet too much'}))
                .toEqual({name: 'Value is too long. Max is 5 characters'});
        });
    });
});
