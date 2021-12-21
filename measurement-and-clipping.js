// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5YTE2N2U2NS0xOWY4LTRhNjktODk0Yi04ZjlhNjBjYWYyM2UiLCJpZCI6NzU2NzksImlhdCI6MTYzODgwOTE0Mn0.YxXpqexwYFvu54l-OXqLiZGDyhGFMUM3r8AuSywxY44";
//change the access token to yours

//remove this parts from cesium viewer:  terrainProvider: new Cesium.CesiumTerrainProvider({
  //url: Cesium.IonResource.fromAssetId(1),
 //}),  
var viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: new Cesium.CesiumTerrainProvider({
  url: Cesium.IonResource.fromAssetId(1),
 }),
 infoBox: false,
 selectionIndicator: false,
 animation: false,
 baseLayerPicker: false,
 timeline: false,
 homeButton: false,
 scene3DOnly: true,
  
});



viewer.scene.debugShowFramesPerSecond = true; //or false. toggle on/off. true: show, false: hide (





var scene = viewer.scene;
var ellipsoid = Cesium.Ellipsoid.WGS84;
var geodesic = new Cesium.EllipsoidGeodesic();
const mode = document.forms.modes.elements["mode"];

var value, title, count;

var clipObjects = ["Point Cloud"];
var viewModel = {
  debugBoundingVolumesEnabled: false,
  edgeStylingEnabled: true,
  exampleTypes: clipObjects,
  currentExampleType: clipObjects[0],
};

var targetY = 0.0;
var planeEntities = [];
var selectedPlane;
var clippingPlanes;

// Select plane when mouse down
var downHandler = new Cesium.ScreenSpaceEventHandler(
  viewer.scene.canvas
);

downHandler.setInputAction(function (movement) {
  var pickedObject = scene.pick(movement.position);
  if (
    Cesium.defined(pickedObject) &&
    Cesium.defined(pickedObject.id) &&
    Cesium.defined(pickedObject.id.plane)
  ) {
    selectedPlane = pickedObject.id.plane;
    selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.05);
    selectedPlane.outlineColor = Cesium.Color.WHITE;
    scene.screenSpaceCameraController.enableInputs = false;
  }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

// Release plane on mouse up
var upHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
upHandler.setInputAction(function () {
  if (Cesium.defined(selectedPlane)) {
    selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.1);
    selectedPlane.outlineColor = Cesium.Color.WHITE;
    selectedPlane = undefined;
  }

  scene.screenSpaceCameraController.enableInputs = true;
}, Cesium.ScreenSpaceEventType.LEFT_UP);

