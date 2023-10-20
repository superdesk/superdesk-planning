FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive 

RUN apt-get update && apt-get install -y --no-install-recommends \
python3 python3-dev python3-pip python3-venv git gcc curl \
# lxml
libxml2-dev libxslt-dev \
# PIL
libjpeg-dev zlib1g-dev \
# magic
libmagic-dev \
&& rm -rf /var/lib/apt/lists/* 

# setup venv
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ENV PYTHONUNBUFFERED=1
ENV C_FORCE_ROOT=False
ENV CELERYBEAT_SCHEDULE_FILENAME=/tmp/celerybeatschedule.db
ENV TZ=Europe/London

# update venv
RUN python3 -m pip install -U pip wheel setuptools

# install core requirements
WORKDIR /tmp
COPY e2e/server/core-requirements.txt .
RUN python3 -m pip install -Ur core-requirements.txt

# install server
WORKDIR /opt/superdesk/
COPY . .

# go to e2e server
WORKDIR /opt/superdesk/e2e/server

RUN python3 -m pip install -Ur requirements.txt

ENTRYPOINT [ "/opt/superdesk/e2e/server/docker/start.sh" ]
CMD ["honcho", "start"]
