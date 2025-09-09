from .flag_expired_items import flag_expired_items_handler  # noqa
from .delete_spiked_items import delete_spiked_items_handler  # noqa
from .delete_marked_assignments import DeleteMarkedAssignments  # noqa
from .export_to_newsroom import ExportToNewsroom  # noqa
from .export_scheduled_filters import ExportScheduledFilters  # noqa
from .purge_expired_locks import purge_expired_locks_handler  # noqa
from .replace_deprecated_event_item_attribute import ReplaceDeprecatedEventItemAttributeCommand  # noqa
from .async_cli import planning_cli, commands_blueprint  # noqa


def configure_cli(app) -> None:
    """
    Sets the current app instance into the `AsyncAppGroup` to later be passed as context of the commands.
    It also registers the commands blueprint
    """

    app.register_blueprint(commands_blueprint)
