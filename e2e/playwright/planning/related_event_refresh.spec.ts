import {test, expect, APIRequestContext} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, baseBackendUrl} from '../utils/common';
import {
    AdvancedSearch,
    EmbeddedEventEditor,
    PlanningEditor,
    PlanningList,
    PlanningPreview,
} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {createPlanningFor} from '../utils/fixtures/planning';

const EVENT_NAME = 'Related Refresh Event';
const FILE_NAME = 'attachment-refresh.txt';

const attachFileToEvent = async(request: APIRequestContext, eventId: string): Promise<void> => {
    const uploaded = await request.post(`${baseBackendUrl}/events_files`, {
        failOnStatusCode: true,
        multipart: {
            media: {
                name: FILE_NAME,
                mimeType: 'text/plain',
                buffer: Buffer.from('e2e attachment body'),
            },
        },
    });
    const fileId = (await uploaded.json())._id;
    const event = await request.get(`${baseBackendUrl}/events/${eventId}`, {failOnStatusCode: true});

    await request.patch(`${baseBackendUrl}/events/${eventId}`, {
        failOnStatusCode: true,
        headers: {'If-Match': (await event.json())._etag},
        data: {files: [fileId]},
    });
};

test.describe('Planning: related event changes refresh open views', () => {
    let list: PlanningList;
    let preview: PlanningPreview;
    let search: AdvancedSearch;
    let editor: PlanningEditor;
    let embedded: EmbeddedEventEditor;
    let eventId: string;

    test.beforeEach(async({page}, testInfo) => {
        // Unique per run so repeats stay independent of leftovers from a
        // previous instance of this test
        eventId = `e2e-related-event-refresh-${testInfo.repeatEachIndex}-${Date.now()}`;

        list = new PlanningList(page);
        preview = new PlanningPreview(page);
        search = new AdvancedSearch(page);
        editor = new PlanningEditor(page);
        embedded = new EmbeddedEventEditor(editor);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today({
            guid: eventId,
            name: EVENT_NAME,
            slugline: 'related-refresh',
        })]);
        await addItems(page.request, 'planning', [createPlanningFor.today({
            slugline: 'RELATED-REFRESH-PLAN',
            related_events: [{_id: eventId, link_type: 'primary'}],
        })]);

        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('saving the embedded event updates the preview card and the nested list row', async() => {
        await search.viewPlanningOnly();
        await list.expectItemCount(1);

        await list.toggleAssociatedEvents(0);
        await expect(list.nestedPlanningItems(0)).toHaveCount(1);
        await expect(list.nestedPlanningItem(0, 0)).toContainText(EVENT_NAME);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        // Preview after opening the editor: previewing an item closes on
        // opening it for edit, but not the other way around
        // TODO: verify this is the intended product behaviour; if preview and
        // editor are supposed to stay open in either order, drop the ordering
        // constraint here
        await list.item(0).click();
        await preview.waitTillOpen();
        await expect(preview.entityCards).toHaveCount(1);
        await expect(preview.entityCard(0)).toContainText(EVENT_NAME);

        await embedded.setName(0, `${EVENT_NAME} updated`);
        await embedded.save(0);

        // The preview card and the nested list row must pick up the change without
        // being closed and reopened
        await expect(preview.entityCard(0)).toContainText(`${EVENT_NAME} updated`);
        await expect(list.nestedPlanningItem(0, 0)).toContainText(`${EVENT_NAME} updated`);
    });

    test('an attachment added to the related event resolves in the open preview', async({page}) => {
        await search.viewPlanningOnly();
        await list.expectItemCount(1);
        await list.item(0).click();
        await preview.waitTillOpen();
        await expect(preview.entityCard(0)).toContainText(EVENT_NAME);

        await attachFileToEvent(page.request, eventId);

        await preview.entityCard(0).click();

        // Scoped to the expanded card: the planning item renders its own
        // "Attached Files" toggle in the same panel
        const expandedCard = preview.element.locator('.sd-collapse-box--open');

        await expandedCard.getByRole('button', {name: /Attached Files/}).click();

        // The file name only renders when the file resource was fetched after the
        // live update; an unresolved attachment shows as an empty row
        await expect(expandedCard).toContainText(FILE_NAME);
    });
});
