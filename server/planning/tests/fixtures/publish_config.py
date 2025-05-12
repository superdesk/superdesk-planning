from bson import ObjectId

from superdesk.tests import utils as test_utils


def filter_conditions() -> dict[str, dict]:
    return dict(
        events=dict(
            _id=ObjectId("181c3d1ed5f6a3c287de2f80"),
            name="All Events",
            field="type",
            operator="eq",
            value="event",
        ),
        planning=dict(
            _id=ObjectId("181c3d1ed5f6a3c287de2f81"),
            name="All Planning",
            field="type",
            operator="eq",
            value="planning",
        ),
        planning_featured=dict(
            _id=ObjectId("181c3d1ed5f6a3c287de2f82"),
            name="Featured Planning",
            field="type",
            operator="eq",
            value="planning_featured",
        ),
    )


def content_filters() -> dict[str, dict]:
    fcs = filter_conditions()

    return dict(
        events=dict(
            _id=ObjectId("281c3d1ed5f6a3c287de2f80"),
            name="Event Content Filter",
            content_filter=[{"expression": {"fc": [fcs["events"]["_id"]]}}],
        ),
        planning=dict(
            _id=ObjectId("281c3d1ed5f6a3c287de2f81"),
            name="Planning Content Filter",
            content_filter=[{"expression": {"fc": [fcs["planning"]["_id"]]}}],
        ),
        featured_planning=dict(
            _id=ObjectId("281c3d1ed5f6a3c287de2f82"),
            name="Featured Planning Content Filter",
            content_filter=[{"expression": {"fc": [fcs["planning_featured"]["_id"]]}}],
        ),
    )


def products() -> dict[str, dict]:
    cfs = content_filters()

    return dict(
        events=dict(
            _id=ObjectId("381c3d1ed5f6a3c287de2f80"),
            name="Event Publish Product",
            product_type="both",
            content_filter={
                "filter_id": cfs["events"]["_id"],
                "filter_type": "permitting",
            },
        ),
        planning=dict(
            _id=ObjectId("381c3d1ed5f6a3c287de2f81"),
            name="Planning Publish Product",
            product_type="both",
            content_filter={
                "filter_id": cfs["planning"]["_id"],
                "filter_type": "permitting",
            },
        ),
        featured_planning=dict(
            _id=ObjectId("381c3d1ed5f6a3c287de2f82"),
            name="Featured Planning Publish Product",
            product_type="both",
            content_filter={
                "filter_id": cfs["featured_planning"]["_id"],
                "filter_type": "permitting",
            },
        ),
    )


def subscribers() -> dict[str, dict]:
    pds = products()

    return dict(
        events=dict(
            _id=ObjectId("481c3d1ed5f6a3c287de2f80"),
            name="Event Subscribers",
            email="test@test.com",
            is_active=True,
            subscriber_type="all",
            products=[pds["events"]["_id"]],
            destinations=[
                {
                    "name": "Event files",
                    "format": "json_event",
                    "delivery_type": "File",
                    "config": {"file_path": "/tmp/", "file_extension": "json"},
                }
            ],
        ),
        planning=dict(
            _id=ObjectId("481c3d1ed5f6a3c287de2f81"),
            name="Planning Subscribers",
            email="test@test.com",
            is_active=True,
            subscriber_type="all",
            products=[pds["planning"]["_id"]],
            destinations=[
                {
                    "name": "Planning files",
                    "format": "json_planning",
                    "delivery_type": "File",
                    "config": {"file_path": "/tmp/", "file_extension": "json"},
                }
            ],
        ),
        featured_planning=dict(
            _id=ObjectId("481c3d1ed5f6a3c287de2f82"),
            name="Featured Planning Subscribers",
            email="test@test.com",
            is_active=True,
            subscriber_type="all",
            products=[pds["featured_planning"]["_id"]],
            destinations=[
                {
                    "name": "Featured Planning files",
                    "format": "json_planning_featured",
                    "delivery_type": "File",
                    "config": {"file_path": "/tmp/", "file_extension": "json"},
                }
            ],
        ),
    )


async def configure_planning_publishing() -> None:
    await test_utils.post_items("filter_conditions", list(filter_conditions().values()))
    await test_utils.post_items("content_filters", list(content_filters().values()))
    await test_utils.post_items("products", list(products().values()))
    await test_utils.post_items("subscribers", list(subscribers().values()))