// Update plane on mouse move
var moveHandler = new Cesium.ScreenSpaceEventHandler(
  viewer.scene.canvas
);
moveHandler.setInputAction(function (movement) {
  if (Cesium.defined(selectedPlane)) {
    var deltaY = movement.startPosition.y - movement.endPosition.y;
    targetY += deltaY;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

function createPlaneUpdateFunction(plane) {
  return function () {
    plane.distance = targetY;
    return plane;
  };
}



var tileset;
function loadTileset(url) {
  clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: [
      new Cesium.ClippingPlane(
        new Cesium.Cartesian3(0.0, 0.0, -1.0),
        0.0
      ),
    ],
    edgeWidth: viewModel.edgeStylingEnabled ? 1.0 : 0.0,
  });

  tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      url: url,
      clippingPlanes: clippingPlanes,
    })
  );
  tileset.debugShowBoundingVolume =
    viewModel.debugBoundingVolumesEnabled;
  return tileset.readyPromise
    .then(function () {
      var boundingSphere = tileset.boundingSphere;
      var radius = boundingSphere.radius;

      viewer.zoomTo(
        tileset,
        new Cesium.HeadingPitchRange(0.5, -0.2, radius * 4.0)
      );

      if (
        !Cesium.Matrix4.equals(
          tileset.root.transform,
          Cesium.Matrix4.IDENTITY
        )
      ) {
        // The clipping plane is initially positioned at the tileset's root transform.
        // Apply an additional matrix to center the clipping plane on the bounding sphere center.
        var transformCenter = Cesium.Matrix4.getTranslation(
          tileset.root.transform,
          new Cesium.Cartesian3()
        );
        var transformCartographic = Cesium.Cartographic.fromCartesian(
          transformCenter
        );
        var boundingSphereCartographic = Cesium.Cartographic.fromCartesian(
          tileset.boundingSphere.center
        );
        var height =
          boundingSphereCartographic.height -
          transformCartographic.height;
        clippingPlanes.modelMatrix = Cesium.Matrix4.fromTranslation(
          new Cesium.Cartesian3(0.0, 0.0, height)
        );
      }

      for (var i = 0; i < clippingPlanes.length; ++i) {
        var plane = clippingPlanes.get(i);
        var planeEntity = viewer.entities.add({
          position: boundingSphere.center,
          plane: {
            dimensions: new Cesium.Cartesian2(
              radius * 2.5,
              radius * 2.5
            ),
            material: Cesium.Color.WHITE.withAlpha(0.1),
            plane: new Cesium.CallbackProperty(
              createPlaneUpdateFunction(plane),
              false
            ),
            outline: true,
            outlineColor: Cesium.Color.WHITE,
          },
        });

        planeEntities.push(planeEntity);
      }
      
  
  

    value = document.getElementById("value");
    title = document.getElementById("title");
    count = document.getElementById("count");
    window.clearAll = function () {
      points.removeAll();
      count.innerText = points.length;
      polylines.removeAll();
      value.innerText = "Select 2 points.";
    };
    window.updateValue = function () {
      count.innerText = points.length;
      if (points.length >= 2) {
        polylines.removeAll();
        let distance = 0;
        switch (mode.value) {
          case "d":
            title.innerText = "Distance:";
            for (let p = 1; p < points.length; p++) {
              distance += getDistance(points.get(p - 1), points.get(p));
              drawLine(points.get(p - 1), points.get(p));
            }
            if (distance >= 1000) {
              value.innerText = (distance / 1000).toFixed(1) + " км";
            } else {
              value.innerText = distance.toFixed(2) + " м";
            }
            break;
          case "hd":
            title.innerHTML = "Horizontal Distance<br/>(1st and last point):";
            distance = getHorizontalDistance(
              points.get(0),
              points.get(points.length - 1)
            );
            drawHorizontalLine(points.get(0), points.get(points.length - 1));
            if (distance >= 1000) {
              value.innerText = (distance / 1000).toFixed(1) + " км";
            } else {
              value.innerText = distance.toFixed(2) + " м";
            }
            break;
          case "vd":
            title.innerHTML = "Vertical Distance<br/>(1st and last point):";
            distance = getVerticalDistance(
              points.get(0),
              points.get(points.length - 1)
            );
            drawVerticalLine(points.get(0), points.get(points.length - 1));
            if (distance >= 1000) {
              value.innerText = (distance / 1000).toFixed(1) + " км";
            } else {
              value.innerText = distance.toFixed(2) + " м";
            }
            break;
          case "a":
            title.innerText = "Area:";
            let S = getArea(points.get(0), points.get(points.length - 1));
            if (S >= 1000000) {
              value.innerText = (S / 1000000).toFixed(1) + " км²";
            } else {
              value.innerText = S.toFixed(1) + " м²";
              }
              break;
            default:
              break;
          }
        }
      };
      return tileset;
    })
    .otherwise(function (error) {
      console.log(error);
    });
}
  





function loadModel(url) {
  clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: [
      new Cesium.ClippingPlane(
        new Cesium.Cartesian3(0.0, 0.0, -1.0),
        0.0
      ),
    ],
    edgeWidth: viewModel.edgeStylingEnabled ? 1.0 : 0.0,
  });

  var position = Cesium.Cartesian3.fromDegrees(
    -123.0744619,
    44.0503706,
    300.0
  );
  var heading = Cesium.Math.toRadians(135.0);
  var pitch = 0.0;
  var roll = 0.0;
  var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  var orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    hpr
  );
  var entity = viewer.entities.add({
    name: url,
    position: position,
    orientation: orientation,
    model: {
      uri: url,
      scale: 8,
      minimumPixelSize: 100.0,
      clippingPlanes: clippingPlanes,
    },
  });
  
  
  viewer.trackedEntity = entity;
  for (var i = 0; i < clippingPlanes.length; ++i) {
    var plane = clippingPlanes.get(i);
    var planeEntity = viewer.entities.add({
      position: position,
      plane: {
        dimensions: new Cesium.Cartesian2(300.0, 300.0),
        material: Cesium.Color.WHITE.withAlpha(0.1),
        plane: new Cesium.CallbackProperty(
          createPlaneUpdateFunction(plane),
          false
        ),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
      },
    });
    
    planeEntities.push(planeEntity);
        
  }
}

