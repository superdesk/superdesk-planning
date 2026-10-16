import {expect, Page, test} from '@playwright/test';

import {addItems, baseBackendUrl, login, setup, waitForPageLoad} from '../utils/common';
import {createPlanningFor} from '../utils/fixtures/planning';
import {AddToPlanningModal, ArticleAuthoring, Monitoring} from '../page-object-models/planning';

interface Article {
    _id: string;
    assignment_id?: string;
    lock_user?: string | null;
    lock_session?: string | null;
}

interface Desk {
    _id: string;
    name: string;
    incoming_stage: string;
}

interface Planning {
    lock_user?: string | null;
    lock_session?: string | null;
    coverages: Array<{
        planning: {slugline: string};
        assigned_to: {assignment_id: string};
    }>;
}

test.describe('Planning.Add to Planning: link two articles to separate coverages', () => {
    const PLANNING_ID = 'planning-for-two-articles';
    const PLANNING = 'Planning for articles One and Two';

    let monitoring: Monitoring;
    let authoring: ArticleAuthoring;
    let modal: AddToPlanningModal;
    let articles: Article[];

    async function getArticle(page: Page, article: Article): Promise<Article> {
        const response = await page.request.get(
            `${baseBackendUrl}/archive/${encodeURIComponent(article._id)}`,
            {failOnStatusCode: true},
        );

        return response.json();
    }

    async function getPlanning(page: Page): Promise<Planning> {
        const response = await page.request.get(`${baseBackendUrl}/planning/${PLANNING_ID}`, {
            failOnStatusCode: true,
        });

        return response.json();
    }

    test.beforeEach(async ({page}) => {
        monitoring = new Monitoring(page);
        authoring = new ArticleAuthoring(page);
        modal = new AddToPlanningModal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'planning', [
            createPlanningFor.today({_id: PLANNING_ID, slugline: PLANNING}),
        ]);
        await login(page);
        await waitForPageLoad.planning(page);

        const response = await page.request.get(`${baseBackendUrl}/desks`, {failOnStatusCode: true});
        const desks: Desk[] = (await response.json())._items;
        const desk = desks.find((item) => item.name === 'Master Desk') ?? desks[0];

        if (desk == null) {
            throw new Error('The planning prepopulate profile must include a desk');
        }

        articles = [];
        for (const headline of ['One', 'Two', 'Three']) {
            const articleResponse = await page.request.post(`${baseBackendUrl}/archive`, {
                failOnStatusCode: true,
                data: {
                    guid: `failed-planning-save-${headline.toLowerCase()}`,
                    type: 'text',
                    state: 'draft',
                    headline,
                    slugline: headline,
                    abstract: 'Article for the separate planning coverage regression.',
                    task: {desk: desk._id, stage: desk.incoming_stage},
                },
            });

            articles.push(await articleResponse.json());
        }

        await page.goto('/#/workspace/monitoring');
        await monitoring.waitUntilReady();
        await monitoring.selectDesk(desk.name);
    });

    test('links each article to its own coverage without errors and releases locks', async ({page}) => {
        await monitoring.openArticle('One');
        await authoring.addToPlanning();
        await modal.waitTillOpen();
        await modal.addAsCoverage(PLANNING);
        await expect.poll(async () => (await getArticle(page, articles[0])).assignment_id).toBeTruthy();

        const firstAssignment = (await getArticle(page, articles[0])).assignment_id;

        await authoring.close();
        await monitoring.openArticle('Two');
        await authoring.addToPlanning();
        await modal.waitTillOpen();
        await modal.addAsCoverage(PLANNING);
        await expect.poll(async () => (await getArticle(page, articles[1])).assignment_id).toBeTruthy();

        const secondAssignment = (await getArticle(page, articles[1])).assignment_id;

        expect(secondAssignment).not.toBe(firstAssignment);
        await expect(page.getByTestId('notification--error')).toHaveCount(0);
        await expect(authoring.actionsButton).toBeEnabled();
        await expect.poll(async () => {
            const planning = await getPlanning(page);

            return {
                planningLocked: Boolean(planning.lock_user || planning.lock_session),
                coverages: planning.coverages.map((coverage) => ({
                    slugline: coverage.planning.slugline,
                    assignment: coverage.assigned_to.assignment_id,
                })),
            };
        }).toEqual({
            planningLocked: false,
            coverages: [
                {slugline: 'One', assignment: firstAssignment},
                {slugline: 'Two', assignment: secondAssignment},
            ],
        });

        await authoring.close();
        await monitoring.openArticle('Three');
        await authoring.addToPlanning();
        await modal.waitTillOpen();
        await modal.previewPlanningItem(PLANNING);
        await expect(modal.preview.coverageCards).toHaveCount(2);
        await modal.dismiss();
        await authoring.close();

        await expect.poll(async () => {
            const planning = await getPlanning(page);
            const one = await getArticle(page, articles[0]);
            const two = await getArticle(page, articles[1]);

            return {
                oneAssignment: one.assignment_id,
                twoAssignment: two.assignment_id ?? null,
                articleLocked: Boolean(two.lock_user || two.lock_session),
                firstArticleLocked: Boolean(one.lock_user || one.lock_session),
                planningLocked: Boolean(planning.lock_user || planning.lock_session),
            };
        }).toEqual({
            oneAssignment: firstAssignment,
            twoAssignment: secondAssignment,
            articleLocked: false,
            firstArticleLocked: false,
            planningLocked: false,
        });
    });
});
