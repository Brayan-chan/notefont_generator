// Variables globales
let currentLetterIndex = 0;
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?';
let letterImages = {};
let customFont;

// Elementos del DOM
const canvas = document.getElementById('letterCanvas');
const ctx = canvas.getContext('2d');
const currentLetterSpan = document.getElementById('currentLetter');
const nextLetterButton = document.getElementById('nextLetter');
const generateFontButton = document.getElementById('generateFont');
const downloadFontButton = document.getElementById('downloadFont');
const loadFontInput = document.getElementById('loadFont');
const editor = document.getElementById('editor');

// Inicialización
function init() {
    currentLetterSpan.textContent = letters[currentLetterIndex];
    nextLetterButton.addEventListener('click', captureNextLetter);
    generateFontButton.addEventListener('click', generateFont);
    downloadFontButton.addEventListener('click', downloadFont);
    loadFontInput.addEventListener('change', loadFont);
    
    // Configurar el canvas para dibujar
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

// Variables para dibujar
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

function captureNextLetter() {
    // Guardar la imagen de la letra actual
    letterImages[letters[currentLetterIndex]] = canvas.toDataURL();
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Pasar a la siguiente letra
    currentLetterIndex++;
    if (currentLetterIndex < letters.length) {
        currentLetterSpan.textContent = letters[currentLetterIndex];
    } else {
        nextLetterButton.disabled = true;
        generateFontButton.disabled = false;
        currentLetterSpan.textContent = "¡Completado!";
    }
}

async function generateFont() {
    console.log("Generando fuente...");
    
    const notdefGlyph = new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        advanceWidth: 650,
        path: new opentype.Path()
    });

    const glyphs = [notdefGlyph];

    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const unicode = letter.charCodeAt(0);
        
        // Crear un elemento de imagen y cargar la imagen base64
        const img = new Image();
        img.src = letterImages[letter];
        
        // Esperar a que la imagen se cargue
        await new Promise(resolve => {
            img.onload = resolve;
        });

        // Crear un nuevo canvas para procesar la imagen
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        // Obtener los datos de la imagen
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Crear el contorno de la letra
        const path = new opentype.Path();
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const index = (y * imageData.width + x) * 4;
                if (imageData.data[index + 3] > 0) {  // Si el pixel no es transparente
                    path.moveTo(x, y);
                    path.lineTo(x + 1, y);
                    path.lineTo(x + 1, y + 1);
                    path.lineTo(x, y + 1);
                    path.close();
                }
            }
        }

        const glyph = new opentype.Glyph({
            name: letter,
            unicode: unicode,
            advanceWidth: 650,
            path: path
        });

        glyphs.push(glyph);
    }

    customFont = new opentype.Font({
        familyName: 'CustomFont',
        styleName: 'Regular',
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
        glyphs: glyphs
    });

    console.log("Fuente generada con éxito");
    downloadFontButton.disabled = false;
}

function downloadFont() {
    if (!customFont) {
        console.error("La fuente no ha sido generada aún");
        return;
    }

    console.log("Descargando fuente...");
    
    const fontArrayBuffer = customFont.toArrayBuffer();
    const blob = new Blob([fontArrayBuffer], {type: "application/octet-stream"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "CustomFont.ttf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Fuente descargada");
}

function loadFont(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fontFace = new FontFace('CustomFont', e.target.result);
            fontFace.load().then(function(loadedFace) {
                document.fonts.add(loadedFace);
                editor.classList.add('custom-font');
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

// Iniciar la aplicación
init();

