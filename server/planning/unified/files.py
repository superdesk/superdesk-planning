from bson import ObjectId

from superdesk import get_resource_service

from planning.types.unified import UnifiedPlanningResource, PlanningItemType


def _files_still_referenced_query(file_id: ObjectId | str) -> dict:
    """A file may be referenced directly by an item (``files``) or by a Coverage
    (``coverages.planning.files`` / ``xmp_file``). Events & Planning now share the
    single unified resource, so one query covers both item types.
    """

    return {
        "$or": [
            {"files": file_id},
            {"coverages.planning.files": file_id},
            {"coverages.planning.xmp_file": file_id},
        ],
    }


async def delete_item_files(
    item_type: PlanningItemType,
    original_files: list[ObjectId | str] | None,
    updated_files: list[ObjectId | str] | None = None,
) -> None:
    files_to_delete: list[ObjectId | str]
    original_files = original_files or []
    if not updated_files:
        files_to_delete = original_files
    else:
        files_to_delete = [file_id for file_id in original_files if file_id not in updated_files]

    if not files_to_delete:
        return

    resource_service = UnifiedPlanningResource.get_service()
    # Both endpoints share the single ``events_files`` collection now.
    files_service = get_resource_service("events_files")

    for file_id in files_to_delete:
        items_using_file = await resource_service.count(_files_still_referenced_query(file_id), use_mongo=True)
        if items_using_file == 0:
            await files_service.delete_action_async(lookup={"_id": file_id})
