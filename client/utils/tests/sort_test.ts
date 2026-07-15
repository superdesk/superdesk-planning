import {defaultSort, sortItems} from '../sort';
import {MAIN} from '../../constants';
import {IEventOrPlanningItem} from '../../interfaces';

const PLANNING = MAIN.FILTERS.PLANNING;
const EVENTS = MAIN.FILTERS.EVENTS;
const COMBINED = MAIN.FILTERS.COMBINED;

function makeEvent(name: string, start: string, catName?: string): IEventOrPlanningItem {
    return {
        _id: name,
        type: 'event',
        name: name,
        dates: {start: start},
        anpa_category: catName ? [{name: catName, qcode: '1'}] : [],
    } as unknown as IEventOrPlanningItem;
}

function makePlanning(
    slugline: string,
    planningDate: string,
    catName?: string,
    priority?: number,
): IEventOrPlanningItem {
    return {
        _id: slugline,
        type: 'planning',
        slugline: slugline,
        planning_date: planningDate,
        anpa_category: catName ? [{name: catName, qcode: '1'}] : [],
        priority: priority,
    } as unknown as IEventOrPlanningItem;
}

describe('utils.sort', () => {
    describe('defaultSort', () => {
        it('sorts events chronologically by dates.start ascending', () => {
            const items = [
                makeEvent('Maraton SM', '2026-07-14T08:00:00+0000', 'Urheilu'),
                makeEvent('Talousfoorumi', '2026-07-14T14:00:00+0000', 'Talous'),
                makeEvent('Keskustelua', '2026-07-14T09:00:00+0000', 'Uutiskooste'),
            ];

            const sorted = defaultSort([...items]);
            const names = sorted.map((i) => (i as any).name);

            expect(names).toEqual(['Maraton SM', 'Keskustelua', 'Talousfoorumi']);
        });

        it('does NOT sort events by anpa_category (department)', () => {
            const items = [
                makeEvent('Urheilu event', '2026-07-14T15:00:00+0000', 'Urheilu'),
                makeEvent('Business event', '2026-07-14T08:00:00+0000', 'Business wire'),
            ];

            const sorted = defaultSort([...items]);
            const names = sorted.map((i) => (i as any).name);

            // 08:00 event first, even though "Business wire" sorts before "Urheilu" alphabetically
            expect(names).toEqual(['Business event', 'Urheilu event']);
        });

        it('falls back to planning_date for planning items', () => {
            const items = [
                makePlanning('Late plan', '2026-07-14T12:00:00+0000'),
                makePlanning('Early plan', '2026-07-14T00:00:00+0000'),
            ];

            const sorted = defaultSort([...items]);
            const slugs = sorted.map((i) => (i as any).slugline);

            expect(slugs).toEqual(['Early plan', 'Late plan']);
        });

        it('sorts mixed events and planning items chronologically', () => {
            const items: Array<IEventOrPlanningItem> = [
                makePlanning('Plan at noon', '2026-07-14T12:00:00+0000'),
                makeEvent('Event at 8', '2026-07-14T08:00:00+0000'),
                makeEvent('Event at 15', '2026-07-14T15:00:00+0000'),
            ];

            const sorted = defaultSort([...items]);
            const labels = sorted.map((i) => (i as any).name ?? (i as any).slugline);

            expect(labels).toEqual(['Event at 8', 'Plan at noon', 'Event at 15']);
        });

        it('handles missing dates gracefully and sorts them last', () => {
            const items = [
                makePlanning('No date', undefined as unknown as string),
                makeEvent('With date', '2026-07-14T08:00:00+0000'),
                makeEvent('Earlier', '2026-07-14T06:00:00+0000'),
            ];

            // Should not throw; items with missing dates sort last
            const sorted = defaultSort([...items]);
            const labels = sorted.map((i) => (i as any).name ?? (i as any).slugline);

            expect(labels).toEqual(['Earlier', 'With date', 'No date']);
        });
    });

    describe('sortItems', () => {
        // A custom comparator that sorts by department (alpha) then priority (asc)
        const customComparator = (a: any, b: any): number => {
            const aDept = (a.anpa_category?.[0]?.name ?? '').toLowerCase();
            const bDept = (b.anpa_category?.[0]?.name ?? '').toLowerCase();
            const deptResult = aDept.localeCompare(bDept);

            if (deptResult !== 0) return deptResult;

            const aPrio = a.priority ?? 5;
            const bPrio = b.priority ?? 5;

            return aPrio - bPrio;
        };

        it('uses custom comparator for PLANNING view', () => {
            const items = [
                makePlanning('Urheilu prio 1', '2026-07-14T00:00:00+0000', 'Urheilu', 1),
                makePlanning('Business prio 5', '2026-07-14T00:00:00+0000', 'Business wire', 5),
            ];

            const sorted = sortItems([...items], PLANNING, customComparator);
            const slugs = sorted.map((i) => (i as any).slugline);

            // Business wire sorts before Urheilu alphabetically, despite higher priority
            expect(slugs).toEqual(['Business prio 5', 'Urheilu prio 1']);
        });

        it('falls back to defaultSort for PLANNING view when no comparator is provided', () => {
            const items = [
                makePlanning('Late', '2026-07-14T12:00:00+0000', 'Business wire'),
                makePlanning('Early', '2026-07-14T00:00:00+0000', 'Urheilu'),
            ];

            const sorted = sortItems([...items], PLANNING, undefined);
            const slugs = sorted.map((i) => (i as any).slugline);

            // Chronological by planning_date, not by department
            expect(slugs).toEqual(['Early', 'Late']);
        });

        it('custom comparator overrides chronological order for PLANNING view', () => {
            // Planning items whose dept alpha order differs from date order
            const items = [
                makePlanning('Urheilu early', '2026-07-14T06:00:00+0000', 'Urheilu', 1),
                makePlanning('Business late', '2026-07-14T14:00:00+0000', 'Business wire', 5),
            ];

            // Custom comparator sorts by dept (Business wire before Urheilu),
            // ignoring the chronological order (06:00 before 14:00)
            const sorted = sortItems([...items], PLANNING, customComparator);
            const slugs = sorted.map((i) => (i as any).slugline);

            expect(slugs).toEqual(['Business late', 'Urheilu early']);
        });

        it('uses defaultSort for EVENTS view even when custom comparator is provided', () => {
            const items = [
                makeEvent('Urheilu 15:00', '2026-07-14T15:00:00+0000', 'Urheilu'),
                makeEvent('Business 08:00', '2026-07-14T08:00:00+0000', 'Business wire'),
            ];

            const sorted = sortItems([...items], EVENTS, customComparator);
            const names = sorted.map((i) => (i as any).name);

            // Chronological (08:00 first), NOT alphabetical by department
            expect(names).toEqual(['Business 08:00', 'Urheilu 15:00']);
        });

        it('uses defaultSort for COMBINED view even when custom comparator is provided', () => {
            const items: Array<IEventOrPlanningItem> = [
                makeEvent('Event 14:00', '2026-07-14T14:00:00+0000', 'Talous'),
                makePlanning('Plan 00:00', '2026-07-14T00:00:00+0000', 'Business wire', 1),
            ];

            const sorted = sortItems([...items], COMBINED, customComparator);
            const labels = sorted.map((i) => (i as any).name ?? (i as any).slugline);

            // Chronological: plan at 00:00 before event at 14:00
            expect(labels).toEqual(['Plan 00:00', 'Event 14:00']);
        });

        it('custom comparator does not affect EVENTS view order', () => {
            // Events with categories whose alphabetical order differs from chronological order
            const items = [
                makeEvent('Maraton SM', '2026-07-14T08:00:00+0000', 'Urheilu'),
                makeEvent('Q2 Tulostiedote', '2026-07-14T12:00:00+0000', 'Business wire'),
            ];

            // Should be chronological (08:00 first), not alphabetical by department
            const sorted = sortItems([...items], EVENTS, customComparator);
            const names = sorted.map((i) => (i as any).name);

            expect(names).toEqual(['Maraton SM', 'Q2 Tulostiedote']);
        });

        it('custom comparator does not affect COMBINED view order', () => {
            // Mixed items whose dept alpha order differs from chronological order
            const items: Array<IEventOrPlanningItem> = [
                makeEvent('Urheilu event', '2026-07-14T15:00:00+0000', 'Urheilu'),
                makePlanning('Business plan', '2026-07-14T00:00:00+0000', 'Business wire', 1),
            ];

            // Should be chronological (plan at 00:00 before event at 15:00),
            // not alphabetical by department
            const sorted = sortItems([...items], COMBINED, customComparator);
            const labels = sorted.map((i) => (i as any).name ?? (i as any).slugline);

            expect(labels).toEqual(['Business plan', 'Urheilu event']);
        });
    });
});
