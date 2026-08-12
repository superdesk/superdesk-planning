import logging

from bson import ObjectId

from planning.types import AssignmentResourceModel

__all__ = ["get_assignment_from_content_dict"]
logger = logging.getLogger(__name__)


async def get_assignment_from_content_dict(content: dict) -> AssignmentResourceModel | None:
    assignment_id: ObjectId | None = content.get("assignment_id")
    if not assignment_id:
        return None

    assignment = await AssignmentResourceModel.get_service().find_by_id(assignment_id)
    if not assignment:
        logger.error(
            "Failed to get assignment from content item",
            extra=dict(
                content_id=content.get("_id"),
                assignment_id=assignment_id,
            ),
        )
        return None

    return assignment
