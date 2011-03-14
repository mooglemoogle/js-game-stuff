function testMultiplyMatrices() {
    var y = [1, 2, 1]; //Point at x = 1, y = 2
    
    var x = [[1,0,10], [0,1,10], [0,0,1]]; //Translate by 10 up and 10 right
    var answer = multiplyMatrices(x, y);
    assert("Should equal [11, 11, 1]", answer == [11, 12, 1]);
    
    var x = [[3,0,0], [0,10,0], [0,0,1]]; //Scale by 3 in x and 10 in y
    answer = multiplyMatrices(x, y);
    assert("Should equal [3, 20, 1]", answer == [3, 20, 1]);
    
    //Rotate 90 degrees clockwise
    var theSin = Math.sin(Math.PI / 2);
    var theCos = Math.cos(Math.PI / 2);
    var x = [[theCos,-theSin,0], [theSin,theCos,0], [0,0,1]];
    answer = multiplyMatrices(x, y);
    assert("Should equal [-2, 1, 0]", answer == [-2, 1, 0]);
}