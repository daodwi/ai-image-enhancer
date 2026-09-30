import { pipeline } from
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";


const imageInput =
    document.getElementById("imageInput");

const previewImage =
    document.getElementById("previewImage");

const resultImage =
    document.getElementById("resultImage");

const brightness =
    document.getElementById("brightness");

const contrast =
    document.getElementById("contrast");

const saturation =
    document.getElementById("saturation");

const aiBtn =
    document.getElementById("aiBtn");

const enhanceBtn =
    document.getElementById("enhanceBtn");

const downloadBtn =
    document.getElementById("downloadBtn");

const status =
    document.getElementById("status");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


let originalImage = new Image();

let enhancedBlob = null;

let upscaler = null;


// -----------------------------
// IMAGE UPLOAD
// -----------------------------

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    enhancedBlob = null;

    resultImage.style.display = "none";

    status.textContent =
        "Loading image...";

    const reader =
        new FileReader();

    reader.onload = function (event) {

        originalImage.onload = function () {

            previewImage.src =
                event.target.result;

            previewImage.style.display =
                "block";

            status.textContent =
                `Image loaded: ${originalImage.width} × ${originalImage.height}`;

            updatePreview();

        };

        originalImage.src =
            event.target.result;
    };

    reader.readAsDataURL(file);
});


// -----------------------------
// FILTER PREVIEW
// -----------------------------

function updatePreview() {

    if (!originalImage.src) {
        return;
    }

    previewImage.style.filter =
        `
        brightness(${brightness.value}%)
        contrast(${contrast.value}%)
        saturate(${saturation.value}%)
        `;
}


brightness.addEventListener(
    "input",
    updatePreview
);

contrast.addEventListener(
    "input",
    updatePreview
);

saturation.addEventListener(
    "input",
    updatePreview
);


// -----------------------------
// NORMAL ENHANCE
// -----------------------------

enhanceBtn.addEventListener(
    "click",
    function () {

        if (!originalImage.src) {

            alert(
                "Please choose an image first."
            );

            return;
        }

        canvas.width =
            originalImage.width;

        canvas.height =
            originalImage.height;

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

        resultImage.src =
            canvas.toDataURL("image/png");

        resultImage.style.display =
            "block";

        enhancedBlob = null;

        status.textContent =
            "Image enhanced successfully.";
    }
);


// -----------------------------
// LOAD AI MODEL
// -----------------------------

async function loadAIModel() {

    if (upscaler) {
        return upscaler;
    }

    status.textContent =
        "🤖 Loading AI model... First time may take a while.";

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

        console.error(error);

        status.textContent =
            "❌ AI model could not be loaded.";

        alert(
            "AI model loading failed. Check your internet connection and browser console."
        );

        throw error;

    } finally {

        aiBtn.disabled = false;
    }
}


// -----------------------------
// AI UPSCALE
// -----------------------------

aiBtn.addEventListener(
    "click",
    async function () {

        if (!originalImage.src) {

            alert(
                "Please choose an image first."
            );

            return;
        }

        aiBtn.disabled = true;

        enhanceBtn.disabled = true;

        downloadBtn.disabled = true;

        status.textContent =
            "🤖 AI is processing your image...";

        try {

            const model =
                await loadAIModel();

            status.textContent =
                "🤖 Upscaling image... Please wait.";

            const output =
                await model(originalImage);

            /*
             * Transformers.js returns a RawImage.
             * Convert its RGB pixel data to a canvas.
             */

            const width =
                output.width;

            const height =
                output.height;

            const imageData =
                new ImageData(
                    new Uint8ClampedArray(
                        output.data
                    ),
                    width,
                    height
                );

            canvas.width =
                width;

            canvas.height =
                height;

            ctx.putImageData(
                imageData,
                0,
                0
            );

            /*
             * Apply the user's enhancement
             * settings after AI upscaling.
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

            finalCanvas.toBlob(
                function (blob) {

                    if (!blob) {

                        throw new Error(
                            "Could not create image."
                        );
                    }

                    enhancedBlob =
                        blob;

                    resultImage.src =
                        URL.createObjectURL(blob);

                    resultImage.style.display =
                        "block";

                    status.textContent =
                        `✅ AI upscale complete: ${width} × ${height}`;

                    downloadBtn.disabled =
                        false;
                },
                "image/png"
            );

        } catch (error) {

            console.error(error);

            status.textContent =
                "❌ AI processing failed.";

            alert(
                "AI processing failed. Try a smaller image."
            );

        } finally {

            aiBtn.disabled =
                false;

            enhanceBtn.disabled =
                false;

            downloadBtn.disabled =
                false;
        }
    }
);


// -----------------------------
// DOWNLOAD
// -----------------------------

downloadBtn.addEventListener(
    "click",
    function () {

        if (enhancedBlob) {

            const url =
                URL.createObjectURL(
                    enhancedBlob
                );

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                "ai-enhanced-image.png";

            link.click();

            setTimeout(
                function () {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );

            return;
        }


        if (!canvas.width) {

            alert(
                "Please enhance an image first."
            );

            return;
        }


        const link =
            document.createElement("a");

        link.download =
            "enhanced-image.png";

        link.href =
            canvas.toDataURL(
                "image/png"
            );

        link.click();
    }
);
