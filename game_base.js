function Game(elementID) {
    this.elemId = elementID;
    this.canvas = document.getElementById(elementID);
    this.realWidth = this.canvas.width;
    this.realHeight = this.canvas.height;
    this.realRatio = this.realHeight / this.realWidth;
    this.context = this.canvas.getContext("2d");
    this.clearColor = "rgb(0,0,0)";
    this.targetFPS = 60;
    
    this.cameraMatrix = new TransformMatrix();
    this.inverseCameraMatrix = new TransformMatrix();
    this.viewWidth = 360;
    this.lookAt = [0, 0];
    this.mouseCoords = [0, 0];
    
    this.setupEvents = function() {
        var game = this;
        var mouseDisp = document.getElementById('mousepos');
        this.canvas.onmousemove = function (e) { 
            game.mouseCoords = [e.layerX, e.layerY];
        };
    };
    
    this.start = function() {
        this.setupEvents();
        this.calculateCameraMatrix();
        this.setClearColor(255, 255, 255);
        var intervalTime = 1000 / this.targetFPS;
        intervalTime = Math.floor(intervalTime);
        var game = this;
        this.intervalID = setInterval(function() {game.mainLoop();}, intervalTime);
    };
    
    this.stop = function() {
        clearInterval(this.intervalID);
    };
    
    this.mainLoop = function() {
        if (! this.squares) {
            this.squares = [];
            var numSquares = 20;
            var angPerSq = (2 * Math.PI / numSquares);
            this.r = 100;
            for (var i=0; i < numSquares; i++) {
                var angle = angPerSq * i;
                var sq = {x: this.r * Math.cos(angle),
                          y: this.r * Math.sin(angle),
                          angle: 0,
                          rotVel: 0,
                          circleAngle: angle,
                          picked: false,
                          width: 10,
                          height: 10};
                this.squares.push(sq);
            }
            this.angVel = Math.PI / 16; //Radians per second
            this.lastRunTime = new Date();
            this.fps = 0;
            this.setLookAt(30, 0);
            this.viewAngle = 0;
        } else {
            this.update();
        }
        this.draw();
    };

    this.update = function() {
        var now = new Date();
        var interval = (now - this.lastRunTime) / 1000;
        this.fps = Math.floor(1000 / (now - this.lastRunTime));
        this.lastRunTime = now;
        var to_add = this.angVel * interval;
        
        this.viewAngle -= (to_add * 4);
        this.setLookAt(30 * Math.cos(this.viewAngle), 30 * Math.sin(this.viewAngle));

        for (var i=0; i < this.squares.length; i++) {
            var item = this.squares[i];
            item.circleAngle = item.circleAngle + to_add;
            item.x = this.r * Math.cos(item.circleAngle);
            item.y = this.r * Math.sin(item.circleAngle);
            item.picked = false;
        }
        
        for (var i=0; i < this.squares.length; i++) {
            var item = this.squares[i];
            item.picked = this.isPicked(item);
            if (item.picked)
                break;
        }
    };

    this.draw = function() {
        this.clear();
        this.context.save();
        this.cameraMatrix.setTransform(this.context);
        this.context.fillStyle = buildColorString(0,0,0);
        for (var i=0; i < this.squares.length; i++) {
            var item = this.squares[i];
            this.context.save();
            if (item.picked)
                this.context.fillStyle = buildColorString(255,0,0);
            this.context.translate(item.x, item.y);
            this.context.rotate(item.circleAngle + item.angle);
            this.context.fillRect(-5, -5, 10, 10);
            this.context.restore();
        }
        this.drawFPS();
    };
    
    this.isPicked = function(square) {
        var coords = this.getMouseWorldCoords();
        if (isNaN(coords[0]) || isNaN(coords[1]))
            return false;
        var itemMatrix = new TransformMatrix();
        itemMatrix.rotate(square.angle + square.circleAngle);
        itemMatrix.translate(square.x, square.y);
        
        var dWidth = square.width / 2, dHeight = square.height / 2;
        var points = [[-dWidth,  dHeight],
                      [-dWidth, -dHeight],
                      [ dWidth, -dHeight],
                      [ dWidth,  dHeight]]
        
        for (var i = 0; i < points.length; i++)
            points[i] = itemMatrix.transformPoint(points[i][0], points[i][1]);
        
        if (this.sameSide(points[0], points[1], points[2], coords) &&
            this.sameSide(points[1], points[2], points[3], coords) &&
            this.sameSide(points[2], points[3], points[0], coords) &&
            this.sameSide(points[3], points[0], points[1], coords))
            return true;
        else
            return false;
    }
    
    this.sameSide = function(p1, p2, test1, test2) {
        var line = [p2[0] - p1[0], p2[1] - p1[1]];
        var v1 = [test1[0] - p1[0], test1[1] - p1[1]];
        var v2 = [test2[0] - p1[0], test2[1] - p1[1]];
        
        var r1 = this.crossProduct(line, v1);
        var r2 = this.crossProduct(line, v2);
        
        return (r1 * r2) >= 0;
    }
    
    this.crossProduct = function(v1, v2) {
        return v1[0] * v2[1] - v1[1] * v2[0];
    }
    
    /* Calculate Camera Matrix - Builds the transform matrix for the camera.
     * Called each time the look at point or the view width is set. See
     * comments on setViewWidth and setLookAt for more info.
     */
    this.calculateCameraMatrix = function() {
        this.resetCamera();
        
        var newScale = this.realWidth / this.viewWidth;
        var vertRes = this.viewWidth * this.realRatio;
        this.translateCamera(this.viewWidth / 2, -vertRes / 2);
        this.scaleCamera(newScale, - newScale);
        this.translateCamera(this.lookAt[0], this.lookAt[1]);
    };
    
    /* Set View Width - Sets the value of viewWidth which dictates the world
     * coordinate range shown in the frame. The view width specifies the whole
     * range of the x-axis view so it will show from -viewWidth / 2 to
     * +viewWidth / 2. Recalculates the camera matrix on each call.
     */
    this.setViewWidth = function(width) {
        this.viewWidth = width;
        this.calculateCameraMatrix();
    };
    
    /* Set Look At - Sets the point at which the camera should be looking.
     */
    this.setLookAt = function(x, y) {
        this.lookAt = [x, y];
        this.calculateCameraMatrix();
    };
    
    this.resetCamera = function() {
        this.cameraMatrix.reset();
        this.inverseCameraMatrix.reset();
    };
    
    this.translateCamera = function(x, y) {
        this.cameraMatrix.translate(x, y);
        this.inverseCameraMatrix.translate(-x, -y, true);
    };
    
    this.scaleCamera = function(x, y) {
        this.cameraMatrix.scale(x, y);
        this.inverseCameraMatrix.scale(1/x, 1/y, true);
    };
    
    this.rotateCamera = function(angle, deg) {
        this.cameraMatrix.rotate(angle, deg);
        this.inverseCameraMatrix.rotate(angle, deg, true, true);
    };
    
    this.setMainLoop = function(loopFunc) {
        Game.prototype.mainLoop = loopFunc;
    };
    
    this.setUpdateFunc = function(updateFunc) {
        Game.prototype.update = updateFunc;
    };
    
    this.setDrawFunc = function(drawFunc) {
        Game.prototype.draw = drawFunc;
    };
    
    this.getMouseCoords = function() {
        return this.mouseCoords;
    };
    
    this.getMouseWorldCoords = function() {
        return this.inverseCameraMatrix.transformPoint(this.mouseCoords[0], this.mouseCoords[1]);
    };
    
    /* Set Clear Color - Sets the clear color (the base color that's set before
     * each frame is drawn). Clear color defaults to rgb(0,0,0) (black). This
     * function uses buildColorString and thus has the same input requirements.
     */
    this.setClearColor = function(r, g, b, a) {
        this.clearColor = buildColorString(r, g, b, a);
    };
    
    this.clear = function() {
        this.context.save();
        this.context.fillStyle = this.clearColor;
        this.context.setTransform(1,0,0,1,0,0);
        this.context.fillRect(0, 0, this.realWidth, this.realHeight);
        this.context.restore();
    };
    
    this.drawFPS = function() {
        this.context.save();
        this.context.fillStyle = "rgb(0,0,0)";
        this.context.setTransform(1,0,0,1,0,0);
        this.context.fillText("FPS: " + this.fps, 10, 10);
        this.context.restore();
    };
    
    this.drawAxes = function() {
        this.context.save();
        this.context.strokeStyle = "rgb(0, 0, 0)";
        this.context.beginPath();
        this.context.moveTo(0, this.realHeight / 2);
        this.context.lineTo(this.realWidth, this.realHeight / 2);
        this.context.stroke();
        this.context.beginPath();
        this.context.moveTo(this.realWidth / 2, 0);
        this.context.lineTo(this.realWidth / 2, this.realHeight);
        this.context.stroke();
        this.context.restore();
    };
}

