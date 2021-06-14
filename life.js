class PixelGrid {
	constructor(height, width, canvasId, pixelSize=5, parent=document.body) {
		this.height = height;
		this.width = width;
		this.pixelSize = pixelSize;

		this.canvas = document.createElement('canvas');
		this.canvas.height = this.height * this.pixelSize;
		this.canvas.width = this.width * this.pixelSize;
		this.canvas.id = canvasId;
		this.canvas.style.display = "inline-block";
		parent.append(this.canvas);

		this.ctx = this.canvas.getContext("2d");

		this.grid = new Array(this.width);
		for (let i = 0; i < this.width; i++) {
			this.grid[i] = new Array(this.height);
			for (let j = 0; j < this.height; j++) {
				this.grid[i][j] = 0;//xffffff;
			}
		}
	}

	update() {
		let fillColor = this.ctx.fillStyle;
		let strokeColor = this.ctx.strokeStyle;
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				let hex = this.decToHex(this.grid[i][j]);
				this.ctx.fillStyle = `rgb(${hex[0] * 16 + hex[1]}, ${hex[2] * 16 + hex[3]}, ${hex[4] * 16 + hex[5]})`;
				this.ctx.strokeStyle = `rgb(${hex[0] * 16 + hex[1]}, ${hex[2] * 16 + hex[3]}, ${hex[4] * 16 + hex[5]})`;
				this.ctx.fillRect(i * this.pixelSize, j * this.pixelSize, (i+1) * this.pixelSize, (j+1) * this.pixelSize);
			}
		}

		this.ctx.fillStyle = fillColor;
		this.ctx.strokeStyle = strokeColor;

		this.cells = [];
		for (let i = 0; i < this.grid.length; i++) {
			this.cells = this.cells.concat(this.grid[i]);
		}
	}

	decToHex(dec) {
		let hexNum = new Array(6);

		for (let i = 0; i < 6; i++) {
			hexNum[6 - i - 1] = dec % 16;
			dec = parseInt(dec / 16);
		}

		return hexNum;
	}

	hexToDec(hex) {
		let dec = 0;

		for (let i = hex.length - 1; i >= 0; i--) {
			dec += hex[i] * (16 ** (hex.length - i - 1));
		}

		return dec;
	}
}

function gridToBin(array) {
    var tempArray = [[]];
    var binArray = [];
    var byteArray = [];

    var index = 0;

    for (var i in array) {
        if (i % 8 == 0 && i != 0) {
            index++
            tempArray[index] = []
        }
        tempArray[index].push(array[i]);
    }

    for (var i in tempArray) {
        binArray[i] = "";
        for(var j in tempArray[i]) {
            if (tempArray[i][j]) {
                binArray[i] += '1'
            } else {
                binArray[i] += '0'
            }
        }
        if (binArray[i].length != 8) {
            binArray[i] += '0'.repeat(8 - binArray[i].length);
        }
    }

    for (var i in binArray) {
        byteArray[i] = parseInt(binArray[i], 2);
    }

    return Uint8Array.from(byteArray);
}

function saveFile(file, filename) {
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";
	var url = window.URL.createObjectURL(file);
	a.href = url;
	a.download = filename;
	a.click();
	window.URL.revokeObjectURL(url);
	a.remove();
}

function loadFile(e) {
	var file = e.target.files[0];
	if (!file) {
	  	return;
	}
	var read = new FileReader();

	read.readAsArrayBuffer(file);

	read.onloadend = function() {
		var data = new Uint8Array(read.result);

		var numsArray = [];
		for (var i in data) {
			var binary = (data[i] >>> 0).toString(2);
			numsArray[i] = binary;
			if (numsArray[i].length != 8) {
				numsArray[i] = '0'.repeat(8 - binary.length) + binary;
			}
		}

		for (let i = 0; i < pixelGrid.grid.length; i++) {
			for (let j = 0; j < pixelGrid.grid[i].length; j++) {
				pixelGrid.grid[i][j] = 0;
			}
		}

		var cells = "";

		for (var i in numsArray) {
			for (var j in numsArray[i]) {
				cells += numsArray[i][j];
			}
		}
		
		var row = 0;
		var column = 0;

		for (var i in cells) {
			if (cells[i] == '0') {
				pixelGrid.grid[row][column] = 0;
			} else {
				pixelGrid.grid[row][column] = 0xFFFFFF;
			}

			column++

			if (column == 64 && row != 63) {
				column = 0;
				row++
			}
		}

		genNum = 0;
		pixelGrid.update();
		genNumLabel.innerText = `Generation #${genNum}`;
	}
}  

let genNumLabel = document.createElement('div');
genNumLabel.style.display = 'inline-block';
genNumLabel.innerText = 'Generation #0';

let genNum = 0;
function step() {
	let buffer = new Array(pixelGrid.grid.length);
	for (let i = 0; i < buffer.length; i++) {
		buffer[i] = pixelGrid.grid[i].slice();
	}

	for (let i = 0; i < buffer.length; i++) {
		for (let j = 0; j < buffer[i].length; j++) {
			let alive = 0;

			for (let x = -1; x <= 1; x++) {
				for (let y = -1; y <= 1; y++) {
					if (!(x == 0 && y == 0)) {
						let x_ = x + i;
						let y_ = y + j;

						if (x_ < 0) {
							x_ = buffer.length + x_;
						}
						if (x_ >= buffer.length) {
							x_ = buffer.length % x_;
						}
						if (y_ < 0) {
							y_ = buffer[i].length + y_;
						}
						if (y_ >= buffer[i].length) {
							y_ = buffer[i].length % y_;
						}

						if (pixelGrid.grid[x_][y_] == 0xFFFFFF) {
							alive++;
						}
					}
				}
			}

			if (alive == 3) {
				buffer[i][j] = 0xFFFFFF;
			} else if (alive == 2 && pixelGrid.grid[i][j] == 0xFFFFFF) {
				buffer[i][j] = 0xFFFFFF;
			} else if (pixelGrid.grid[i][j] != 0) {
				buffer[i][j] = 0;
			}
		}
	}

	pixelGrid.grid = buffer;
	pixelGrid.update();
	genNumLabel.innerText = `Generation #${++genNum}`;
}

