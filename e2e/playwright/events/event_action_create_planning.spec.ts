import {test, expect} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad, CLIENT_FORMAT, ActionMenu} from '../utils/common';
import {PlanningList, PlanningPreview, EventEditor, PlanningEditor} from '../page-object-models/planning';
import {TIMEZONE} from '../utils/time';
import moment from "moment-timezone";

test.describe('Planning.Events: create planning action', () => {
    let editors: {
        event: EventEditor,
        planning: PlanningEditor,
    };

    let list: PlanningList;
    let preview: PlanningPreview;
    let menu: ActionMenu;

    const start = moment();

    const expectedValues = {
        slugline: 'Original',
        'planning_date.date': start.format(CLIENT_FORMAT),
        'planning_date.time': start.format('HH:mm'),
        description_text: 'Desc.',
        ednote: 'Ed. Note',
        anpa_category: ['Finance'],
        subject: ['sports awards'],
    };

    test.beforeEach(async ({page}) => {
        editors = {
            event: new EventEditor(page),
            planning: new PlanningEditor(page),
        };

        list = new PlanningList(page);
        preview = new PlanningPreview(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(
            page.request,
            'events',
            [{
                slugline: 'Original',
                name: 'Original',
                definition_short: 'Desc.',
                occur_status: {
                    name: 'Planned, occurs certainly',
                    label: 'Confirmed',
                    qcode: 'eocstat:eos5',
                },
                dates: {
                    start: start.utc().format('YYYY-MM-DDTHH:mm:ss+0000'),
                    end: start.clone().utc()
                        .add(1, 'h')
                        .format('YYYY-MM-DDTHH:mm:ss+0000'),
                    tz: TIMEZONE,
                },
                anpa_category: [{is_active: true, name: 'Finance', qcode: 'f', subject: '04000000'}],
                subject: [{parent: '15000000', name: 'sports awards', qcode: '15103000'}],
                ednote: 'Ed. Note',
            }]
        );

        await login(page);
        await waitForPageLoad.planning(page);
    });

    async function expectListItemText() {
        await expect(
            list.nestedItem(0).locator('.sd-line-input__input--related-item-link')
        ).toContainText('Show 1 planning item');

        await list.toggleAssociatedPlanning(0);

        await expect(
            list.nestedItem(0).locator('.sd-line-input__input--related-item-link')
        ).toContainText('Hide 1 planning item');
    }

    async function expectEditorValues() {
        await editors.planning.waitTillOpen();
        await editors.planning.waitLoadingComplete();
        await editors.planning.openAllToggleBoxes();
        await editors.planning.expect(expectedValues);
    }

    async function canEditPlanningAfterwards() {
        // Test that we can edit the Planning item
        await editors.planning.type({
            internal_note: 'Created from Event',
        });

        // Test that we can save the Planning item
        await editors.planning.waitForAutosave();
        await editors.planning.saveButton.click();

        await editors.planning.closeButton.click();
        await editors.planning.waitTillClosed();
    }

    async function doubleClickPlanningItem() {
        await list.nestedPlanningItems(0).first().dblclick();
    }

    async function createFromPreview(open: boolean) {
        await list.item(0).click();

        menu = preview.actionMenu;
        await menu.open();
        await menu.getAction(open ?
            'Create and Open Planning Item' :
            'Create Planning Item'
        )
            .click();
    }

    async function createFromEditor(open: boolean) {
        await list.item(0).dblclick();

        await editors.event.waitTillOpen();
        await editors.event.waitLoadingComplete();

        menu = editors.planning.actionMenu;
        await menu.open();
        await menu.getAction(open ?
            'Create and Open Planning Item' :
            'Create Planning Item'
        )
            .click();
    }

    test('can create from the list', {
        annotation: [
            {type: 'confluence', description: '1311835139 complete'}, // Create planning item from event
        ],
    }, async () => {
        await list.clickAction(0, 'Create Planning Item');
        await expectListItemText();
        await doubleClickPlanningItem();
        await expectEditorValues();
        await canEditPlanningAfterwards();
    });

    test('can create and open from the list', {
        annotation: [
            {type: 'confluence', description: '1311835141 complete'}, // Create and open planning item from event
        ],
    }, async () => {
        await list.clickAction(0, 'Create and Open Planning Item');
        await expectEditorValues();
        await expectListItemText();
        await canEditPlanningAfterwards();
    });

    test('can create from preview', async () => {
        await createFromPreview(false);
        await expectListItemText();
        await doubleClickPlanningItem();
        await expectEditorValues();
        await canEditPlanningAfterwards();
    });

    test('can create and open from preview', async () => {
        await createFromPreview(true);
        await expectEditorValues();
        await expectListItemText();
        await canEditPlanningAfterwards();
    });

    test('can create from the editor', async () => {
        await createFromEditor(false);
        await editors.planning.closeButton.click();
        await editors.planning.waitTillClosed();
        await expectListItemText();
        await doubleClickPlanningItem();
        await expectEditorValues();
        await canEditPlanningAfterwards();
    });

    test('can create and open from the editor', async () => {
        await createFromEditor(true);
        await expectListItemText();
        await expectEditorValues();
        await canEditPlanningAfterwards();
    });
});
