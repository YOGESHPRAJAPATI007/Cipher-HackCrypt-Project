# Cipher-HackCrypt-Project
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Deepfake Detection AI</title>
    <link rel="stylesheet" href="style.css">

    <style>
        body {
            background: #0B1020;
            color: #E3C4D6;
            font-family: Arial, sans-serif;
        }

        .background {
            background: #0B1020;
        }

        .container {
            background: #151A2E;
        }

        h1 {
            color: #6D3B5D;
        }

        .subtitle {
            color: #B987A8;
        }

        .upload-box label {
            background: #8B4F75;
            color: #E3C4D6;
        }

        .upload-box label:hover {
            background: #B987A8;
        }

        .analyze-btn {
            background: #6D3B5D;
            color: #ffffff;
            border: none;
        }

        .analyze-btn:hover {
            background: #8B4F75;
        }

        .result-card {
            background: #151A2E;
            border: 1px solid #8B4F75;
        }

        .result-card h2 {
            color: #6D3B5D;
        }

        .result-item span {
            color: #B987A8;
        }

        .result-item strong,
        .result-item p {
            color: #E3C4D6;
        }
    </style>
</head>

<body>

<div class="background"></div>

<div class="container">
    <h1>Deepfake Detection AI</h1>
    <p class="subtitle">AI-powered Media Authenticity Analyzer</p>

    <form id="uploadForm">
        <div class="upload-box">
            <input type="file" id="fileInput" required>
            <label for="fileInput">
                <span>📂 Choose Image or Video</span>
            </label>
        </div>

        <button type="submit" class="analyze-btn">
            Analyze Media
        </button>
    </form>

    <div class="loader hidden" id="loader"></div>

    <div class="result-card hidden" id="result">
        <h2>Analysis Result</h2>
        <div class="result-item">
            <span>Status:</span>
            <strong id="status"></strong>
        </div>
        <div class="result-item">
            <span>Confidence:</span>
            <strong id="confidence"></strong>
        </div>
        <div class="result-item">
            <span>Explanation:</span>
            <p id="explanation"></p>
        </div>
    </div>
</div>

<script>
const form = document.getElementById("uploadForm");
const loader = document.getElementById("loader");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    loader.classList.remove("hidden");
    result.classList.add("hidden");

    const file = document.getElementById("fileInput").files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    loader.classList.add("hidden");
    result.classList.remove("hidden");

    document.getElementById("status").innerText = data.result;
    document.getElementById("confidence").innerText = data.confidence;
    document.getElementById("explanation").innerText = data.explanation;
});
</script>

</body>
</html>
