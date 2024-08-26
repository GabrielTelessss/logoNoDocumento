let pdfDocument; // Armazenar o PDF gerado

function gerarArquivoA4() {
    const image1 = document.getElementById('image1').files[0];

    if (!image1) {
        alert('Por favor, selecione pelo menos uma imagem.');
        return;
    }

    const reader1 = new FileReader();

    reader1.onload = function(e1) {
        const img1 = new Image();
        
        img1.onload = function() {
            const { jsPDF } = window.jspdf;
            pdfDocument = new jsPDF();

            // Ajusta as imagens para caber no formato A4
            const originalWidthImg1 = img1.width;
            const originalHeightImg1 = img1.height;
            const aspectRatioImg1 = originalWidthImg1 / originalHeightImg1;
            const newWidthImg1 = 75; // Ajuste de largura
            const newHeightImg1 = newWidthImg1 / aspectRatioImg1;

            pdfDocument.setGState(new pdfDocument.GState({ opacity: 0.1 }));
            pdfDocument.addImage(img1, 'JPEG', 2, 45, newWidthImg1, newHeightImg1); // X, y, largura, altura

            // Salva ou exibe o arquivo gerado
            const output = pdfDocument.output('blob');
            const url = URL.createObjectURL(output);
            document.getElementById('outputFrame').src = url;
        };

        img1.src = e1.target.result;
    };

    reader1.readAsDataURL(image1);
}

function gerarBitmap24Bits(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Header BMP
    const fileHeaderSize = 14;
    const dibHeaderSize = 40;
    const pixelArrayOffset = fileHeaderSize + dibHeaderSize;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = pixelArrayOffset + pixelArraySize;

    const buffer = new ArrayBuffer(fileSize);
    const dataView = new DataView(buffer);

    dataView.setUint8(0, 0x42); 
    dataView.setUint8(1, 0x4D); 
    dataView.setUint32(2, fileSize, true); // Tamanho do arquivo
    dataView.setUint32(6, 0, true); // Reservado
    dataView.setUint32(10, pixelArrayOffset, true); // Offset para o início dos dados de pixel

    dataView.setUint32(14, dibHeaderSize, true); // Tamanho do DIB header
    dataView.setUint32(18, width, true); // Largura da imagem
    dataView.setUint32(22, height, true); // Altura da imagem
    dataView.setUint16(26, 1, true); // Planes
    dataView.setUint16(28, 24, true); // Bits por pixel
    dataView.setUint32(30, 0, true); // Compressão
    dataView.setUint32(34, pixelArraySize, true); // Tamanho do array de pixels
    dataView.setUint32(38, 2835, true); // Resolução horizontal (pixels por metro)
    dataView.setUint32(42, 2835, true); // Resolução vertical (pixels por metro)
    dataView.setUint32(46, 0, true); // Número de cores na paleta (0 significa todas as cores possíveis)
    dataView.setUint32(50, 0, true); // Importância de cores (0 significa todas as cores são importantes)

    // Escrevendo os pixels no formato BMP
    let dataOffset = pixelArrayOffset;
    for (let y = height - 1; y >= 0; y--) {  // Inverte a ordem das linhas
        for (let x = 0; x < width; x++) {
            const index = (x + y * width) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            dataView.setUint8(dataOffset, b); // Blue
            dataView.setUint8(dataOffset + 1, g); // Green
            dataView.setUint8(dataOffset + 2, r); // Red
            dataOffset += 3;
        }
        // Preenchendo os bytes restantes da linha(se houver)
        dataOffset += rowSize - width * 3;
    }

    return new Blob([dataView], { type: 'image/bmp' });
}


async function downloadBmp() {
    if (!pdfDocument) {
        alert('Por favor, gere o PDF primeiro.');
        return;
    }

    // Renderiza o PDF em um canvas usando pdf.js
    const pdfData = pdfDocument.output('arraybuffer');
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });

    loadingTask.promise.then(async function(pdf) {
        const page = await pdf.getPage(1);

        // Define as dimensões desejadas
        const desiredWidth = 794;
        const desiredHeight = 1123;

        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(desiredWidth / viewport.width, desiredHeight / viewport.height);

        const scaledViewport = page.getViewport({ scale: scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Renderiza a página no canvas com as dimensões desejadas
        const renderTask = page.render({
            canvasContext: context,
            viewport: scaledViewport
        });

        // Aguardar a conclusão da renderização
        renderTask.promise.then(function() {
            // Gera o BMP de 24 bits
            const bmpBlob = gerarBitmap24Bits(canvas);

            // Baixar o BMP
            const link = document.createElement('a');
            link.href = URL.createObjectURL(bmpBlob);
            link.download = 'Boleto_24bits.bmp';
            link.click();
        }).catch(function(error) {
            console.error('Erro ao renderizar a página:', error);
        });

    }).catch(function(error) {
        console.error('Erro ao carregar o PDF:', error);
    });
}