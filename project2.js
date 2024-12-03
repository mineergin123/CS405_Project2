/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
	
		this.colorLoc = gl.getUniformLocation(this.prog, 'color');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
		this.cameraPosLoc = gl.getUniformLocation(this.prog, 'cameraPos');
	
		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
	
		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
	
		this.numTriangles = 0;
	
		this.lightingEnabled = false;
		this.ambient = 0.5;
		this.shininess = 32.0;
	}
	

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		if (normalCoords) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
		}
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);
	
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
		gl.uniform3f(this.cameraPosLoc, 0.0, 0.0, 5.0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	
		if (this.lightingEnabled) {
			gl.uniform1i(this.enableLightingLoc, true);
			gl.uniform3f(this.lightPosLoc, lightX, lightY, -5.0);
			gl.uniform1f(this.ambientLoc, this.ambient);
			gl.uniform1f(this.shininessLoc, this.shininess);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.enableVertexAttribArray(this.normalLoc);
			gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		}
	
		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, textureIndex = 0) {
		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + textureIndex);
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img
		);
	
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			console.log("Non-power-of-2 sized texture detected. Turning off mipmaps and setting wrapping to clamp to edge.");
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);
	
		const sampler = gl.getUniformLocation(this.prog, textureIndex === 0 ? 'tex' : 'tex2');
		gl.uniform1i(sampler, textureIndex);
	}
	
	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.lightingEnabled = show;
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableLightingLoc, show ? 1 : 0);
	}
	
	setAmbientLight(ambient) {
		console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		console.log("Changed ambient light intensity:", ambient)
			this.ambient = ambient;
		gl.useProgram(this.prog);
		gl.uniform1f(this.ambientLoc, ambient);
	}
	setSpecularLight(shininess) {
		this.shininess = shininess;
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
	}
	
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex;
			uniform sampler2D tex2;
			uniform vec3 lightPos;
			uniform float ambient;
			uniform float shininess;
			uniform vec3 cameraPos;

			varying vec2 v_texCoord;
			varying vec3 v_normal;

			void main()
			{
				if (showTex && enableLighting) {
					vec4 texColor1 = texture2D(tex, v_texCoord);
					vec4 texColor2 = texture2D(tex2, v_texCoord);
					vec4 blendedColor = mix(texColor1, texColor2, 0.5);

					vec3 norm = normalize(v_normal);

					vec3 lightDir = normalize(lightPos - vec3(0.0, 0.0, 0.0));

					vec3 viewDir = normalize(cameraPos - vec3(0.0, 0.0, 0.0));

					float diff = max(dot(norm, lightDir), 0.0);
					vec3 diffuse = diff * blendedColor.rgb;

					vec3 ambientLight = vec3(ambient, ambient, ambient);

					vec3 reflectDir = reflect(-lightDir, norm);
					float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
					vec3 specular = spec * vec3(1.0, 1.0, 1.0);

					vec3 finalColor = ambientLight + diffuse + specular;

					gl_FragColor = vec4(finalColor, 1.0) * blendedColor;

				} else if (showTex) {
					vec4 texColor1 = texture2D(tex, v_texCoord);
					vec4 texColor2 = texture2D(tex2, v_texCoord);
					vec4 blendedColor = mix(texColor1, texColor2, 0.5); 
					gl_FragColor = blendedColor;
				} else {
					gl_FragColor = vec4(1.0, 0, 0, 1.0);
				}
			}`;


// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////