import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems} from '../utils/common';
import {EventEditor, PlanningList, EmbeddedCoverageEditor} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

test.describe('Planning.Events: embedded planning autosave', () => {
    let editor: EventEditor;
    let embedded: EmbeddedCoverageEditor;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        embedded = new EmbeddedCoverageEditor(editor);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    // Saving an embedded planning deletes its autosave document. The bug was that the
    // editor kept referencing the deleted document, so the next change PATCHed a 404 and
    // was never autosaved. Two save cycles reach that state; the final change is only
    // autosaved, so its survival across a reload is the assertion.
    test('an autosave-only change survives reload after repeated saves', async ({page}) => {
        test.setTimeout(150000);

        await addItems(page.request, 'events', [createEventFor.today({
            type: 'event',
            state: 'draft',
            name: 'Autosave regression',
            slugline: 'autosave',
        })]);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.clickBookmark('add_planning');
        await editor.waitForAutosave();
        await expect(embedded.getPlanningItem(0)).toBeVisible();

        // Saving the temporary planning moves it onto the HTTP autosave path.
        await embedded.appendToSlugline(0, '-a');
        await embedded.save(0);

        // This save deletes the autosave document.
        const created = embedded.waitForAutosaved(page, 'POST');

        await embedded.appendToSlugline(0, '-b');
        await created;
        await embedded.save(0);

        // Only autosaved, never manually saved, so it is lost on reload unless the
        // deleted autosave document is recreated.
        const recreated = embedded.waitForAutosaved(page, 'POST');

        await embedded.appendToSlugline(0, '-keep');
        await recreated;

        await page.reload();
        await waitForPageLoad.planning(page);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await embedded.expand(0);
        await expect(embedded.slugline(0)).toContainText('autosave-a-b-keep');
    });
});