// Power Plant design model provided by Bentley Systems

// put your asset id 
var pointCloudUrl = Cesium.IonResource.fromAssetId(704706);





loadTileset(pointCloudUrl);

// Track and create the bindings for the view model
var toolbar = document.getElementById("toolbar");
Cesium.knockout.track(viewModel);
Cesium.knockout.applyBindings(viewModel, toolbar);

Cesium.knockout
  .getObservable(viewModel, "currentExampleType")
  .subscribe(function (newValue) {
    reset();

    if (newValue === clipObjects[0]) {
      loadTileset(pointCloudUrl);
    } 

  });


Cesium.knockout
  .getObservable(viewModel, "debugBoundingVolumesEnabled")
  .subscribe(function (value) {
    if (Cesium.defined(tileset)) {
      tileset.debugShowBoundingVolume = value;
    }
  });

Cesium.knockout
  .getObservable(viewModel, "edgeStylingEnabled")
  .subscribe(function (value) {
    var edgeWidth = value ? 1.0 : 0.0;

    clippingPlanes.edgeWidth = edgeWidth;
  });

function reset() {
  viewer.entities.removeAll();
  viewer.scene.primitives.remove(tileset);
  planeEntities = [];
  targetY = 0.0;
  tileset = undefined;
}


//set default geometricErrorScale 0.005
tileset.pointCloudShading.attenuation= true;  //or false. toggle on/off
  //if(tileset.pointCloudShading.attenuation) { //on
    //get value from slide UI: 0.001 ~ 1
  //}








var points = scene.primitives.add(new Cesium.PointPrimitiveCollection());
var polylines = scene.primitives.add(new Cesium.PolylineCollection());
var LINEPOINTCOLOR = Cesium.Color.RED;

function drawLine(point1, point2) {
  let point1GeoPosition = Cesium.Cartographic.fromCartesian(point1.position);
  let point2GeoPosition = Cesium.Cartographic.fromCartesian(point2.position);

  var pl1Positions = [
    new Cesium.Cartesian3.fromRadians(
      point1GeoPosition.longitude,
      point1GeoPosition.latitude,
      point1GeoPosition.height
    ),
    new Cesium.Cartesian3.fromRadians(
      point2GeoPosition.longitude,
      point2GeoPosition.latitude,
      point2GeoPosition.height
    ),
  ];

  polylines.add({
    show: true,
    positions: pl1Positions,
    width: 1,
    material: new Cesium.Material({
      fabric: {
        type: "Color",
        uniforms: {
          color: LINEPOINTCOLOR,
        },
      },
    }),
  });
}

function drawHorizontalLine(point1, point2) {
  let point1GeoPosition = Cesium.Cartographic.fromCartesian(point1.position);
  let point2GeoPosition = Cesium.Cartographic.fromCartesian(point2.position);

  var pl3Positions = [
    new Cesium.Cartesian3.fromRadians(
      point1GeoPosition.longitude,
      point1GeoPosition.latitude,
      point1GeoPosition.height
    ),
    new Cesium.Cartesian3.fromRadians(
      point2GeoPosition.longitude,
      point2GeoPosition.latitude,
      point1GeoPosition.height
    ),
  ];

  polylines.add({
    show: true,
    positions: pl3Positions,
    width: 1,
    material: new Cesium.Material({
      fabric: {
        type: "PolylineDash",
        uniforms: {
          color: LINEPOINTCOLOR,
        },
      },
    }),
  });
}

