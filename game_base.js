function Game(elementID) {
    this.elemId = elementID;
    this.canvas = document.getElementById(elementID);
    this.realWidth = this.canvas.width;
    this.realHeight = this.canvas.height;
    this.realRatio = this.realHeight / this.realWidth;
    this.context = this.canvas.getContext("2d");
    this.clearColor = "rgb(0,0,0)";
    
    this.cameraMatrix = new TransformMatrix();
    this.inverseCameraMatrix = new TransformMatrix();
    this.viewWidth = 25;
    this.lookAt = [0, 0];
    
    this.setClearColor = function(r, g, b, a) {
        if (a)
            this.clearColor = "rgba("+r+","+g+","+b+","+a+")";
        else
            this.clearColor = "rgba("+r+","+g+","+b+")";
    }
    
    this.calculateCameraMatrix = function() {
        this.resetCamera();
        
        var newScale = this.realWidth / this.viewWidth;
        var vertRes = this.viewWidth * this.realRatio;
        this.translateCamera(this.viewWidth / 2, -vertRes / 2);
        this.scaleCamera(newScale, - newScale);
    }
    
    this.setViewWidth = function(width) {
        this.viewWidth = width;
        this.setCameraMatrix();
    }
    
    this.setLookAt = function(x, y) {
        this.lookAt = [x, y];
        this.setCameraMatrix();
    }
    
    this.resetCamera = function() {
        this.cameraMatrix.reset();
        this.inverseCameraMatrix.reset();
    }
    
    this.translateCamera = function(x, y) {
        this.cameraMatrix.translate(x, y);
        this.inverseCameraMatrix.translate(-x, -y, true);
    }
    
    this.scaleCamera = function(x, y) {
        this.cameraMatrix.scale(x, y);
        this.inverseCameraMatrix.scale(1/x, 1/y, true);
    }
    
    this.rotateCamera = function(angle, deg) {
        this.cameraMatrix.rotate(angle, deg);
        this.inverseCameraMatrix.rotate(angle, deg, true, true);
    }
    this.calculateCameraMatrix();
}

function testing(){
var game = new Game('theCanvas');
game.context.fillStyle="rgb(0,0,0)";
game.context.save();
game.cameraMatrix.setTransform(game.context);
game.context.translate(1, 1);
game.context.fillRect(0,0, 1, 1);
game.context.translate(1, 1);
game.context.fillRect(0,0, 1, 1);
game.context.translate(1, 1);
game.context.fillRect(0,0, 1, 1);
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