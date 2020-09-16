# Kartta

Kartta is the home page map viewing application for the Kartta Labs suite of applications.
It displays an interactive map with pan/zoom controls and a time slider, and provides a header
with controls for navigating between the other applications in the suite.  It also includes
several general informational pages such as FAQ, Help, and About.

To run a local copy of Kartta for development purposes, make sure you have docker and docker-compose
installed, and then:

1. Clone a copy of the 'antique' repo inside this directory:
   ```
   git clone https://github.com/kartta-labs/antique
   ```
   The antique repo contains several assets used by kartta for map styling.  There's no need to do anything
   (configure, build, etc) in the antique repo -- just clone it.

2. Make a copy of `example-config.yml` called `config.yml`, and edit to add/change your preferred settings

3. Run `docker-compose up`

4. Go to https://localhost:8000 in your browser

See http://github.com/kartta-labs/Project for more information about running Kartta as part of the
Kartta Labs suite of applications.

Kartta is not an officially supported Google product.
