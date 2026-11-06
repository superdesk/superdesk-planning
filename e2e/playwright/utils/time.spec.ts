import {test, expect} from '@playwright/test';
import moment from 'moment-timezone';

import {getDateStringFor} from './time';

test('next-week fixtures stay distinct from tomorrow throughout the week', () => {
    const now = moment.now;

    try {
        for (let day = 1; day <= 7; day++) {
            moment.now = () => new Date(2026, 10, day, 12).getTime();

            expect(getDateStringFor.next_week()).toBe('2026-11-09');
            expect(getDateStringFor.next_week()).not.toBe(getDateStringFor.tomorrow());
        }

        moment.now = () => new Date(2026, 11, 31, 12).getTime();

        expect(getDateStringFor.next_week()).toBe('2027-01-04');
    } finally {
        moment.now = now;
    }
});