let pixelGrid = new PixelGrid(64, 64, "canvas", 10);

let button = document.createElement('input');
button.type = 'button';
button.value = 'Start';
button.style.display = 'inline-block';

let nextButton = document.createElement('input');
nextButton.type = 'button';
nextButton.value = 'Next';
Object.assign(nextButton.style, {
	display: 'inline-block',
	marginLeft: '10px'
});

let randomButton = document.createElement('input');
randomButton.type = 'button';
randomButton.value = 'Random';
Object.assign(randomButton.style, {
	display: 'inline-block',
	marginLeft: '10px'
});

let clearButton = document.createElement('input');
clearButton.type = 'button';
clearButton.value = 'Clear';
Object.assign(clearButton.style, {
	display: 'inline-block',
	marginLeft: '10px'
});

let saveButton = document.createElement('input');
saveButton.type = 'button';
saveButton.value = 'Save';
Object.assign(saveButton.style, {
	display: 'inline-block',
	marginLeft: '10px'
});

let loadInput = document.createElement('input');
loadInput.type = 'file';
loadInput.style.display = 'none';

let loadButton = document.createElement('input');
loadButton.type = 'button';
loadButton.value = 'Load'
Object.assign(loadButton.style, {
	display: 'inline-block',
	marginLeft: '10px'
});

let input = document.createElement('input');
input.type = 'range';
input.min = 1;
input.max = 999;
input.value = 800;
input.style.marginLeft = '10px';

let dataBlock = document.createElement('div');
Object.assign(dataBlock.style, {
	display: 'inline-block',
	marginLeft: '8px'
});

let buttonBlock = document.createElement('div');
buttonBlock.style.display = 'block';
Object.assign(dataBlock.style, {
	marginTop: '10px',
	marginLeft: '10px'
});

let credits = document.createElement('div');
credits.innerText = 'Made by ';
Object.assign(credits.style, {
	position: 'absolute',
	left: 0,
	bottom: 0,
	margin: '10px'
});

let authorURL = document.createElement('a');
authorURL.innerText = 'Dest0re';
authorURL.href = 'https://dest0re.ru/';

let speed = 1000 - parseInt(input.value);
let speedLabel = document.createElement('div');
speedLabel.style.display = '';
speedLabel.innerText = `One generation: ${speed}ms`;

dataBlock.append(speedLabel);
dataBlock.append(genNumLabel);
buttonBlock.append(button);
buttonBlock.append(nextButton);
buttonBlock.append(randomButton);
buttonBlock.append(clearButton);
buttonBlock.append(saveButton);
buttonBlock.append(loadButton);
buttonBlock.append(loadInput);
document.body.append(dataBlock);
document.body.append(buttonBlock);
document.body.append(input);
document.body.append(credits);
credits.append(authorURL);

function onClick(e) {
	let x = parseInt((e.pageX - canvas.offsetLeft) / pixelGrid.pixelSize);
	let y = parseInt((e.pageY - canvas.offsetTop) / pixelGrid.pixelSize);

	if (pixelGrid.grid[x][y] == 0xFFFFFF) {
		pixelGrid.grid[x][y] = 0;
	} else {
		pixelGrid.grid[x][y] = 0xFFFFFF;
	}

	pixelGrid.update();
}

pixelGrid.canvas.onmousedown = onClick;
pixelGrid.canvas.ontouchend = onClick;

let interval;
button.onclick = () => {
	speed = 1000 - parseInt(input.value);

	if (button.value == 'Start') {
		interval = setInterval(step, speed);
		button.value = 'Stop';
	} else {
		clearInterval(interval);
		button.value = 'Start';
	}
}

nextButton.onclick = () => {
	step();
}

input.oninput = () => {
	speed = 1000 - parseInt(input.value);
	speedLabel.innerText = `One generation: ${speed}ms`;
	if (button.value == 'Stop') {
		clearInterval(interval);
		interval = setInterval(step, speed);
	}
}

randomButton.onclick = () => {
	for (let i = 0; i < pixelGrid.grid.length; i++) {
		for (let j = 0; j < pixelGrid.grid[i].length; j++) {
			pixelGrid.grid[i][j] = 0;
			if (Math.floor(Math.random() * 5) + 1 == 5) {
				pixelGrid.grid[i][j] = 0xFFFFFF;
			}
		}
	}
	genNum = 0;
	pixelGrid.update();
	genNumLabel.innerText = `Generation #${genNum}`;
}

clearButton.onclick = () => {
	for (let i = 0; i < pixelGrid.grid.length; i++) {
		for (let j = 0; j < pixelGrid.grid[i].length; j++) {
			pixelGrid.grid[i][j] = 0;
		}
	}
	genNum = 0;
	pixelGrid.update();
	genNumLabel.innerText = `Generation #${genNum}`;
}

saveButton.onclick = () => {
	var cells = [];

	for (let i = 0; i < pixelGrid.grid.length; i++) {
		cells = cells.concat(pixelGrid.grid[i]);
	}

	let file = new Blob([gridToBin(cells)], {type: 'application/octet-stream'});
	saveFile(file, 'data.bin');
}

loadButton.onclick = () => {
	loadInput.click();
}

loadInput.onchange = loadFile;

pixelGrid.update();