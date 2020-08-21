# docker build -t cgimap:latest -f Dockerfile-cgimap .

FROM ubuntu:18.04

RUN apt-get update -qq

RUN apt-get install -y build-essential git vim emacs curl iputils-ping gettext-base python

RUN mkdir -p /map

COPY . /map

WORKDIR /map

ENTRYPOINT ["tail", "-f", "/dev/null"]
