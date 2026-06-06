document.addEventListener('DOMContentLoaded', () => {
  let currentResult = "";
  let currentAnalyzedImageUrl = "";
  let currentFile = null;

  const fileInput = document.getElementById('file-input');
  const uploadArea = document.getElementById('upload-area');
  const analyzeBtn = document.getElementById('analyze-btn');
  const previewContainer = document.getElementById('preview-container');
  const resultEl = document.getElementById('result');
  const fileInfo = document.getElementById('file-info');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const analyzeText = document.getElementById('analyze-text');
  const analyzeSpinner = document.getElementById('analyze-spinner');

  if (!fileInput || !uploadArea || !analyzeBtn) return;

  // File handling with enhanced UX
  fileInput.addEventListener('change', handleFile);
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
    // Add visual feedback during drag
    uploadArea.style.transform = 'scale(1.02)';
  });
  uploadArea.addEventListener('dragleave', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    uploadArea.style.transform = 'scale(1)';
  });
  uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      uploadArea.style.transform = 'scale(1)';
      if (e.dataTransfer.files.length) handleFile({ target: { files: e.dataTransfer.files } });
  });

  function handleFile(e) {
      const file = e.target.files[0];
      if (!file) return;

      // Reset state
      currentResult = "";
      currentAnalyzedImageUrl = "";
      resultEl?.classList.add('hidden');
      progressContainer?.classList.add('hidden');

      // Show file info with enhanced formatting
      const fileSize = (file.size / 1024 / 1024).toFixed(2);
      fileInfo.textContent = `${file.name} (${fileSize} MB) - ${formatFileType(file.type)}`;
      fileInfo.classList.remove('hidden');

      // Create preview based on file type
      const url = URL.createObjectURL(file);
      
      if (file.type.startsWith('image/')) {
        // Handle image preview
        const previewImg = document.getElementById('preview-img');
        if (previewImg) {
          previewImg.src = url;
          previewContainer.classList.remove('hidden');
        }
      } else if (file.type.startsWith('video/')) {
        // Handle video preview
        const previewVid = document.getElementById('preview-vid');
        if (previewVid) {
          previewVid.src = url;
          previewContainer.classList.remove('hidden');
        }
      }
      
      analyzeBtn.classList.remove('hidden');
      currentFile = file;
  }

  // Enhanced analyze function with better UX
  analyzeBtn.addEventListener('click', async () => {
      if (!currentFile) return;

      // Show loading state
      resultEl?.classList.add('hidden');
      if (progressContainer) {
        progressContainer.classList.remove('hidden');
      }
      analyzeBtn.disabled = true;
      analyzeText.textContent = 'Analyzing...';
      analyzeSpinner.classList.remove('hidden');
      analyzeBtn.classList.add('pulse-animation');

      // Simulate progress with realistic timing
      let progress = 0;
      const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
          }
          if (progressBar) {
            progressBar.style.width = `${progress}%`;
          }
      }, 200);

      const formData = new FormData();
      formData.append('file', currentFile);

      const isImagePage = window.location.pathname.includes('/image');
      const endpoint = isImagePage ? '/api/upload-image' : '/api/upload-video';

      try {
          const res = await fetch(endpoint, { method: 'POST', body: formData });
          const data = await res.json();

          clearInterval(interval);
          if (progressBar) {
            progressBar.style.width = '100%';
          }
          
          currentResult = data.result;
          currentAnalyzedImageUrl = "/" + data.analyzed_image;

          // Update result with enhanced animations
          updateResultDisplay(currentResult, currentAnalyzedImageUrl);
          
          resultEl?.classList.remove('hidden');
          if (progressContainer) {
            progressContainer.classList.add('hidden');
          }
      } catch (err) {
          console.error('Analysis failed:', err);
          alert("Analysis failed. Please try again.");
          clearInterval(interval);
          if (progressContainer) {
            progressContainer.classList.add('hidden');
          }
      } finally {
          analyzeBtn.disabled = false;
          analyzeText.textContent = isImagePage ? '🔍 Analyze Image' : '🔍 Analyze Video';
          analyzeSpinner.classList.add('hidden');
          analyzeBtn.classList.remove('pulse-animation');
      }
  });

  // Enhanced result display with better UX
  function updateResultDisplay(result, imageUrl) {
    const resultBadge = document.getElementById('result-badge');
    const resultIcon = document.getElementById('result-icon');
    const resultDescription = document.getElementById('result-description');
    
    if (!resultBadge || !resultIcon || !resultDescription) return;
    
    resultBadge.textContent = result;
    resultBadge.className = result === "AI" ? "result-badge ai" : "result-badge";
    
    if (result === "AI") {
      resultIcon.className = "fas fa-exclamation-triangle text-5xl text-red-400 pulse-animation";
      resultDescription.textContent = "This content shows signs of AI generation or manipulation. Our advanced algorithms detected synthetic patterns.";
    } else {
      resultIcon.className = "fas fa-check-circle text-5xl text-green-400 pulse-animation";
      resultDescription.textContent = "This content appears to be authentic. No signs of AI generation or manipulation were detected.";
    }
    
    // Add subtle animation to result
    resultEl.style.opacity = '0';
    resultEl.style.transform = 'translateY(20px)';
    setTimeout(() => {
      resultEl.style.transition = 'all 0.5s ease';
      resultEl.style.opacity = '1';
      resultEl.style.transform = 'translateY(0)';
    }, 50);
  }

  // Enhanced TTS functionality
  document.getElementById('explain-btn')?.addEventListener('click', async () => {
      if (!currentResult) {
          alert("Please analyze a file first.");
          return;
      }
      
      // Add loading state to button
      const explainBtn = document.getElementById('explain-btn');
      if (explainBtn) {
        explainBtn.innerHTML = '<span class="loading-spinner mr-2"></span> Playing...';
        explainBtn.disabled = true;
      }

      try {
          const res = await fetch(`/api/tts?label=${encodeURIComponent(currentResult)}`);
          const blob = await res.blob();
          document.getElementById('tts-player').src = URL.createObjectURL(blob);
          document.getElementById('tts-player').play();
          
          // Reset button after playback
          document.getElementById('tts-player').onended = () => {
            if (explainBtn) {
              explainBtn.innerHTML = '<i class="fas fa-volume-up mr-2"></i>Explain';
              explainBtn.disabled = false;
            }
          };
      } catch (err) {
          console.error('TTS failed:', err);
          alert("Text-to-speech failed. Please try again.");
          if (explainBtn) {
            explainBtn.innerHTML = '<i class="fas fa-volume-up mr-2"></i>Explain';
            explainBtn.disabled = false;
          }
      }
  });

  // Enhanced Share Card functionality
  document.getElementById('share-btn')?.addEventListener('click', () => {
      if (!currentAnalyzedImageUrl) {
          alert("No analyzed image available.");
          return;
      }

      // Add loading state to button
      const shareBtn = document.getElementById('share-btn');
      if (shareBtn) {
        shareBtn.innerHTML = '<span class="loading-spinner mr-2"></span>Generating...';
        shareBtn.disabled = true;
      }

      const canvas = document.getElementById('share-canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 400, 400);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
          const temp = document.createElement('canvas');
          const tctx = temp.getContext('2d');
          temp.width = img.width;
          temp.height = img.height;
          tctx.drawImage(img, 0, 0);
          ctx.filter = 'blur(12px)';
          ctx.drawImage(temp, 0, 0, 400, 400);
          ctx.filter = 'none';

          ctx.font = 'bold 72px "Inter", sans-serif';
          ctx.fillStyle = currentResult === "AI" ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(currentResult, 200, 190);

          const qrCanvas = document.createElement('canvas');
          new QRCode(qrCanvas, { 
            text: window.location.href, 
            width: 60, 
            height: 60,
            correctLevel: QRCode.CorrectLevel.M 
          });
          ctx.drawImage(qrCanvas, 330, 330, 60, 60);

          const link = document.createElement('a');
          link.download = `VisionGuard_${currentResult}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.click();
          
          // Reset button
          if (shareBtn) {
            shareBtn.innerHTML = '<i class="fas fa-share-alt mr-2"></i>Share Card';
            shareBtn.disabled = false;
          }
      };
      img.onerror = () => {
          alert("Failed to load image for sharing.");
          if (shareBtn) {
            shareBtn.innerHTML = '<i class="fas fa-share-alt mr-2"></i>Share Card';
            shareBtn.disabled = false;
          }
      };
      img.src = currentAnalyzedImageUrl;
  });

  // Helper function to format file types for display
  function formatFileType(fileType) {
    if (fileType.startsWith('image/')) {
      return 'Image';
    } else if (fileType.startsWith('video/')) {
      return 'Video';
    }
    return 'File';
  }

  // Add keyboard navigation support
  document.addEventListener('keydown', (e) => {
    // Allow Escape to clear the current file
    if (e.key === 'Escape') {
      if (currentFile) {
        currentFile = null;
        if (previewContainer) previewContainer.classList.add('hidden');
        if (resultEl) resultEl.classList.add('hidden');
        if (analyzeBtn) analyzeBtn.classList.add('hidden');
        if (fileInfo) fileInfo.classList.add('hidden');
      }
    }
  });

  // Add touch support for mobile devices
  if ('ontouchstart' in window) {
    uploadArea.classList.add('touch-device');
  }
});