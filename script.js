const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");

const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const saturation = document.getElementById("saturation");

const enhanceBtn = document.getElementById("enhanceBtn");
const downloadBtn = document.getElementById("downloadBtn");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let originalImage = new Image();


// IMAGE UPLOAD
imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

        originalImage.onload = function () {

            previewImage.src = event.target.result;
            previewImage.style.display = "block";

        };

        originalImage.src = event.target.result;
    };

    reader.readAsDataURL(file);
});


// LIVE PREVIEW
function updatePreview() {

    if (!originalImage.src) return;

    previewImage.style.filter =
        `brightness(${brightness.value}%)
         contrast(${contrast.value}%)
         saturate(${saturation.value}%)`;
}


brightness.addEventListener("input", updatePreview);
contrast.addEventListener("input", updatePreview);
saturation.addEventListener("input", updatePreview);


// ENHANCE IMAGE
enhanceBtn.addEventListener("click", function () {

    if (!originalImage.src) {
        alert("Please choose an image first.");
        return;
    }

    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    ctx.filter =
        `brightness(${brightness.value}%)
         contrast(${contrast.value}%)
         saturate(${saturation.value}%)`;

    ctx.drawImage(
        originalImage,
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.filter = "none";

    alert("Image enhanced successfully!");
});


// DOWNLOAD IMAGE
downloadBtn.addEventListener("click", function () {

    if (!originalImage.src) {
        alert("Please enhance an image first.");
        return;
    }

    const link = document.createElement("a");

    link.download = "enhanced-image.png";

    link.href = canvas.toDataURL("image/png");

    link.click();
});
