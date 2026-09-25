from datetime import timedelta

from superdesk.utc import utcnow

from planning.types import UnifiedPlanningResource, PlanningItemType, ItemDates, RecurringFrequency, ItemRecurringDates


def daily_series() -> UnifiedPlanningResource:
    start = utcnow() - timedelta(days=2)
    return UnifiedPlanningResource(
        item_type=PlanningItemType.EVENT,
        slugline="event",
        name="Recurring Event",
        dates=ItemDates(
            start=start,
            end=start + timedelta(hours=4),
            recurring_rule=ItemRecurringDates(frequency=RecurringFrequency.DAILY, count=10),
        ),
    )


def all_recurring_items() -> list[UnifiedPlanningResource]:
    return [daily_series()]
