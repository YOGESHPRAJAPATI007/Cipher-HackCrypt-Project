document.addEventListener("DOMContentLoaded", function () {
  var dropZone = document.getElementById("drop-zone");
  var fileInput = document.getElementById("file-input");
  var browseButton = document.getElementById("browse-button");
  var analyzeButton = document.getElementById("analyze-button");
  var fileNameElement = document.getElementById("file-name");
  var fileSizeElement = document.getElementById("file-size");
  var resultsContent = document.getElementById("results-content");

  var selectedFile = null;
  var analyzing = false;

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) {
      return "";
    }
    var kb = bytes / 1024;
    if (kb < 1024) {
      return kb.toFixed(1) + " KB";
    }
    var mb = kb / 1024;
    return mb.toFixed(2) + " MB";
  }

  function isSupportedFile(file) {
    if (!file || !file.name) {
      return false;
    }
    var name = file.name.toLowerCase();
    return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".mp4");
  }

  function updateFileMeta() {
    if (!selectedFile) {
      fileNameElement.textContent = "No file selected";
      fileSizeElement.textContent = "";
      return;
    }
    fileNameElement.textContent = selectedFile.name;
    fileSizeElement.textContent = formatFileSize(selectedFile.size);
  }

  function updateAnalyzeState() {
    analyzeButton.disabled = !selectedFile || analyzing;
    if (analyzing) {
      analyzeButton.textContent = "Analyzing...";
    } else {
      analyzeButton.textContent = "Analyze media";
    }
  }

  function clearResultsPlaceholder() {
    resultsContent.innerHTML = "";
  }

  function renderResultCard(payload) {
    clearResultsPlaceholder();
    var result = typeof payload.result === "string" ? payload.result : "";
    var confidence = typeof payload.confidence === "number" ? payload.confidence : null;
    var indicators = Array.isArray(payload.indicators) ? payload.indicators : [];

    var labelLower = result.toLowerCase();
    var labelMode = "uncertain";
    if (labelLower.indexOf("likely") !== -1 || labelLower.indexOf("authentic") !== -1) {
      labelMode = "likely";
    } else if (labelLower.indexOf("suspicious") !== -1) {
      labelMode = "suspicious";
    }

    var card = document.createElement("div");
    card.className = "result-card";
    if (labelMode === "suspicious") {
      card.classList.add("result-card--suspicious");
    } else if (labelMode === "uncertain") {
      card.classList.add("result-card--uncertain");
    }

    var labelRow = document.createElement("div");
    labelRow.className = "result-label-row";

    var label = document.createElement("div");
    label.className = "result-label";
    if (labelMode === "likely") {
      label.classList.add("result-label-likely");
    } else if (labelMode === "suspicious") {
      label.classList.add("result-label-suspicious");
    } else {
      label.classList.add("result-label-uncertain");
    }

    var labelDot = document.createElement("span");
    labelDot.className = "result-label-dot";
    var labelTextSpan = document.createElement("span");
    labelTextSpan.textContent = result || "Needs further verification";

    label.appendChild(labelDot);
    label.appendChild(labelTextSpan);

    var confidenceEl = document.createElement("div");
    confidenceEl.className = "result-confidence";
    if (confidence !== null) {
      var safeConfidence = Math.max(0, Math.min(100, confidence));
      confidenceEl.textContent = "Confidence: " + safeConfidence + "%";
    } else {
      confidenceEl.textContent = "Confidence: not available";
    }

    labelRow.appendChild(label);
    labelRow.appendChild(confidenceEl);

    var meta = document.createElement("div");
    meta.className = "result-meta";
    meta.textContent = "This is a probabilistic assessment and should be combined with human judgment.";

    var indicatorsTitle = document.createElement("div");
    indicatorsTitle.className = "result-indicators-title";
    indicatorsTitle.textContent = "Indicators observed";

    var indicatorsList = document.createElement("ul");
    indicatorsList.className = "result-indicators";
    if (indicators.length === 0) {
      var single = document.createElement("li");
      single.textContent = "No specific anomalies were strongly highlighted by the current checks.";
      indicatorsList.appendChild(single);
    } else {
      indicators.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        indicatorsList.appendChild(li);
      });
    }

    var disclaimer = document.createElement("div");
    disclaimer.className = "result-disclaimer";
    disclaimer.textContent = "This tool cannot guarantee that media is real or fake. Treat results as guidance, not proof.";

    card.appendChild(labelRow);
    card.appendChild(meta);
    card.appendChild(indicatorsTitle);
    card.appendChild(indicatorsList);
    card.appendChild(disclaimer);

    resultsContent.appendChild(card);
  }

  function renderErrorCard(title, message) {
    clearResultsPlaceholder();
    var card = document.createElement("div");
    card.className = "result-card result-card--error";

    var titleEl = document.createElement("div");
    titleEl.className = "error-title";
    titleEl.textContent = title;

    var messageEl = document.createElement("div");
    messageEl.className = "error-message";
    messageEl.textContent = message;

    card.appendChild(titleEl);
    card.appendChild(messageEl);
    resultsContent.appendChild(card);
  }

  function setSelectedFile(file) {
    selectedFile = file;
    updateFileMeta();
    updateAnalyzeState();
  }

  function handleFileSelection(file) {
    if (!file) {
      return;
    }
    if (!isSupportedFile(file)) {
      setSelectedFile(null);
      renderErrorCard("Unsupported file type", "Please upload a JPG, PNG, or MP4 file.");
      return;
    }
    setSelectedFile(file);
  }

  if (browseButton) {
    browseButton.addEventListener("click", function () {
      if (fileInput) {
        fileInput.click();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files.length > 0) {
        handleFileSelection(fileInput.files[0]);
      }
    });
  }

  if (dropZone) {
    ["dragenter", "dragover"].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add("drop-zone--active");
      });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove("drop-zone--active");
      });
    });

    dropZone.addEventListener("drop", function (event) {
      var files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    });
  }

  if (analyzeButton) {
    analyzeButton.addEventListener("click", function () {
      if (!selectedFile || analyzing) {
        return;
      }
      analyzing = true;
      updateAnalyzeState();

      var formData = new FormData();
      formData.append("file", selectedFile);

      var endpoint = "http://localhost:8000/analyze";

      fetch(endpoint, {
        method: "POST",
        body: formData
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().catch(function () {
              throw new Error("Unable to analyze this file right now.");
            }).then(function (data) {
              var detail = data && (data.detail || data.message);
              throw new Error(typeof detail === "string" ? detail : "Unable to analyze this file right now.");
            });
          }
          return response.json();
        })
        .then(function (data) {
          renderResultCard(data);
        })
        .catch(function (error) {
          renderErrorCard("Analysis error", error.message || "Something went wrong while talking to the analysis service.");
        })
        .finally(function () {
          analyzing = false;
          updateAnalyzeState();
        });
    });
  }

  updateFileMeta();
  updateAnalyzeState();
});

