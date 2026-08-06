from bson import ObjectId

from superdesk import get_resource_service

from planning.types.unified import UnifiedPlanningResource, PlanningItemType


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
    if item_type == PlanningItemType.EVENT:
        files_service = get_resource_service("events_files")
    else:
        files_service = get_resource_service("planning_files")

    for file_id in files_to_delete:
        events_using_file = await resource_service.count({"files": file_id}, use_mongo=True)
        if events_using_file == 0:
            await files_service.delete_action_async(lookup={"_id": file_id})
