if [ ! -d /map/build ] ; then
  mkdir /map/build
fi

cd /map
python3 ./build-all.py --watch &

cd /map/build
python3 -m http.server
