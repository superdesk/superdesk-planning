import pytz

from datetime import timedelta, datetime

from . import utils


def test_parse_duration():
    assert timedelta(days=3) == utils.parse_duration("P3D")
    assert timedelta(hours=10, minutes=22, seconds=33) == utils.parse_duration("PT10H22M33S")
    assert timedelta(days=3, minutes=10) == utils.parse_duration("P3DT10M")


def test_parse_date_no_tz():
    assert datetime(2022, 10, 11, tzinfo=pytz.utc) == utils.parse_date_utc("2022-10-11")
