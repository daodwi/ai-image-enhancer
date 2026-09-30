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


// =====================================
// ERROR DISPLAY
// =====================================

function showError(title, error) {

    console.error(title, error);

    let message = "";

    if (error instanceof Error) {
        message =
            `${error.name}: ${error.message}`;
    } else {
        message =
            String(error);
    }

    status.innerHTML = `
        <div style="
            margin-top:15px;
            padding:15px;
            border:1px solid #ef4444;
            border-radius:10px;
            background:#450a0a;
            color:#fecaca;
            text-align:left;
            word-break:break-word;
        ">
            <strong>❌ ${title}</strong>
            <br><br>
            <strong>Error:</strong>
            ${message}
        </div>
    `;
}


// =====================================
// IMAGE UPLOAD
// =====================================

imageInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) return;

        enhancedBlob = null;

        resultImage.style.display =
            "none";

        status.textContent =
            "Loading image...";

        const reader =
            new FileReader();

        reader.onload =
            function (event) {

                originalImage =
                    new Image();

                originalImage.onload =
                    function () {

                        previewImage.src =
                            event.target.result;

                        previewImage.style.display =
                            "block";

                        status.textContent =
                            `Image loaded: ${originalImage.naturalWidth} × ${originalImage.naturalHeight}`;

                        updatePreview();
                    };

                originalImage.onerror =
                    function (error) {

                        showError(
                            "Image loading failed",
                            error
                        );
                    };

                originalImage.src =
                    event.target.result;
            };

        reader.onerror =
            function (error) {

                showError(
                    "File reading failed",
                    error
                );
            };

        reader.readAsDataURL(file);
    }
);


// =====================================
// LIVE PREVIEW
// =====================================

function updatePreview() {

    if (!originalImage) return;

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


// =====================================
// NORMAL ENHANCE
// =====================================

enhanceBtn.addEventListener(
    "click",
    function () {

        if (!originalImage) {

            alert(
                "Please choose an image first."
            );

            return;
        }

        try {

            canvas.width =
                originalImage.naturalWidth;

            canvas.height =
                originalImage.naturalHeight;

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

            canvas.toBlob(
                function (blob) {

                    if (!blob) {

                        showError(
                            "Normal enhancement failed",
                            "Canvas could not create an image blob."
                        );

                        return;
                    }

                    enhancedBlob =
                        blob;

                    resultImage.src =
                        URL.createObjectURL(blob);

                    resultImage.style.display =
                        "block";

                    status.textContent =
                        "✨ Image enhanced successfully.";

                },
                "image/png"
            );

        } catch (error) {

            showError(
                "Normal enhancement failed",
                error
            );
        }
    }
);


// =====================================
// LOAD AI MODEL
// =====================================

async function loadAIModel() {

    if (upscaler) {
        return upscaler;
    }

    status.textContent =
        "🤖 Loading AI model...";

    try {

        upscaler =
            await pipeline(
                "image-to-image",
                "Xenova/swin2SR-classical-sr-x2-64"
            );

        status.textContent =
            "🤖 AI model loaded.";

        return upscaler;

    } catch (error) {

        showError(
            "AI model loading failed",
            error
        );

        throw error;
    }
}


// =====================================
// AI UPSCALE
// =====================================

aiBtn.addEventListener(
    "click",
    async function () {

        if (!originalImage) {

            alert(
                "Please choose an image first."
            );

            return;
        }

        aiBtn.disabled = true;
        enhanceBtn.disabled = true;
        downloadBtn.disabled = true;

        try {

            status.textContent =
                "🤖 Preparing image...";

            // -----------------------------
            // Create input canvas
            // -----------------------------

            const inputCanvas =
                document.createElement(
                    "canvas"
                );

            inputCanvas.width =
                originalImage.naturalWidth;

            inputCanvas.height =
                originalImage.naturalHeight;

            const inputCtx =
                inputCanvas.getContext(
                    "2d"
                );

            inputCtx.drawImage(
                originalImage,
                0,
                0
            );

            status.textContent =
                "🤖 Converting image for AI...";


            // -----------------------------
            // Convert to RawImage
            // -----------------------------

            const inputImage =
                RawImage.fromCanvas(
                    inputCanvas
                );


            console.log(
                "Input image:",
                inputImage
            );


            // -----------------------------
            // Load model
            // -----------------------------

            const model =
                await loadAIModel();


            // -----------------------------
            // Run AI
            // -----------------------------

            status.textContent =
                "🤖 AI is processing...";

            const output =
                await model(
                    inputImage
                );


            console.log(
                "Raw AI output:",
                output
            );


            // -----------------------------
            // Check output
            // -----------------------------

            if (!output) {

                throw new Error(
                    "AI returned an empty result."
                );
            }


            // -----------------------------
            // Convert output to RGB
            // -----------------------------

            const outputImage =
                output.rgb();


            console.log(
                "Output image:",
                outputImage
            );


            const width =
                outputImage.width;

            const height =
                outputImage.height;


            if (!width || !height) {

                throw new Error(
                    "AI output has invalid dimensions."
                );
            }


            // -----------------------------
            // Create canvas
            // -----------------------------

            canvas.width =
                width;

            canvas.height =
                height;


            const outputData =
                new Uint8ClampedArray(
                    outputImage.data
                );


            const imageData =
                new ImageData(
                    outputData,
                    width,
                    height
                );


            ctx.putImageData(
                imageData,
                0,
                0
            );


            // -----------------------------
            // Apply filters
            // -----------------------------

            const finalCanvas =
                document.createElement(
                    "canvas"
                );

            finalCanvas.width =
                width;

            finalCanvas.height =
                height;


            const finalCtx =
                finalCanvas.getContext(
                    "2d"
                );


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


            finalCtx.filter =
                "none";


            // -----------------------------
            // Create final PNG
            // -----------------------------

            finalCanvas.toBlob(
                function (blob) {

                    if (!blob) {

                        showError(
                            "Output creation failed",
                            "The browser could not create the final PNG."
                        );

                        return;
                    }


                    enhancedBlob =
                        blob;


                    resultImage.src =
                        URL.createObjectURL(
                            blob
                        );


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

            showError(
                "AI processing failed",
                error
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


// =====================================
// DOWNLOAD
// =====================================

downloadBtn.addEventListener(
    "click",
    function () {

        if (!enhancedBlob) {

            alert(
                "Please enhance or upscale an image first."
            );

            return;
        }


        try {

            const url =
                URL.createObjectURL(
                    enhancedBlob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;

            link.download =
                "ai-enhanced-image.png";


            document.body.appendChild(
                link
            );

            link.click();


            document.body.removeChild(
                link
            );


            setTimeout(
                function () {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );

        } catch (error) {

            showError(
                "Download failed",
                error
            );
        }
    }
);
