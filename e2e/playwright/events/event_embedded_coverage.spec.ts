import {test, expect} from '@playwright/test';
import moment from 'moment';

import {setup, login, waitForPageLoad, SubNavBar, addItems, CLIENT_FORMAT} from '../utils/common';
import {EventEditor, PlanningList, EmbeddedCoverageEditor} from '../page-object-models/planning';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';
import {createEventFor} from '../utils/fixtures/events';

test.describe('Planning.Events: embedded coverage', () => {
    let editor: EventEditor;
    let embeddedCoverages: EmbeddedCoverageEditor;
    let subnav: SubNavBar;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        embeddedCoverages = new EmbeddedCoverageEditor(editor);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can add a planning item to a new Event', async () => {
        await subnav.createEvent();
        await editor.waitTillOpen();

        // Enter required fields (so we can create the Event & Planning)
        await editor.type({
            'dates.start.date': moment().format(CLIENT_FORMAT),
            slugline: 'slugline of the event',
            name: 'name of the event',
        });

        await expect(editor.element.getByTestId('editor--planning-item__0')).not.toBeAttached();

        await editor.waitForAutosave();
        await editor.createButton.click();

        // wait for item to save and create button to disappear
        await expect(editor.createButton).not.toBeAttached();

        await editor.clickBookmark('add_planning');

        await expect(editor.element.getByTestId('editor--planning-item__0')).toBeVisible();

        await expect(embeddedCoverages.getAddCoverageForm(0)).toBeVisible();

        await editor.saveButton.click();

        // Test the new Event appears in the list view
        await list.expectItemCount(2);
        await list.expectItemText(0, 'slugline of the event');
    });

    test('can add a planning item to an existing event', async ({page}) => {
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                type: 'event',
                occur_status: {
                    name: 'Planned, occurs certainly',
                    label: 'Confirmed',
                    qcode: 'eocstat:eos5',
                },
                calendars: [],
                state: 'draft',
                place: [],
                name: 'Test',
                slugline: 'slugline of the event',
            })]
        );

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.clickBookmark('add_planning');

        await editor.waitForAutosave();
        await editor.saveButton.click();

        // Wait for save to be completed
        await expect(editor.closeButton).toBeEnabled();
        await editor.waitForAutosave();

        await editor.closeButton.click();
        await editor.waitTillClosed();

        // Wait for item to be unlocked in the list
        await expect(list.item(0).locator('.sd-list-item__border--locked')).not.toBeAttached()
        await page.waitForTimeout(1000);

        // Open the same item and add another Planning item
        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.clickBookmark('add_planning');

        await editor.waitForAutosave();
        await editor.saveButton.click();

        // Wait for save to be completed
        await expect(editor.saveButton).toBeDisabled();
        await editor.waitForAutosave();

        await expect(editor.closeButton).toContainText('Close');
        await editor.closeButton.click();
        await editor.waitTillClosed();

        // Wait for item to be unlocked in the list
        await expect(list.item(0).locator('.sd-list-item__border--locked')).not.toBeAttached()

        await list.toggleAssociatedPlanning(0);

        await expect(list.nestedPlanningItems(0)).toHaveCount(2);
    });

    test('planning items should stay after post/unpost', async ({page}) => {
        await setupPlanningPublishing(page.request);
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                type: 'event',
                occur_status: {
                    name: 'Planned, occurs certainly',
                    label: 'Confirmed',
                    qcode: 'eocstat:eos5',
                },
                calendars: [],
                state: 'draft',
                place: [],
                name: 'Test',
                slugline: 'slugline of the event',
            })]
        );

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.clickBookmark('add_planning');

        await editor.waitForAutosave();

        await expect(embeddedCoverages.getPlanningItem(0)).toBeVisible();
        await editor.saveButton.click();
        await editor.waitForAutosave();

        await editor.postButton.click();

        await editor.waitForAutosave();
        await expect(embeddedCoverages.getPlanningItem(0)).toBeVisible();

        await editor.unpostButton.click();
        await editor.waitForAutosave();
        await expect(embeddedCoverages.getPlanningItem(0)).toBeVisible();
    });

    test('can add planning items while event is posted', async ({page}) => {
        await setupPlanningPublishing(page.request);
        await addItems(
            page.request,
            'events',
            [createEventFor.today({
                type: 'event',
                occur_status: {
                    name: 'Planned, occurs certainly',
                    label: 'Confirmed',
                    qcode: 'eocstat:eos5',
                },
                calendars: [],
                state: 'draft',
                place: [],
                name: 'Posted Event',
                slugline: 'posted event with related planning',
            })]
        );

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        // Post the event while keeping the editor open
        await editor.postButton.click();
        await editor.waitLoadingComplete();

        // The editor must stay editable after posting in place
        await expect(editor.updateButton).toBeVisible();

        // Adding a related planning item to the still-open, posted event
        // must keep the editor editable and render the new planning item
        // (previously the editor incorrectly flipped to read-only).
        await editor.clickBookmark('add_planning');
        await editor.waitForAutosave();

        await expect(embeddedCoverages.getPlanningItem(0)).toBeVisible();
        await expect(editor.updateButton).toBeVisible();

        // A posted event is saved via the "Update" button (Save & Post),
        // not the "Save" button which only exists for drafts.
        await editor.updateButton.click();
        await editor.waitLoadingComplete();

        await editor.closeButton.click();
        await editor.waitTillClosed();

        await list.toggleAssociatedPlanning(0);
        await expect(list.nestedPlanningItems(0)).toHaveCount(1);
    });

    // TODO: consider re-enabling in the future when event syncing is reimplemented
    test.skip('update new Planning when event dates changes', async () => {
        await subnav.createEvent();
        await editor.waitTillOpen();
        await editor.openAllToggleBoxes();

        // Fill in some fields (excluding date/times)
        await editor.type({
            'dates.start.date': moment().format(CLIENT_FORMAT),
            slugline: 'slugline of the event',
            name: 'name of the event',
            definition_short: 'Desc.',
            occur_status: 'Planned, occurence planned only',
        });

        // Add a Planning item to the Event
        await editor.waitForAutosave();
        await editor.createButton.click();

        // wait for item to save and create button to disappear
        await expect(editor.createButton).not.toBeAttached();

        await editor.clickBookmark('add_planning');
        await expect(editor.element.getByTestId('editor--planning-item__0')).toBeVisible();

        await expect(embeddedCoverages.getAddCoverageForm(0)).toBeVisible();

        // Attempt to create the Event & Planning item
        // knowing that it will error out
        await editor.waitForAutosave();
        await editor.createButton.click();

        // Make sure validation failed
        await editor.fields.dates.start.date.expectError('This field is required');
        await expect(editor.createButton).toBeEnabled();

        const now = moment();

        // Fill in the dates (which should also update the Planning/Coverage dates)
        await editor.type({
            'dates.start.date': now.format(CLIENT_FORMAT),
        });

        // Make sure the date has been updated for the Coverage
        await expect(
            embeddedCoverages.getRelatedCoverage(0, 0)
        ).toContainText(`${now.format(CLIENT_FORMAT)} @ 00:00`);

        // Now create the Event & Planning item
        await editor.waitForAutosave();
        await editor.createButton.click();

        // Make sure the item is created
        await expect(editor.createButton).not.toBeAttached()
        await expect(editor.postButton).toBeEnabled();
        await list.expectItemCount(2);
        await list.expectItemText(0, 'slugline of the event');

        // Make sure the Text coverage was created as well
        await list.toggleAssociatedPlanning(0);
        await expect(list.nestedItem(0).getByTestId('coverage-icons')).toBeVisible();
        await expect(
            list.nestedPlanningItem(0, 0)
                .getByTestId('coverage-icons')
                .locator('.icon-text')
        ).toBeVisible();
    });
});
