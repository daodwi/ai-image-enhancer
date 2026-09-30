import {
    pipeline,
    RawImage
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const resultImage = document.getElementById("resultImage");

const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const saturation = document.getElementById("saturation");

const aiBtn = document.getElementById("aiBtn");
const enhanceBtn = document.getElementById("enhanceBtn");
const downloadBtn = document.getElementById("downloadBtn");

const status = document.getElementById("status");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let originalImage = null;
let enhancedBlob = null;
let upscaler = null;


// ==============================
// IMAGE UPLOAD
// ==============================

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    enhancedBlob = null;
    resultImage.style.display = "none";

    status.textContent = "Loading image...";

    const reader = new FileReader();

    reader.onload = function (event) {

        originalImage = new Image();

        originalImage.onload = function () {

            previewImage.src = event.target.result;
            previewImage.style.display = "block";

            status.textContent =
                `Image loaded: ${originalImage.width} × ${originalImage.height}`;

            updatePreview();
        };

        originalImage.src = event.target.result;
    };

    reader.readAsDataURL(file);
});


// ==============================
// LIVE FILTER PREVIEW
// ==============================

function updatePreview() {

    if (!originalImage) return;

    previewImage.style.filter =
        `
        brightness(${brightness.value}%)
        contrast(${contrast.value}%)
        saturate(${saturation.value}%)
        `;
}

brightness.addEventListener("input", updatePreview);
contrast.addEventListener("input", updatePreview);
saturation.addEventListener("input", updatePreview);


// ==============================
// NORMAL ENHANCE
// ==============================

enhanceBtn.addEventListener("click", function () {

    if (!originalImage) {

        alert("Please choose an image first.");

        return;
    }

    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;

    ctx.filter =
        `
        brightness(${brightness.value}%)
        contrast(${contrast.value}%)
        saturate(${saturation.value}%)
        `;

    ctx.drawImage(
        originalImage,
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.filter = "none";

    canvas.toBlob(function (blob) {

        enhancedBlob = blob;

        resultImage.src =
            URL.createObjectURL(blob);

        resultImage.style.display = "block";

        status.textContent =
            "✨ Image enhanced successfully.";

    }, "image/png");
});


// ==============================
// LOAD AI MODEL
// ==============================

async function loadAIModel() {

    if (upscaler) {
        return upscaler;
    }

    status.textContent =
        "🤖 Loading AI model...";

    aiBtn.disabled = true;

    try {

        upscaler = await pipeline(
            "image-to-image",
            "Xenova/swin2SR-classical-sr-x2-64"
        );

        status.textContent =
            "🤖 AI model loaded.";

        return upscaler;

    } catch (error) {

        console.error(
            "AI MODEL ERROR:",
            error
        );

        status.textContent =
            "❌ Could not load AI model.";

        throw error;

    } finally {

        aiBtn.disabled = false;
    }
}


// ==============================
// AI 2× UPSCALE
// ==============================

aiBtn.addEventListener("click", async function () {

    if (!originalImage) {

        alert("Please choose an image first.");

        return;
    }

    aiBtn.disabled = true;
    enhanceBtn.disabled = true;
    downloadBtn.disabled = true;

    try {

        status.textContent =
            "🤖 Preparing image...";

        /*
         * Convert the browser image into
         * Transformers.js RawImage.
         */

        const inputCanvas =
            document.createElement("canvas");

        inputCanvas.width =
            originalImage.naturalWidth;

        inputCanvas.height =
            originalImage.naturalHeight;

        const inputCtx =
            inputCanvas.getContext("2d");

        inputCtx.drawImage(
            originalImage,
            0,
            0
        );

        const inputImage =
            RawImage.fromCanvas(
                inputCanvas
            );

        status.textContent =
            "🤖 Loading AI model...";

        const model =
            await loadAIModel();

        status.textContent =
            "🤖 AI is processing the image...";

        /*
         * Run Swin2SR.
         */

        const output =
            await model(inputImage);

        console.log(
            "AI output:",
            output
        );

        /*
         * The pipeline returns a RawImage.
         * Convert it to RGB for canvas rendering.
         */

        const outputImage =
            output.rgb();

        const width =
            outputImage.width;

        const height =
            outputImage.height;

        /*
         * Create output canvas.
         */

        canvas.width = width;
        canvas.height = height;

        const imageData =
            new ImageData(
                new Uint8ClampedArray(
                    outputImage.data
                ),
                width,
                height
            );

        ctx.putImageData(
            imageData,
            0,
            0
        );

        /*
         * Apply brightness,
         * contrast and saturation.
         */

        const finalCanvas =
            document.createElement("canvas");

        finalCanvas.width =
            width;

        finalCanvas.height =
            height;

        const finalCtx =
            finalCanvas.getContext("2d");

        finalCtx.filter =
            `
            brightness(${brightness.value}%)
            contrast(${contrast.value}%)
            saturate(${saturation.value}%)
            `;

        finalCtx.drawImage(
            canvas,
            0,
            0
        );

        finalCtx.filter = "none";

        /*
         * Convert final image to PNG.
         */

        finalCanvas.toBlob(
            function (blob) {

                if (!blob) {

                    throw new Error(
                        "Could not create output image."
                    );
                }

                enhancedBlob = blob;

                resultImage.src =
                    URL.createObjectURL(blob);

                resultImage.style.display =
                    "block";

                status.textContent =
                    `✅ AI 2× upscale complete: ${width} × ${height}`;

                downloadBtn.disabled =
                    false;

            },
            "image/png"
        );

    } catch (error) {

        console.error(
            "AI PROCESSING ERROR:",
            error
        );

        status.textContent =
            "❌ AI processing failed.";

        alert(
            "AI processing failed. Open the browser console to see the exact error."
        );

    } finally {

        aiBtn.disabled = false;
        enhanceBtn.disabled = false;
        downloadBtn.disabled = false;
    }
});


// ==============================
// DOWNLOAD
// ==============================

downloadBtn.addEventListener("click", function () {

    if (!enhancedBlob) {

        alert(
            "Please enhance or upscale an image first."
        );

        return;
    }

    const url =
        URL.createObjectURL(
            enhancedBlob
        );

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "ai-enhanced-image.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(function () {

        URL.revokeObjectURL(url);

    }, 1000);
});
