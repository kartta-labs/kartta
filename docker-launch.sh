if [ ! -d /slidermap/build ] ; then
  mkdir /slidermap/build
fi

cd /slidermap
python ./build-all.py --watch &

cd /slidermap/build
python -m SimpleHTTPServer
