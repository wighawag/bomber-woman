import * as twgl from 'twgl.js';
import * as m3 from '$utils/m3';
import type {CameraState} from '../camera';
import type {BomberWomanViewState} from '$lib/state/ViewState';
import {sheetURL, type Attributes} from '../textures';
import {bigIntIDToXY} from 'bomber-woman-common';

const vertexShaderSource = `#version 300 es

in vec2 a_position;
in vec2 a_tex;
in float a_alpha;

out vec2 v_tex;
out float v_alpha;
 
uniform mat3 u_matrix;

void main() {
  v_tex = a_tex;
  v_alpha = a_alpha;
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D u_tex;

in vec2 v_tex;
in float v_alpha;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec4 texColor = texture(u_tex, v_tex).rgba;
 texColor = texColor * v_alpha;
// texColor = texColor * 0.8;
//   texColor.a = 0.8;
  outColor = texColor;
}
`;

export class Textured2DLayer {
	programInfo!: twgl.ProgramInfo;
	bufferInfo!: twgl.BufferInfo;
	gl!: WebGL2RenderingContext;
	textures!: {[key: string]: WebGLTexture};

	constructor(public size: number) {}

	initialize(GL: WebGL2RenderingContext) {
		this.gl = GL;
		this.programInfo = twgl.createProgramInfo(GL, [vertexShaderSource, fragmentShaderSource]);

		const attributes = {
			a_position: {numComponents: 2, data: new Float32Array([])},
			a_tex: {numComponents: 2, data: new Float32Array([])},
			a_alpha: {numComponents: 1, data: new Float32Array([])},
		};
		this.bufferInfo = twgl.createBufferInfoFromArrays(GL, attributes);

		this.textures = twgl.createTextures(GL, {
			sheet: {src: sheetURL, mag: GL.NEAREST},
		});
	}

	use() {
		const GL = this.gl;
		GL.useProgram(this.programInfo.program);
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
		GL.enable(GL.BLEND);
		GL.disable(GL.DEPTH_TEST);
	}

	render(cameraState: CameraState, state: BomberWomanViewState) {
		const GL = this.gl;
		// Compute the matrices
		var projectionMatrix = m3.projection(cameraState.renderWidth, cameraState.renderHeight);
		var scaleMatrix = m3.scaling(cameraState.renderScale, cameraState.renderScale);
		var translationMatrix = m3.translation(cameraState.renderX, cameraState.renderY);

		var viewMatrix = m3.multiply(translationMatrix, scaleMatrix);

		var matrix = m3.multiply(projectionMatrix, viewMatrix);
		const uniforms = {
			u_matrix: matrix,
			u_tex: this.textures['sheet'],
		};

		const numTiles = 6;
		const tileSize = this.size / (numTiles + 1);
		const offset = tileSize / 2;
		const attributes: Attributes = {
			positions: [],
			texs: [],
			alphas: [],
		};
		for (let avatarID of Object.keys(state.avatars)) {
			const avatar = state.avatars[avatarID];
			const {x, y} = bigIntIDToXY(avatar.position);
			drawAvatar(attributes, this.size, tileSize, x, y);
		}

		// we update the buffer with the new arrays
		twgl.setAttribInfoBufferFromArray(GL, this.bufferInfo.attribs!.a_position, attributes.positions);
		twgl.setAttribInfoBufferFromArray(GL, this.bufferInfo.attribs!.a_tex, attributes.texs);
		twgl.setAttribInfoBufferFromArray(GL, this.bufferInfo.attribs!.a_alpha, attributes.alphas);
		// we need to tell twgl the number of element to draw
		// see : https://github.com/greggman/twgl.js/issues/211
		this.bufferInfo.numElements = attributes.positions.length / 2;

		// we draw
		twgl.setBuffersAndAttributes(GL, this.programInfo, this.bufferInfo);
		twgl.setUniforms(this.programInfo, uniforms);
		twgl.drawBufferInfo(GL, this.bufferInfo, GL.TRIANGLES);
	}
}
