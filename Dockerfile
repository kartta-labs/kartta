FROM python:3

RUN pip3 install jinja2 pyyaml

COPY . /map

WORKDIR /map
