import {expect} from '@playwright/test';
import type {Locator} from '@playwright/test';

import {PlanningEditor} from './planningEditor';

export class EmbeddedEventEditor {
    editor: PlanningEditor;

    constructor(editor: PlanningEditor) {
        this.editor = editor;
    }

    get element(): Locator {
        return this.editor.element;
    }

    getEventItem(index: number): Locator {
        return this.element.getByTestId(`editor--event-item__${index}`);
    }

    // An embedded event renders collapsed with its fields present but not
    // interactable; expand it before touching any field. The editor can
    // remount the card while it finishes loading, collapsing it again, so
    // retry until the expanded state sticks and the embedded form is reachable.
    async expand(index: number): Promise<void> {
        const eventItem = this.getEventItem(index);
        const toggle = eventItem.getByRole('button', {name: /Show (more|less)/});

        await toggle.waitFor({state: 'visible'});

        await expect(async () => {
            // A DOM-level click: the toggle animates on state change, which makes
            // pointer clicks unstable for Playwright
            await eventItem.evaluate((el) => {
                const divider = el.querySelector<HTMLElement>('.new-collapse-box__divider');

                if (divider?.textContent?.includes('Show more')) {
                    divider.click();
                }
            });

            await expect(eventItem.getByRole('button', {name: 'Show less'})).toBeVisible({timeout: 2000});
            await expect(eventItem.getByRole('button', {name: 'Save', exact: true})).toBeVisible({timeout: 2000});
        }).toPass({timeout: 30000});
    }

    field(index: number, fieldId: string): Locator {
        return this.getEventItem(index)
            .locator(`[data-test-id="authoring-field"][data-test-value="${fieldId}"]`);
    }

    name(index: number): Locator {
        return this.field(index, 'name').locator('[contenteditable="true"]').first();
    }

    // Drives the field via focus and keyboard: the collapse box header is
    // sticky and intercepts pointer clicks on fields that land underneath it
    async setName(index: number, text: string): Promise<void> {
        await this.expand(index);

        const field = this.name(index);
        const keyboard = field.page().keyboard;

        await field.focus();
        await keyboard.press('ControlOrMeta+a');
        await keyboard.type(text);
    }

    async save(index: number): Promise<void> {
        const eventItem = this.getEventItem(index);

        // The box can re-collapse while fields are being edited (the form stays
        // mounted and keeps the changes); make sure the Save button is visible
        await this.expand(index);

        await eventItem.getByRole('button', {name: 'Save', exact: true}).first().click();

        // Done once no enabled Save button remains: a successful save greys it out
        await expect(eventItem.locator('button:enabled', {hasText: 'Save'})).toHaveCount(0, {timeout: 20000});
    }
}