function drawVerticalLine(point1, point2) {
  let point1GeoPosition = Cesium.Cartographic.fromCartesian(point1.position);
  let point2GeoPosition = Cesium.Cartographic.fromCartesian(point2.position);

  var pl2Positions = [
    new Cesium.Cartesian3.fromRadians(
      point2GeoPosition.longitude,
      point2GeoPosition.latitude,
      point2GeoPosition.height
    ),
    new Cesium.Cartesian3.fromRadians(
      point2GeoPosition.longitude,
      point2GeoPosition.latitude,
      point1GeoPosition.height
    ),
  ];

  polylines.add({
    show: true,
    positions: pl2Positions,
    width: 1,
    material: new Cesium.Material({
      fabric: {
        type: "PolylineDash",
        uniforms: {
          color: LINEPOINTCOLOR,
        },
      },
    }),
  });
}

function preprocessPoints(point1, point2) {
  point1.cartographic = ellipsoid.cartesianToCartographic(point1.position);
  point2.cartographic = ellipsoid.cartesianToCartographic(point2.position);
  point1.longitude = parseFloat(Cesium.Math.toDegrees(point1.position.x));
  point1.latitude = parseFloat(Cesium.Math.toDegrees(point1.position.y));
  point2.longitude = parseFloat(Cesium.Math.toDegrees(point2.position.x));
  point2.latitude = parseFloat(Cesium.Math.toDegrees(point2.position.y));
}

function getDistance(point1, point2) {
  preprocessPoints(point1, point2);

  geodesic.setEndPoints(point1.cartographic, point2.cartographic);
  var horizontalMeters = geodesic.surfaceDistance.toFixed(2);

  let point1GeoPosition = Cesium.Cartographic.fromCartesian(point1.position);
  let point2GeoPosition = Cesium.Cartographic.fromCartesian(point2.position);
  var heights = [point1GeoPosition.height, point2GeoPosition.height];
  var verticalMeters =
    Math.max.apply(Math, heights) - Math.min.apply(Math, heights);
  var meters = Math.pow(
    Math.pow(horizontalMeters, 2) + Math.pow(verticalMeters, 2),
    0.5
  );
  return meters;
}

function getHorizontalDistance(point1, point2) {
  preprocessPoints(point1, point2);
  geodesic.setEndPoints(point1.cartographic, point2.cartographic);
  var meters = geodesic.surfaceDistance;
  return meters;
}

function getVerticalDistance(point1, point2) {
  preprocessPoints(point1, point2);
  let point1GeoPosition = Cesium.Cartographic.fromCartesian(point1.position);
  let point2GeoPosition = Cesium.Cartographic.fromCartesian(point2.position);
  var heights = [point1GeoPosition.height, point2GeoPosition.height];
  var meters = Math.max.apply(Math, heights) - Math.min.apply(Math, heights);
  return meters;
}



function getArea(point1, point2) {
  preprocessPoints(point1, point2);
  let point1GeoPosition = Cesium.Cartographic.fromCartesian(point1.position);
  let point2GeoPosition = Cesium.Cartographic.fromCartesian(point2.position);
  let point3GeoPosition = Cesium.Cartographic.fromCartesian(new Cesium.Cartesian3(point2.position.x, point2.position.y, point1.position.z));

  geodesic.setEndPoints(point1.cartographic, point2.cartographic);
  var horizontalMeters = geodesic.surfaceDistance.toFixed(2);
  var heights = [point1GeoPosition.height, point2GeoPosition.height];
  var verticalMeters = Math.max.apply(Math, heights) - Math.min.apply(Math, heights);
  var S = (horizontalMeters*verticalMeters)*0.5 ;

  return S;
}

var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction(function (click) {
  if (scene.mode !== Cesium.SceneMode.MORPHING) {
    var pickedObject = scene.pick(click.position);
    if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
      var cartesian = viewer.scene.pickPosition(click.position);

      if (Cesium.defined(cartesian)) {
        if (points.length < 2) {
          points.add({
            position: new Cesium.Cartesian3(
              cartesian.x,
              cartesian.y,
              cartesian.z
            ),
            color: LINEPOINTCOLOR,
          });
          updateValue();
        }
      }
    }
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
