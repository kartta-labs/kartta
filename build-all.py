#!/usr/bin/python
#
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script builds the "map" application by copying things from this directory
# into the "build" directory (created if it does not already exist), performing
# jinja template rendering along the way.  I.e. every file in this directory,
# with certain exceptions noted below, is treates as a jinja template; the
# rendered version of that tempalte is written into the "build" directory.
#
# usage:
#    python3 build-all.py  [ --watch ]
#
# If invoked with --watch, this script will repeatedly scan the directory
# and regenerate the output files whenever any input file changes.

import time
import os
import re
import sys
import yaml
from jinja2 import Environment, FileSystemLoader

def usage():
  print("usage: build-all.py [ --watch ]")
  sys.exit(-1)

# Ignore any files or directories whose name matches any of these regex patterns:
ignore_patterns = [
    "^./.git$",
    "^./antique$",
    "^./assets$",
    "^./build$",
    "^./templates$",
    "^.*.py$",
    "^.*.sh$",
    "^Dockerfile$",
    "^NOTES$",
    "^.git.*$",
    "^.*.yml$",
    "^.*~$",
    "^#.*#$",
]

# Copy the contents of these directories just once; these are not scanned for
# changes or recopied, even if --watch is given.
dirs_to_copy = {
    "assets": "assets",
    "antique/vector/antique_assets": "antique_assets",
    "antique/third_party/vector/mbgl": "mbgl",
    "antique/third_party/vector/fonts": "fonts"
}

if len(sys.argv) > 2:
  usage()

watch = False
if len(sys.argv) == 2:
  if sys.argv[1] == "--watch":
    watch = True
  else:
    usage()

def ShouldIgnore(name):
    for pattern in ignore_patterns:
        if re.match(pattern, name):
            return True
    return False

def ListFiles():
  templates = []
  for dirName, subdirList, fileList in os.walk("."):
    if ShouldIgnore(dirName):
      subdirList.clear()
      continue
    for fileName in fileList:
      if ShouldIgnore(fileName):
        continue
      templates.append(os.path.join(dirName, fileName))
  return templates

def ListTemplatesToMonitor():
  templates = []
  for dirName, subdirList, fileList in os.walk("./templates"):
    for fileName in fileList:
      templates.append(os.path.join(dirName, fileName))
  return templates

def EnsureDirs(mapping):
  for k in mapping:
    d = os.path.dirname(os.path.join("build", mapping[k]))
    if not os.path.exists(d):
      os.system("mkdir -p %s" % d)

def LastMTime(files):
  t = os.path.getmtime("config.yml")
  for file in files:
    t = max(t, os.path.getmtime(file))
  return t

env = Environment(loader=FileSystemLoader('.'))
lastMTime = None

def BuildAll():
  global lastMTime
  global env
  files = ListFiles();
  mtime = LastMTime(files + ListTemplatesToMonitor())
  if lastMTime is None or mtime > lastMTime:
    with open("config.yml", "r") as f:
      config = yaml.load(f, Loader=yaml.FullLoader)
    for path in files:
      template = env.get_template(path)
      content = template.render(config)
      outputPath = os.path.join("build", path)
      print('Writing %s' % outputPath, flush=True)
      with open(outputPath, 'w') as f:
        f.write(content)
    lastMTime = mtime
    os.system("chmod -R a+rwx build")

if not os.path.exists("config.yml"):
  os.system("cp example-config.yml config.yml")
  os.system("chmod a+r config.yml")

EnsureDirs(dirs_to_copy)

for src_dir in dirs_to_copy:
  dest_dir = os.path.join("build", dirs_to_copy[src_dir])
  if os.path.exists(dest_dir):
    os.system("/bin/rm -rf %s" % dest_dir)
  os.system("cp -r %s %s" % (src_dir, dest_dir))

BuildAll()

if watch:
  delay_secs = 0.5
  while (True):
    time.sleep(delay_secs)
    BuildAll()
