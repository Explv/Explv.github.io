# Explv.github.io

### Dax Path

The Dax Path tool makes use of @itsdax great web walking API https://github.com/itsdax/Runescape-Web-Walker-Engine
All credits to him.

### Generating map tiles

(note that this will take a long time, and will generate an extremely large number of files):

1. Create map images for each plane using a map image dumper like https://github.com/kfricilone/OpenRS/blob/master/source/net/openrs/cache/tools/MapImageDumper.java

2. Install OSGeo4W (make sure it installs GDAL) https://trac.osgeo.org/osgeo4w/

3. Download gdal2tiles_parallel.py https://gitlab.com/GitLabRGI/erdc/geopackage-python/blob/master/Tiling/gdal2tiles_parallel.py

4. Open OSGeo4W Shell, run gdal2tiles_parallel.py with the following parameters:

```
python gdal2tiles_parallel.py -p raster -z 3-11 -e full_image_0.png your_output_dir/0/
python gdal2tiles_parallel.py -p raster -z 3-11 -e full_image_1.png your_output_dir/1/
python gdal2tiles_parallel.py -p raster -z 3-11 -e full_image_2.png your_output_dir/2/
python gdal2tiles_parallel.py -p raster -z 3-11 -e full_image_3.png your_output_dir/3/
```

5. Update the tile layer path in https://github.com/Explv/Explv.github.io/blob/master/js/map.js to point to your local dir where your tiles are stored (the following line)

```
map.tile_layer = L.tileLayer('https://raw.githubusercontent.com/Explv/osrs_map_full_20180601/master/' + map.plane + '/{z}/{x}/{y}.png'
```

6. Test the map to ensure coordinates produced for a selection of OSRS tiles are correct, you can compare with the live version of https://explv.github.io/
