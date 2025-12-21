import React, { useState, useEffect, useRef } from 'react';

const Captcha = ({ onVerify }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (canvasRef.current && captchaText) {
      drawCaptcha();
    }
  }, [captchaText]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setUserInput('');
    setError('');
  };

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Draw text with variations
    ctx.font = 'bold 30px Arial';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const x = 20 + i * 28;
      const y = 30 + (Math.random() - 0.5) * 10;
      const angle = (Math.random() - 0.5) * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Random color for each character
      const hue = Math.random() * 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 40%)`;
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
    }
    
    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  };

  const handleVerify = () => {
    if (userInput.toUpperCase() === captchaText) {
      onVerify(captchaText);
      setError('');
    } else {
      setError('Incorrect captcha. Please try again.');
      generateCaptcha();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.captchaBox}>
        <canvas
          ref={canvasRef}
          width="200"
          height="60"
          style={styles.canvas}
        />
        <button 
          onClick={generateCaptcha} 
          style={styles.refreshButton}
          type="button"
          title="Generate new captcha"
        >
          🔄
        </button>
      </div>
      <input
        type="text"
        placeholder="Enter captcha"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyPress={handleKeyPress}
        style={styles.input}
        autoComplete="off"
      />
      <button 
        onClick={handleVerify} 
        className="btn btn-primary" 
        style={{ width: '100%' }}
        type="button"
      >
        Verify Captcha
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

const styles = {
  container: {
    marginTop: '20px',
  },
  captchaBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  canvas: {
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: '#f0f0f0',
  },
  refreshButton: {
    background: 'transparent',
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px 12px',
    transition: 'all 0.3s ease',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '16px',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
};

export default Captcha;