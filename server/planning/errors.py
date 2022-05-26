import logging
logger = logging.getLogger(__name__)


class AssignmentApiError(Exception):
    """Base class for Assignment API."""

    #: error status code
    status_code = 400

    def __init__(self, message=None, status_code=None, payload=None, exception=None):
        Exception.__init__(self)

        #: a human readable error description
        self.message = message

        if status_code:
            self.status_code = status_code

        if payload:
            self.payload = payload

        if exception:
            logger.exception(message or exception)
        elif message:
            logger.error("HTTP Exception {} has been raised: {}".format(status_code, message))

    def __str__(self):
        return "{}: {}".format(repr(self.status_code), self.message)

    @classmethod
    def cannotDeleteAssignmentError(cls, message=None, payload=None, exception=None):
        return AssignmentApiError(status_code=400, message=message, payload=payload, exception=exception)
