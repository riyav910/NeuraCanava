import React, { useRef, useState, useEffect } from 'react';

const Neuracanavas = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [mode, setMode] = useState('draw');
  const [prompt, setPrompt] = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  const startDraw = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    ctxRef.current.closePath();
  };

  // Touch helpers
  const getTouchPos = (touchEvent) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = touchEvent.touches[0];
    return {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { offsetX, offsetY } = getTouchPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getTouchPos(e);
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const setDrawMode = () => {
    setMode('draw');
    ctxRef.current.globalCompositeOperation = 'source-over';
    ctxRef.current.lineWidth = 3;
  };

  const setEraseMode = () => {
    setMode('erase');
    ctxRef.current.globalCompositeOperation = 'destination-out';
    ctxRef.current.lineWidth = 15;
  };

  const clearCanvas = () => {
    ctxRef.current.globalCompositeOperation = 'source-over';
    ctxRef.current.fillStyle = 'white';
    ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawMode();
    setOutputUrl('');
  };

  const handleGenerate = async () => {
    const canvas = canvasRef.current;
    const imageDataUrl = canvas.toDataURL("image/png");

    setOutputUrl("");
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_data: imageDataUrl,
          prompt: prompt || "Paint this sketch beautifully.",
        }),
      });

      const data = await res.json();

      if (res.ok && data.generated_image) {
        setOutputUrl(data.generated_image);
      } else {
        setError(data.error || "Server error");
      }
    } catch (err) {
      console.error("API error:", err);
      setError("Failed to reach the backend.");
    }

    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-w-screen bg-gradient-to-br from-custom1 p-4">
      <div className="flex items-center mb-4">
        <span className="text-5xl">🎨</span>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-blue-400 to-red-500 text-transparent bg-clip-text">
          neuraCanavas
        </h1>
      </div>

      {/* Layout: Sketch & Output */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center">
        {/* Sketch Area */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center">
            <span className="text-xl">🖌️</span>
            <h2 className="text-xl font-bold bg-gradient-to-r from-teal-500 via-sky-500 to-teal-400 text-transparent bg-clip-text">
              Your Sketch
            </h2>
          </div>
          <div className="border shadow rounded bg-white touch-none">
            <canvas
              ref={canvasRef}
              className="w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px]"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDraw}
            />
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-center">
            <button
              onClick={setDrawMode}
              className="px-5 py-2 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 shadow-md hover:shadow-lg transition-all duration-300"
            >
              ✏️Draw
            </button>
            <button
              onClick={setEraseMode}
              className="px-5 py-2 rounded-2xl font-medium text-red-600 border border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
            >
              🧽Eraser
            </button>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 border rounded-md"
            />
            <button
              onClick={clearCanvas}
              className="px-5 py-2 rounded-xl font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center">
            <span className="text-xl">🖼</span>
            <h2 className="text-xl font-bold bg-gradient-to-r from-teal-500 via-sky-500 to-teal-400 text-transparent bg-clip-text">
              Generated Painting
            </h2>
          </div>
          <div className="w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] border rounded bg-white shadow flex items-center justify-center overflow-hidden">
            {outputUrl ? (
              <img
                src={outputUrl}
                alt="Generated painting"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400">Generated painting will appear here</span>
            )}
          </div>
          <div className="flex flex-wrap justify-center items-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating} // prevents spam clicks while generating
              className={`px-4 py-2 text-white text-md rounded-lg shadow-md transition
                ${isGenerating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
                }`}
            >
              {isGenerating ? "Generating Painting..." : "Generate Painting"}
            </button>

            {error && <p className="text-red-600 mt-2 font-medium">{error}</p>}
          </div>

        </div>
      </div>

      {/* Prompt and Generate */}
      <div className="w-full max-w-2xl mt-8 px-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">Optional Prompt</label>
        <textarea
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. watercolor, oil style, cartoon..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  );
};

export default Neuracanavas;