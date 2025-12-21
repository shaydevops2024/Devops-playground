import React, { useEffect, useRef } from 'react';

const LogViewer = ({ logs }) => {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="log-viewer">
      {logs.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
          Logs will appear here when execution starts...
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className={`log-line ${log.type}`}>
            {log.timestamp} | {log.message}
          </div>
        ))
      )}
      <div ref={logEndRef} />
    </div>
  );
};

export default LogViewer;
