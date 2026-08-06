import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, changeWorkspace} from './utils/common';
import {
    AdvancedSearch,
    AssignmentEditor,
    PlanningEditor,
    PlanningList,
    PlanningPreview,
} from './utils/planning';
import {createEventFor} from './utils/fixtures/events';
import {createPlanningFor} from './utils/fixtures/planning';

const EVENT_ID = 'e2e-card-view-event';

const EVENT = {
    guid: EVENT_ID,
    name: 'Card View Event',
    // list config only
    slugline: 'EVENT-LIST-ONLY-SLUGLINE',
    // card_view only
    reference: 'EVENT-CARD-ONLY-REF',
    calendars: [{qcode: 'sport', name: 'Sport'}],
};

const PLANNING = {
    slugline: 'PLANNING-CARD-SLUGLINE',
    // card_view only
    headline: 'PLANNING-CARD-ONLY-HEADLINE',
    // list config only
    description_text: 'PLANNING-LIST-ONLY-DESCRIPTION',
    // card_view second line only
    urgency: 3,
    related_events: [{_id: EVENT_ID, link_type: 'primary'}],
};

test.describe('Planning: entity cards inside item previews', () => {
    let list: PlanningList;
    let preview: PlanningPreview;
    let search: AdvancedSearch;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        preview = new PlanningPreview(page);
        search = new AdvancedSearch(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today(EVENT)]);
        await addItems(page.request, 'planning', [createPlanningFor.today(PLANNING)]);

        await login(page);
        await waitForPageLoad.planning(page);
    });

    const openPlanningPreview = async () => {
        await search.viewPlanningOnly();
        await list.expectItemCount(1);
        await list.item(0).click();
        await preview.waitTillOpen();
        await expect(preview.entityCards).toHaveCount(1);
    };

    const openEventPreview = async () => {
        await search.viewEventsOnly();
        await list.expectItemCount(1);
        await list.item(0).click();
        await preview.waitTillOpen();
        await expect(preview.entityCards).toHaveCount(1);
    };

    test('related event card in a planning preview uses event_list_item.card_view', async () => {
        await openPlanningPreview();

        const card = preview.entityCard(0);

        await expect(card).toContainText(EVENT.name);
        await expect(card).toContainText(EVENT.reference);

        await expect(card).not.toContainText('Calendar:');
        await expect(card).not.toContainText(EVENT.slugline);
    });

    test('related planning card in an event preview uses planning_list_item.card_view', async () => {
        await openEventPreview();

        const card = preview.entityCard(0);

        await expect(card).toContainText(PLANNING.slugline);
        await expect(card).toContainText(PLANNING.headline);

        // Asserted by class rather than the "Urgency:" label, which is translatable
        await expect(card.locator(`.urgency-label--${PLANNING.urgency}`)).toBeVisible();

        await expect(card).not.toContainText(PLANNING.description_text);
    });

    test('related event card in a planning preview has no content type icon', async () => {
        await openPlanningPreview();

        await expect(preview.entityCard(0)).toContainText(EVENT.reference);

        // The last test proves this id is live on the same component outside a card
        await expect(preview.itemTypeIcons(preview.entityCard(0))).toHaveCount(0);
    });

    test('related planning card in an event preview has no content type icon', async () => {
        await openEventPreview();

        await expect(preview.entityCard(0)).toContainText(PLANNING.headline);
        await expect(preview.itemTypeIcons(preview.entityCard(0))).toHaveCount(0);
    });

    // The third `cardView` call site. It cannot be seeded: an assignment only exists once a
    // coverage is put into workflow.
    test('assignment preview cards use card_view and omit the type icon', async ({page}) => {
        const editor = new PlanningEditor(page);
        const assignmentEditor = new AssignmentEditor(page);

        await search.viewPlanningOnly();
        await list.expectItemCount(1);
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.addCoverage('Text');

        const coverageEditor = editor.getCoverageEditor(0);
        // `editor.waitLoadingComplete()` is unusable here: with a coverage collapse box open its
        // close-button locator matches two elements. Wait on the state label, as other specs do.
        const coverageState = coverageEditor.element
            .locator('.sd-collapse-box__content-block--top')
            .locator('.label');

        await coverageEditor.editAssignmentButton.click();
        await assignmentEditor.waitTillOpen();
        await assignmentEditor.type({desk: 'Politic Desk'});
        await assignmentEditor.okButton.click();
        await assignmentEditor.waitTillClosed();

        await editor.waitForAutosave();
        await editor.saveButton.click();

        // Saving re-mounts the coverage collapsed and the reopening click can land on the
        // pre-save render, so retry until the saved state shows
        await expect(async () => {
            await coverageEditor.element.click();
            await expect(coverageState).toContainText('Draft', {timeout: 2_000});
        }).toPass({timeout: 30_000});

        await coverageEditor.toggleAddToWorkflow();
        await editor.saveButton.click();
        await expect(coverageState).toContainText('Assigned');

        await changeWorkspace(page, 'Assignments');
        await list.expectItemCount(1);
        await list.item(0).click();
        await preview.waitTillOpen();

        await expect(preview.entityCards).toHaveCount(2);

        const eventCard = preview.entityCard(0);
        const planningCard = preview.entityCard(1);

        await expect(eventCard).toContainText(EVENT.reference);
        await expect(eventCard).not.toContainText('Calendar:');
        await expect(preview.itemTypeIcons(eventCard)).toHaveCount(0);

        await expect(planningCard).toContainText(PLANNING.headline);
        await expect(planningCard).not.toContainText(PLANNING.description_text);
        await expect(preview.itemTypeIcons(planningCard)).toHaveCount(0);
    });

    // Control for the assertions above: the editor renders the same `RelatedEventListItem` without
    // `cardView`, so it must keep the list config and the icon
    test('the same event item outside a card keeps the list config and the type icon', async ({page}) => {
        const editor = new PlanningEditor(page);

        await search.viewPlanningOnly();
        await list.expectItemCount(1);
        await list.item(0).dblclick();
        await editor.waitTillOpen();

        const associatedEvent = editor.element.getByTestId('editor--event-item__0');

        await expect(associatedEvent).toContainText(EVENT.slugline);
        await expect(associatedEvent).toContainText('Calendar:');
        await expect(associatedEvent).not.toContainText(EVENT.reference);
        await expect(preview.itemTypeIcons(associatedEvent)).toHaveCount(1);
    });

    test('list rows still use the full list config, not card_view', async () => {
        await search.viewEventsOnly();
        await list.expectItemCount(1);
        await expect(list.item(0)).toContainText(EVENT.slugline);
        await expect(list.item(0)).toContainText('Calendar:');
        await expect(list.item(0)).not.toContainText(EVENT.reference);

        await search.viewPlanningOnly();
        await list.expectItemCount(1);
        await expect(list.item(0)).toContainText(PLANNING.description_text);
        await expect(list.item(0)).not.toContainText(PLANNING.headline);
    });
});
