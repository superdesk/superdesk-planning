from bson import ObjectId
from bson.errors import InvalidId

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.planning_article_export import (
    get_items,
    export_items_to_article,
    export_events_to_text,
    ArticleExportRequest,
)
from planning.tests import TestCase, fixtures as planning_fixtures


COVERAGE_STATUS = {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}


class ArticleExportTestCase(TestCase):
    """Exporting Event & Planning items as an Article from the unified resource"""

    app_config = {
        **TestCase.app_config.copy(),
        "ELASTICSEARCH_FORCE_REFRESH": True,
    }

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("users", fixtures.users.all_users())
        admin = fixtures.users.admin().to_dict()
        admin["_id"] = ObjectId()
        admin["username"] = "export_tester"
        admin["email"] = "export_tester@example.org"
        await test_utils.post_items("users", [admin])
        g.user = admin
        g.auth = {"_id": ObjectId(), "user": g.user["_id"]}
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())

        self.content_template_id = ObjectId()
        await test_utils.post_items(
            "content_templates",
            [
                {
                    "_id": self.content_template_id,
                    "template_name": "Planning export",
                    "template_type": "planning_export",
                    "data": {"slugline": "Foo"},
                }
            ],
        )
        self.desk_id = ObjectId()
        self.plain_desk_id = ObjectId()
        await test_utils.post_items(
            "desks",
            [
                {"_id": self.desk_id, "name": "Sports", "default_content_template": self.content_template_id},
                {"_id": self.plain_desk_id, "name": "Plain"},
            ],
        )
        self.desk = await get_resource_service("desks").find_one_async(req=None, _id=self.desk_id)

    # helpers
    def _coverage(self, content_type: str) -> dict:
        return {
            "coverage_id": str(ObjectId()),
            "original_creator": g.user["_id"],
            "workflow_status": "draft",
            "news_coverage_status": COVERAGE_STATUS,
            "planning": {"g2_content_type": content_type, "slugline": "story"},
        }

    async def _create_event(self, **overrides) -> str:
        data = dict(
            type=PlanningItemType.EVENT,
            name="Test Event",
            dates={"start": "2026-06-30T15:30:55+0000", "end": "2026-06-30T17:30:55+0000", "tz": "UTC"},
        )
        data.update(overrides)
        return (await self.service.create([UnifiedPlanningResource.from_dict(data)]))[0].id

    async def _create_planning(self, **overrides) -> str:
        data = dict(
            type=PlanningItemType.PLANNING,
            headline="Test Planning",
            slugline="test-planning",
            dates={"start": "2026-06-30T15:30:55+0000"},
        )
        data.update(overrides)
        return (await self.service.create([UnifiedPlanningResource.from_dict(data)]))[0].id

    async def test_get_items_preserves_supplied_order(self):
        plan_ids = [await self._create_planning(headline=f"Planning {i}") for i in range(3)]
        event_ids = [await self._create_event(name=f"Event {i}") for i in range(3)]

        for ids, item_type in (
            (plan_ids, "planning"),
            (list(reversed(plan_ids)), "planning"),
            (event_ids, "event"),
            (list(reversed(event_ids)), "event"),
            ([event_ids[1], plan_ids[2], event_ids[0], plan_ids[0]], "combined"),
        ):
            items = await get_items(ids, item_type)
            self.assertEqual(ids, [item["_id"] for item in items])

    async def test_get_items_scopes_by_type(self):
        event_id = await self._create_event()
        plan_id = await self._create_planning()
        ids = [event_id, plan_id]

        self.assertEqual([plan_id], [item["_id"] for item in await get_items(ids, "planning")])
        self.assertEqual([event_id], [item["_id"] for item in await get_items(ids, "event")])
        # legacy search repo name used by the download endpoint
        self.assertEqual([event_id], [item["_id"] for item in await get_items(ids, "events")])
        self.assertEqual(ids, [item["_id"] for item in await get_items(ids, "combined")])

    async def test_get_items_embeds_related_items_from_unified_resource(self):
        event_id = await self._create_event(name="Linked Event")
        plan_id = await self._create_planning(
            related_events=[{"_id": event_id, "link_type": "primary"}],
            coverages=[self._coverage("text"), self._coverage("picture")],
        )
        # unrelated planning items are not part of the event export
        await self._create_planning(coverages=[self._coverage("video")])

        (planning,) = await get_items([plan_id], "planning")
        self.assertEqual(event_id, planning["event"]["_id"])
        self.assertEqual("Linked Event", planning["event"]["name"])

        (event,) = await get_items([event_id], "event")
        self.assertEqual([plan_id], [plan["_id"] for plan in event["plannings"]])
        self.assertEqual(
            ["text", "picture"],
            [coverage["planning"]["g2_content_type"] for coverage in event["coverages"]],
        )

    async def test_export_creates_archive_item_on_desk(self):
        event_id = await self._create_event(name="Big Match")
        plan_id = await self._create_planning(
            headline="Match Report",
            definition_long="Who won",
            related_events=[{"_id": event_id, "link_type": "primary"}],
            coverages=[self._coverage("text"), self._coverage("picture")],
        )

        item = await export_items_to_article(
            ArticleExportRequest(items=[event_id, plan_id], desk=str(self.desk_id), type="combined")
        )

        self.assertEqual("text", item["type"])
        self.assertEqual("Foo", item["slugline"])
        self.assertEqual(self.desk_id, item["task"]["desk"])
        self.assertEqual(self.desk["working_stage"], item["task"]["stage"])
        self.assertIn("<h2>Events</h2>", item["body_html"])
        self.assertIn("<b>Big Match</b>", item["body_html"])
        self.assertIn("<b>Match Report</b>", item["body_html"])
        # unified ``definition_long`` is exposed to templates as ``description_text``
        self.assertIn("<p>Who won</p>", item["body_html"])
        # coverage labels rendered for the Event (via its related Planning) and the Planning itself
        self.assertEqual(2, item["body_html"].count("Text, Picture"))

        archived = await get_resource_service("archive").find_one_async(req=None, _id=item["_id"])
        self.assertIsNotNone(archived)
        self.assertEqual("Foo", archived["slugline"])

    async def test_export_default_sluglines_per_type(self):
        event_id = await self._create_event()
        plan_id = await self._create_planning()

        for item_type, ids, slugline in (
            ("planning", [plan_id], "Planning"),
            ("event", [event_id], "Event"),
            ("combined", [event_id, plan_id], "Events and Planning"),
        ):
            item = await export_items_to_article(
                ArticleExportRequest(items=ids, desk=str(self.plain_desk_id), type=item_type)
            )
            self.assertEqual(slugline, item["slugline"])

    async def test_export_uses_article_template_over_desk_template(self):
        plan_id = await self._create_planning()
        template_id = ObjectId()
        await test_utils.post_items(
            "content_templates",
            [
                {
                    "_id": template_id,
                    "template_name": "editor_template",
                    "template_type": "editor_template",
                    "data": {"slugline": "Bar", "body_html": "<p>Intro</p><p>{{content}}</p>"},
                }
            ],
        )

        item = await export_items_to_article(
            ArticleExportRequest(items=[plan_id], desk=str(self.desk_id), article_template=str(template_id))
        )

        self.assertEqual("Bar", item["slugline"])
        self.assertTrue(item["body_html"].startswith("<p>Intro</p>"))
        self.assertIn("<b>Test Planning</b>", item["body_html"])

    def test_export_request_validation(self):
        request = ArticleExportRequest.model_validate({"items": ["a"]})
        self.assertEqual("planning", request.type)
        self.assertIsNone(request.desk)

        with self.assertRaises(ValueError):
            ArticleExportRequest.model_validate({"template": "missing-items"})
        with self.assertRaises(ValueError):
            ArticleExportRequest.model_validate({"items": ["a"], "type": "assignment"})
        # core's ``fields.ObjectId`` surfaces malformed ids as bson's InvalidId (the endpoint maps it to a 400)
        with self.assertRaises(InvalidId):
            ArticleExportRequest.model_validate({"items": ["a"], "desk": "not-an-object-id"})

        # ObjectId fields accept both bson ObjectIds (internal callers) and their string form (HTTP)
        desk_id = ObjectId()
        self.assertEqual(desk_id, ArticleExportRequest(items=["a"], desk=desk_id).desk)
        self.assertEqual(desk_id, ArticleExportRequest.model_validate({"items": ["a"], "desk": str(desk_id)}).desk)

    async def test_export_rejects_unknown_desk_and_article_template(self):
        plan_id = await self._create_planning()

        with self.assertRaises(SuperdeskApiError) as context:
            await export_items_to_article(ArticleExportRequest(items=[plan_id], desk=ObjectId()))
        self.assertEqual(400, context.exception.status_code)

        with self.assertRaises(SuperdeskApiError) as context:
            await export_items_to_article(
                ArticleExportRequest(items=[plan_id], desk=self.desk_id, article_template=ObjectId())
            )
        self.assertEqual(400, context.exception.status_code)

        self.assertIsNone(await get_resource_service("archive").find_one_async(req=None, type="text"))

    async def test_export_events_to_text(self):
        event_id = await self._create_event(name="Downloaded Event")
        items = await get_items([event_id], "events")

        exported = await export_events_to_text(items, template="event_download_default.html", tz_offset="3600")

        self.assertIsInstance(exported, bytes)
        self.assertIn(b"Downloaded Event", exported)
