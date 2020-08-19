#! /usr/bin/python

import time
import os
import sys

templates = {
    "index.html.in": "index.html",
    "antique_style.json.in": "antique_style.json",
    "xray_style.json.in": "xray_style.json"
}


def usage():
  print("usage: build-all.py [ -w ]")
  sys.exit(-1)

if len(sys.argv) > 2:
  usage()

watch = False
if len(sys.argv) == 2:
  if sys.argv[1] == "--watch":
    watch = True
  else:
    usage()


template_args = " ".join([(k + " " + templates[k]) for k in templates])

def BuildAll():
  cmd = "bash ./subst ./config.env " + template_args
  print(cmd)
  return os.system(cmd)

# returns the most recent mtime of all template files
def LastMTime(templates):
  t = os.path.getmtime("./config.env")
  for template in templates:
    t = max(t, os.path.getmtime(template))
  return t

mtime = LastMTime(templates)
BuildAll()

if watch:
  delay_secs = 0.5
  while (True):
    time.sleep(delay_secs)
    new_mtime = LastMTime(templates)
    if new_mtime > mtime:
      BuildAll()
      mtime = new_mtime
