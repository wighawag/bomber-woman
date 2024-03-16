import sheetURL from '$data/assets/sheet.png';
import sheet from '$data/assets/sheet.json';
export {sheetURL};

export type Attributes = {positions: number[]; texs: number[]; alphas: number[]};

type Frame = {x: number; y: number; w: number; h: number};
type FrameData = {
	frame: Frame;
	rotated: boolean;
	trimmed: boolean;
	spriteSourceSize: Frame;
	sourceSize: {w: number; h: number};
};

type SheetData = typeof sheet;

type FrameDataWithUV = FrameData & {uvFrame: Frame; uv: number[]};

type TextureData = {
	[Property in keyof SheetData['frames']]: FrameDataWithUV;
};

const size = sheet.meta.size;
const texPerSprites: TextureData = sheet.frames as any;
for (const key of Object.keys(texPerSprites)) {
	const value = (texPerSprites as any)[key] as FrameDataWithUV;
	const x = value.frame.x / size.w;
	const y = value.frame.y / size.h;
	const w = value.frame.w / size.w;
	const h = value.frame.h / size.h;
	value.uvFrame = {
		x,
		y,
		w,
		h,
	};
	const x1 = x;
	const x2 = x + w;
	const y1 = y;
	const y2 = y + h;
	value.uv = [x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2];
}

function drawTile(
	attributes: Attributes,
	x1: number,
	y1: number,
	tile: FrameDataWithUV,
	tileSize: number,
	opacity: number,
) {
	const x2 = x1 + tileSize;
	const y2 = y1 + tileSize;

	attributes.positions.push(x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2);
	attributes.texs.push(...tile.uv);
	attributes.alphas.push(opacity, opacity, opacity, opacity, opacity, opacity); // TODO
}
