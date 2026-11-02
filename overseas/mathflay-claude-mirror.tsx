import React, { useState, useEffect, useRef, useCallback } from 'react';

const mathSymbols = [
  '∑', '∏', '∫', '∂', '∇', '∞', '√', 'π', 'θ', 'λ', 'μ', 'σ', 'Δ', 'Ω', 'α', 'β', 'γ', 'ε',
  '±', '×', '÷', '≠', '≈', '≤', '≥', '∈', '∉', '⊂', '⊃', '∪', '∩', '∧', '∨', '⊥', '∥',
  'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'exp', 'max', 'min',
  'f(x)', 'g(x)', 'dy/dx', '∫dx', 'Σn', 'n!', 'xⁿ', 'eˣ', '|x|',
  '1+1=3?', '2×2=5?', '3+3=7?', '4÷2=3?', '5-2=4?', '6×3=17?', '7+8=14?', '9-4=6?',
  'x²+y²=r²', 'E=mc²', 'a²+b²=c²', 'F=ma', 'PV=nRT',
  '∮', '⊕', '⊗', '≡', '∝', '∀', '∃', '¬', '→', '↔', '⇒', '⇔',
  'φ', 'ψ', 'ω', 'ζ', 'η', 'ξ', 'ρ', 'τ', 'υ', 'χ',
  '∅', 'ℕ', 'ℤ', 'ℚ', 'ℝ', 'ℂ', '℘', 'ℵ',
  'matrix', 'det', 'rank', 'trace', 'dim', 'ker', 'span',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '+', '-', '=', '<', '>', '(', ')', '[', ']', '{', '}'
];

const getRandomMath = () => mathSymbols[Math.floor(Math.random() * mathSymbols.length)];