function testing(){
    var game = new Game('theCanvas');
    game.start();
}

window.onload = testing;

function TransformMatrix() {
    // Resets the transform matrix to the identity.
    this.reset = function() {
        this.transform = [[1,0,0],
                          [0,1,0],
                          [0,0,1]];
    }
    this.reset();
    
    this.rotate = function(angle, deg, cw, reverse) {
        if (deg)
            angle = degreesToRadians(angle);
        
        var theSin = Math.sin(angle);
        var theCos = Math.cos(angle);
        var theTransform = null;
        if (cw) {
            theTransform = [[ theCos, theSin, 0],
                            [-theSin,  theCos, 0],
                            [0,       0,      1]];
        } else {
            theTransform = [[theCos, -theSin, 0],
                            [theSin,  theCos, 0],
                            [0,       0,      1]];
        }
        if (reverse)
            this.transform = multiplyMatrices(this.transform, theTransform);
        else
            this.transform = multiplyMatrices(theTransform, this.transform);
    }
    
    this.translate = function(x, y, reverse) {
        theTransform = [[1, 0, x],
                        [0, 1, y],
                        [0, 0, 1]];
        if (reverse)
            this.transform = multiplyMatrices(this.transform, theTransform);
        else
            this.transform = multiplyMatrices(theTransform, this.transform);
    }
    
    this.scale = function(x, y, reverse) {
        theTransform = [[x, 0, 0],
                        [0, y, 0],
                        [0, 0, 1]];
        if (reverse)
            this.transform = multiplyMatrices(this.transform, theTransform);
        else
            this.transform = multiplyMatrices(theTransform, this.transform);
    }
    
    this.transformPoint = function(x, y) {
        var value = multiplyMatrices(this.transform, [x, y, 1]);
        return [value[0], value[1]];
    }
    
    this.setTransform = function(context) {
        context.setTransform(this.transform[0][0], this.transform[0][1],
                             this.transform[1][0], this.transform[1][1],
                             this.transform[0][2], this.transform[1][2]);
    }
}

function buildColorString(r,g,b,a) {
    if (a)
        var color = "rgba("+r+","+g+","+b+","+a+")";
    else
        var color = "rgb("+r+","+g+","+b+")";
    
    return color;
}

function multiplyMatrices(m1, m2) {
    var finalRows = m1.length;
    var finalCols = m2[0].length;
    //This is for if m2 is a vector (probably most of the time)
    var fixOutput = false;
    if (typeof finalCols == 'undefined') {
        finalCols = 1;
        m2 = [[m2[0]],[m2[1]],[m2[2]]];
        fixOutput = true;
    }
    var finalMat = [];
    
    for (var row = 0; row < finalRows; row++) {
        var thisRow = [];
        for (var col = 0; col < finalCols; col++) {
            var thisVal = 0;
            for (var i=0; i < m1[0].length; i++){
                thisVal += m1[row][i] * m2[i][col];
            }
            thisRow[col] = thisVal;
        }
        finalMat[row] = thisRow;
    }
    
    //Turn it back into a vector if m2 was passed in as one.
    if (fixOutput)
        finalMat = [finalMat[0][0], finalMat[1][0], finalMat[2][0]];
    
    return finalMat;
}

function degreesToRadians(angle) {
    return angle * (Math.PI / 180.0);
}