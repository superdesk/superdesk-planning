from typing import Any

from apps.auth import get_user_id
from superdesk.notification import push_notification
from planning.core import BasePlanningAsyncService
from planning.types import EventPlanningFilter


def connect_signals_listeners() -> None:
    """
    Register listeners for the EventsPlanningFilter data signals.
    They simply send a push notification when either a new filter is created, updated or deleted.
    """

    data_signals = EventPlanningFilter.get_signals().data

    def connect_notification(event_type):
        # on_created, on_updated, on_deleted
        signal = getattr(data_signals, f"on_{event_type}")

        signal.connect(
            lambda doc, _=None: push_notification(
                f"event_planning_filters:{event_type}",
                item=str(doc.id),
                user=str(get_user_id()),
            )
        )

    connect_notification("created")
    connect_notification("updated")
    connect_notification("deleted")


class EventsPlanningFiltersAsyncService(BasePlanningAsyncService[EventPlanningFilter]):
    resource_name = "events_planning_filters"

    async def create(self, docs: list[dict[str, Any]]) -> list[EventPlanningFilter]:
        """
        Set the schedules values before creating the filter and pydantic model
        """
        for doc in docs:
            self.set_schedule(doc)

        return await super().create(docs)

    async def on_update(self, updates: dict[str, Any], original: EventPlanningFilter) -> None:
        self.set_schedule(updates)

        await super().on_update(updates, original)

    def set_schedule(self, updates: dict[str, Any]) -> None:
        if not len(updates.get("schedules") or []):
            return

        for schedule in updates["schedules"]:
            hour = schedule.get("hour", -1)
            day = schedule.get("day", -1)
            week_days = schedule.get("week_days") or []
            frequency = schedule.get("frequency") or "hourly"

            if frequency == "hourly":
                schedule.update(
                    {
                        "frequency": "hourly",
                        "hours": [],
                        "hour": -1,
                        "day": -1,
                        "week_days": [],
                    }
                )
            elif frequency == "daily":
                schedule.update(
                    {
                        "frequency": "daily",
                        "hours": schedule.get("hours", []),
                        "hour": hour,
                        "day": -1,
                        "week_days": [],
                    }
                )
            elif frequency == "weekly":
                schedule.update(
                    {
                        "frequency": "weekly",
                        "hours": schedule.get("hours", []),
                        "hour": hour,
                        "day": -1,
                        "week_days": week_days,
                    }
                )
            elif frequency == "monthly":
                schedule.update(
                    {
                        "frequency": "monthly",
                        "hours": schedule.get("hours", []),
                        "hour": hour,
                        "day": day,
                        "week_days": [],
                    }
                )