export default function MathExplosion() {
  const [image, setImage] = useState(null);
  const [imgSize, setImgSize] = useState({ width: 600, height: 400 });
  const [particles, setParticles] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const [settings, setSettings] = useState({
    speed: 80,
    disappearRadius: 0.9,
    spawnInterval: 150,
    initialSize: 8,
    growthRate: 0.15,
    centerX: 50,
    centerY: 50,
    fadeStart: 0.3,
  });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const particleIdRef = useRef(0);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setImgSize({ width: img.width, height: img.height });
          setImage(ev.target.result);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const spawnParticle = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const id = particleIdRef.current++;
    return {
      id,
      text: getRandomMath(),
      angle,
      distance: 0,
      createdAt: Date.now(),
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (now - lastSpawnRef.current > settings.spawnInterval) {
        setParticles(prev => [...prev, spawnParticle()]);
        lastSpawnRef.current = now;
      }

      setParticles(prev => {
        const maxDist = Math.min(imgSize.width, imgSize.height) * settings.disappearRadius / 2;
        return prev
          .map(p => ({ ...p, distance: p.distance + settings.speed * delta }))
          .filter(p => p.distance < maxDist);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, settings, spawnParticle, imgSize]);

  const renderParticle = (p) => {
    const maxDist = Math.min(imgSize.width, imgSize.height) * settings.disappearRadius / 2;
    const progress = p.distance / maxDist;
    const size = settings.initialSize + p.distance * settings.growthRate;
    const opacity = progress < settings.fadeStart ? 1 : 1 - (progress - settings.fadeStart) / (1 - settings.fadeStart);
    
    const centerX = (settings.centerX / 100) * imgSize.width;
    const centerY = (settings.centerY / 100) * imgSize.height;
    const x = centerX + Math.cos(p.angle) * p.distance;
    const y = centerY + Math.sin(p.angle) * p.distance;

    return (
      <div
        key={p.id}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
          fontSize: size,
          fontWeight: 'bold',
          color: 'white',
          textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 2px rgba(0,0,0,0.5)',
          opacity: Math.max(0, opacity),
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'monospace',
        }}
      >
        {p.text}
      </div>
    );
  };

  const captureFrame = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = imgSize.width;
    canvas.height = imgSize.height;

    if (image) {
      const img = new Image();
      img.src = image;
      await new Promise(r => img.onload = r);
      ctx.drawImage(img, 0, 0, imgSize.width, imgSize.height);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, imgSize.width, imgSize.height);
    }

    const maxDist = Math.min(imgSize.width, imgSize.height) * settings.disappearRadius / 2;
    const centerX = (settings.centerX / 100) * imgSize.width;
    const centerY = (settings.centerY / 100) * imgSize.height;

    particles.forEach(p => {
      const progress = p.distance / maxDist;
      const size = settings.initialSize + p.distance * settings.growthRate;
      const opacity = progress < settings.fadeStart ? 1 : 1 - (progress - settings.fadeStart) / (1 - settings.fadeStart);
      const x = centerX + Math.cos(p.angle) * p.distance;
      const y = centerY + Math.sin(p.angle) * p.distance;

      ctx.save();
      ctx.font = `bold ${size}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, x, y);
      ctx.fillStyle = '#fff';
      ctx.fillText(p.text, x, y);
      ctx.restore();
    });

    return canvas.toDataURL('image/png');
  };

  const exportImage = async () => {
    const dataUrl = await captureFrame();
    const link = document.createElement('a');
    link.download = 'math-explosion.png';
    link.href = dataUrl;
    link.click();
  };

  const exportGif = async () => {
    setExporting(true);
    setExportProgress(0);
    
    const frames = [];
    const totalFrames = 24;
    const frameInterval = 2000 / totalFrames;
    
    const wasRunning = isRunning;
    setIsRunning(false);
    
    await new Promise(r => setTimeout(r, 100));
    
    const savedParticles = [...particles];
    const maxDist = Math.min(imgSize.width, imgSize.height) * settings.disappearRadius / 2;
    
    for (let i = 0; i < totalFrames; i++) {
      const frameParticles = savedParticles
        .map(p => ({
          ...p,
          distance: p.distance + (settings.speed * frameInterval / 1000) * i
        }))
        .filter(p => p.distance < maxDist);
      
      const spawnCount = Math.floor((i * frameInterval) / settings.spawnInterval);
      for (let j = 0; j < spawnCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const spawnTime = j * settings.spawnInterval;
        const elapsed = (i * frameInterval) - spawnTime;
        if (elapsed > 0) {
          const dist = (settings.speed * elapsed / 1000);
          if (dist < maxDist) {
            frameParticles.push({
              id: `spawn-${i}-${j}`,
              text: getRandomMath(),
              angle,
              distance: dist,
            });
          }
        }
      }
      
      setParticles(frameParticles);
      await new Promise(r => setTimeout(r, 50));
      
      const dataUrl = await captureFrame();
      frames.push(dataUrl);
      setExportProgress(Math.round(((i + 1) / totalFrames) * 100));
    }
    
    setParticles(savedParticles);
    if (wasRunning) setIsRunning(true);
    
    const GIF = await loadGifJs();
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: imgSize.width,
      height: imgSize.height,
      workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });
    
    for (const frame of frames) {
      const img = new Image();
      img.src = frame;
      await new Promise(r => img.onload = r);
      gif.addFrame(img, { delay: Math.round(frameInterval) });
    }
    
    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'math-explosion.gif';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setExporting(false);
    });
    
    gif.render();
  };

  const loadGifJs = () => {
    return new Promise((resolve) => {
      if (window.GIF) {
        resolve(window.GIF);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => resolve(window.GIF);
      document.head.appendChild(script);
    });
  };

  const displayWidth = Math.min(600, imgSize.width);
  const scale = displayWidth / imgSize.width;
  const displayHeight = imgSize.height * scale;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold text-center mb-4">数学符号爆炸特效</h1>
      
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div 
            ref={containerRef}
            className="relative mx-auto overflow-hidden rounded-lg border-2 border-gray-600"
            style={{ 
              width: displayWidth, 
              height: displayHeight,
              background: image ? `url(${image})` : '#1a1a2e',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: imgSize.width, height: imgSize.height }}>
              {particles.map(renderParticle)}
            </div>
            <div 
              className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white"
              style={{
                left: `${settings.centerX}%`,
                top: `${settings.centerY}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'move'
              }}
              title="拖动调整中心点"
            />
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <label className="px-4 py-2 bg-blue-600 rounded cursor-pointer hover:bg-blue-700">
              上传图片
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <button onClick={() => setIsRunning(!isRunning)} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
              {isRunning ? '暂停' : '播放'}
            </button>
            <button onClick={exportImage} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700">
              导出PNG
            </button>
            <button onClick={exportGif} disabled={exporting} className="px-4 py-2 bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50">
              {exporting ? `导出GIF ${exportProgress}%` : '导出GIF (2秒)'}
            </button>
          </div>
        </div>
        
        <div className="w-full lg:w-72 bg-gray-800 p-4 rounded-lg space-y-4">
          <h2 className="font-bold text-lg border-b border-gray-600 pb-2">参数设置</h2>
          
          <div>
            <label className="block text-sm mb-1">飞行速度: {settings.speed}</label>
            <input type="range" min="20" max="200" value={settings.speed}
              onChange={e => setSettings(s => ({...s, speed: +e.target.value}))}
              className="w-full" />
          </div>
          
          <div>
            <label className="block text-sm mb-1">消失半径: {(settings.disappearRadius * 100).toFixed(0)}%</label>
            <input type="range" min="50" max="100" value={settings.disappearRadius * 100}
              onChange={e => setSettings(s => ({...s, disappearRadius: +e.target.value / 100}))}
              className="w-full" />
          </div>
          
          <div>
            <label className="block text-sm mb-1">生成间隔: {settings.spawnInterval}ms</label>
            <input type="range" min="50" max="500" value={settings.spawnInterval}
              onChange={e => setSettings(s => ({...s, spawnInterval: +e.target.value}))}
              className="w-full" />
          </div>
          
          <div>
            <label className="block text-sm mb-1">初始字体: {settings.initialSize}px</label>
            <input type="range" min="4" max="20" value={settings.initialSize}
              onChange={e => setSettings(s => ({...s, initialSize: +e.target.value}))}
              className="w-full" />
          </div>
          
          <div>
            <label className="block text-sm mb-1">变大速度: {settings.growthRate.toFixed(2)}</label>
            <input type="range" min="5" max="50" value={settings.growthRate * 100}
              onChange={e => setSettings(s => ({...s, growthRate: +e.target.value / 100}))}
              className="w-full" />
          </div>
          
          <div>
            <label className="block text-sm mb-1">淡出起点: {(settings.fadeStart * 100).toFixed(0)}%</label>
            <input type="range" min="10" max="80" value={settings.fadeStart * 100}
              onChange={e => setSettings(s => ({...s, fadeStart: +e.target.value / 100}))}
              className="w-full" />
          </div>
          
          <div className="border-t border-gray-600 pt-4">
            <h3 className="font-bold text-sm mb-2">中心点位置</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">X: {settings.centerX}%</label>
                <input type="range" min="0" max="100" value={settings.centerX}
                  onChange={e => setSettings(s => ({...s, centerX: +e.target.value}))}
                  className="w-full" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Y: {settings.centerY}%</label>
                <input type="range" min="0" max="100" value={settings.centerY}
                  onChange={e => setSettings(s => ({...s, centerY: +e.target.value}))}
                  className="w-full" />
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 border-t border-gray-600 pt-4">
            <p>💡 提示：</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>上传图片后，特效会自动适配图片尺寸</li>
              <li>红点表示爆炸中心点</li>
              <li>导出的图片/GIF与原图比例一致</li>
              <li>GIF为2秒24帧动画</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}