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
            const newWidthImg1 = 114.3000; // Ajuste de largura
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

        // Define as dimensões desejadas (794x1123 pixels)
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
        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;

        // Converte o canvas para BMP
        const bmpImageDataUrl = canvas.toDataURL('image/bmp');

        // Baixar o BMP
        const link = document.createElement('a');
        link.href = bmpImageDataUrl;
        link.download = 'Boleto.bmp';
        link.click();
    }).catch(function(error) {
        console.error('Erro ao carregar o PDF:', error);
    });
}
