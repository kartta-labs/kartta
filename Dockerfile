FROM python:3

RUN apt-get update
RUN apt-get install -y gettext-base

RUN pip3 install jinja2 pyyaml

COPY . /kartta

WORKDIR /kartta
