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

# This launch script is only used when running the kartta app by itself
# from this directory for development purposes (via docker-compose using
# ./docker-compose.yml); it's not use when running kartta as part of
# the Kartta Labs suite (https://github.com/kartta-labs/Project).

if [ ! -d /map/build ] ; then
  mkdir /map/build
fi

cd /map
python3 ./build-all.py --watch &

cd /map/build
python3 -m http.server
