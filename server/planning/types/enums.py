from enum import Enum, unique


@unique
class WorkflowState(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INGESTED = "ingested"
    SCHEDULED = "scheduled"
    KILLED = "killed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    POSTPONED = "postponed"
    SPIKED = "spiked"


@unique
class AssignmentWorkflowState(str, Enum):
    DRAFT = "draft"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SUBMITTED = "submitted"
    CANCELLED = "cancelled"


@unique
class PostStates(str, Enum):
    USABLE = "usable"
    CANCELLED = "cancelled"


@unique
class UpdateMethods(str, Enum):
    SINGLE = "single"
    FUTURE = "future"
    ALL = "all"


@unique
class ContentState(str, Enum):
    DRAFT = "draft"
    INGESTED = "ingested"
    ROUTED = "routed"
    FETCHED = "fetched"
    SUBMITTED = "submitted"
    IN_PROGRESS = "in_progress"
    SPIKED = "spiked"
    PUBLISHED = "published"
    KILLED = "killed"
    CORRECTED = "corrected"
    SCHEDULED = "scheduled"
    RECALLED = "recalled"
    UNPUBLISHED = "unpublished"
    CORRECTION = "correction"
    BEING_CORRECTED = "being_corrected"


@unique
class AssignmentPublishedState(str, Enum):
    # TODO-ASYNC: double check the states later as needed. These are the ones found in the code for now
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    KILLED = "killed"
    RECALLED = "recalled"
    CORRECTED = "corrected"


@unique
class LinkType(str, Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
