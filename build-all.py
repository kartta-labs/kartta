#! /usr/bin/python

import time
import os
import sys

templates = {
    "map.tpl.js": "map.js",
    "antique_style.tpl.json": "antique_style.json",
    "xray_style.tpl.json": "xray_style.json"
}
files = {
    "index.html": "index.html",
    "maponly.html": "maponly.html",
    "kartta.css": "kartta.css",
    "kartta-app-menu.css": "kartta-app-menu.css",
    "kartta-app-menu.js": "kartta-app-menu.js",
    "map.css": "map.css",
    "slider.css": "slider.css",
    "slider.js": "slider.js",
}
nowatch_dirs = {
    "assets": "assets",
    "antique/vector/antique_assets": "antique_assets",
    "antique/third_party/vector/mbgl": "mbgl",
    "antique/third_party/vector/fonts": "fonts"
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

def EnsureDirs(mapping):
  for k in mapping:
    d = os.path.dirname(os.path.join("build", mapping[k]))
    if not os.path.exists(d):
      os.system("mkdir -p %s" % d)

def BuildAll():
  print("building")
  template_args = " ".join([(k + " " + os.path.join("./build",templates[k])) for k in templates])
  os.system("bash ./subst ./config.env " + template_args)
  for k in files:
    os.system("cp %s ./build/%s" % (k, files[k]))
  os.system("chmod -R a+rw ./build")
  os.system("find build -type d -exec chmod a+x \\{\\} \\;")

# returns the most recent mtime of all template files
def LastMTime(templates):
  t = os.path.getmtime("./config.env")
  for file in templates:
    t = max(t, os.path.getmtime(file))
  for file in files:
    t = max(t, os.path.getmtime(file))
  return t

if not os.path.exists("config.env"):
  os.system("cp example-config.env config.env")
  os.system("chmod a+r config.env")
EnsureDirs(templates)
EnsureDirs(files)
EnsureDirs(nowatch_dirs)

# copy nowatch_dirs just once
for src_dir in nowatch_dirs:
  dest_dir = os.path.join("build", nowatch_dirs[src_dir])
  if os.path.exists(dest_dir):
    os.system("/bin/rm -rf %s" % dest_dir)
  os.system("cp -r %s %s" % (src_dir, dest_dir))

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
