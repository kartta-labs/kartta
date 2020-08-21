if [ ! -d /map/build ] ; then
  mkdir /map/build
fi

cd /map
python ./build-all.py --watch &

cd /map/build
python -m SimpleHTTPServer
