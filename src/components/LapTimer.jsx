import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export default function LapTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [lapStartTime, setLapStartTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const [goalTime, setGoalTime] = useState(0);
  const [tolerance, setTolerance] = useState(0);
  const [sessions, setSessions] = useState(() => {
    return JSON.parse(localStorage.getItem("sessions") || "[]");
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 100);
      }, 100);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00.0";
    const centiseconds = Math.floor((ms % 1000) / 100);
    const seconds = Math.floor(ms / 1000);
    const displaySeconds = `0${seconds % 60}`.slice(-2);
    const minutes = Math.floor(seconds / 60);
    const displayMinutes = `0${minutes}`.slice(-2);
    return `${displayMinutes}:${displaySeconds}.${centiseconds}`;
  };

  const handleStartPause = () => {
    if (!isRunning) {
      setLapStartTime(totalTime);
    }
    setIsRunning(!isRunning);
  };

  const handleLap = () => {
    if (isRunning) {
      const now = totalTime;
      const lapDuration = now - lapStartTime;
      const delta = goalTime ? lapDuration - goalTime : 0;

      setLaps((prev) => [...prev, { lapTime: lapDuration, delta }]);
      setLapStartTime(now);

      // ✅ Optional feedback
      if (Math.abs(delta) <= tolerance) {
  navigator.vibrate?.([100, 50, 100]); // buzz-buzz
  window.speechSynthesis?.speak(new SpeechSynthesisUtterance(`Lap ${laps.length+1}: on pace`));
} else if (delta < 0) {
  navigator.vibrate?.([200, 100, 200]); // stronger buzz
  window.speechSynthesis?.speak(new SpeechSynthesisUtterance(`Lap ${laps.length+1}: fast`));
} else {
  navigator.vibrate?.([500]); // long buzz
  window.speechSynthesis?.speak(new SpeechSynthesisUtterance(`Lap ${laps.length+1}: slow`));
}

    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTotalTime(0);
    setLapStartTime(0);
    setLaps([]);
  };

  const handleSaveSession = () => {
  if (laps.length === 0) return;
  const summary = calculateSummary(laps);
  const name = prompt("Enter a session name:", "Track Intervals");
  const newSession = { name, date: new Date().toLocaleString(), laps, summary };
  const updatedSessions = [...sessions, newSession];
  setSessions(updatedSessions);
  localStorage.setItem("sessions", JSON.stringify(updatedSessions));
  handleReset();
};


  const getStatus = (delta) => {
    if (goalTime === 0) return "";
    if (Math.abs(delta) <= tolerance) return "ON";
    return delta < 0 ? "FAST" : "SLOW";
  };

  // 📊 Calculate session summary stats
  const calculateSummary = (laps) => {
    if (laps.length === 0) return {};
    const times = laps.map((l) => l.lapTime);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const best = Math.min(...times);
    const worst = Math.max(...times);
    const onTargetCount = laps.filter((l) => Math.abs(l.delta) <= tolerance).length;
    const consistency =
      Math.sqrt(
        times.map((t) => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) /
          times.length
      ) || 0;

    return {
      avg,
      best,
      worst,
      onTargetPct: ((onTargetCount / laps.length) * 100).toFixed(1),
      consistency,
    };
  };

  const summary = calculateSummary(laps);

  // 📤 Export CSV
const exportCSV = () => {
  if (laps.length === 0) return;

  const headers = ["Lap #", "Time", "Goal", "Delta (s)", "Status"];
  const rows = laps.map((lap, i) => [
    i + 1,
    formatTime(lap.lapTime),
    goalTime ? formatTime(goalTime) : "-",
    (lap.delta / 1000).toFixed(1),
    getStatus(lap.delta),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `lap_session_${Date.now()}.csv`;

  document.body.appendChild(link);

  // ✅ More reliable trigger
  link.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
  );

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportSessionCSV = (session) => {
  const headers = ["Lap #", "Time", "Goal", "Delta (s)", "Status"];
  const rows = session.laps.map((lap, i) => [
    i + 1,
    formatTime(lap.lapTime),
    goalTime ? formatTime(goalTime) : "-",
    (lap.delta / 1000).toFixed(1),
    getStatus(lap.delta),
  ]);

  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `session_${session.date.replace(/[: ]/g,"_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


const buttonStyle = {
  fontSize: "18px",
  padding: "10px 20px",
  border: "2px solid #544b4bff",
  borderRadius: "5px",       // keeps rectangular
  backgroundColor: "#fff",
  cursor: "pointer",
};

const deleteSession = (index) => {
  const updated = sessions.filter((_, i) => i !== index);
  setSessions(updated);
  localStorage.setItem("sessions", JSON.stringify(updated));
};


  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "sans-serif" }}>
      {/* Settings */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "15px" }}>
          Goal (s):
          <input
            type="number"
            min="0"
            onChange={(e) => setGoalTime(parseFloat(e.target.value) * 1000 || 0)}
            style={{
              marginLeft: "5px",
              width: "80px",
              padding: "4px",
              border: "1px solid #333",
              borderRadius: "4px",
            }}
          />
        </label>
        <label>
          Tolerance (s):
          <input
            type="number"
            min="0"
            onChange={(e) => setTolerance(parseFloat(e.target.value) * 1000 || 0)}
            style={{
              marginLeft: "5px",
              width: "80px",
              padding: "4px",
              border: "1px solid #333",
              borderRadius: "4px",
            }}
          />
        </label>
      </div>

      {/* Total Time */}
      <h2>TOTAL</h2>
      <div style={{ fontSize: "48px", marginBottom: "20px" }}>
        {formatTime(totalTime)}
      </div>

      {/* Current Lap */}
      <h3>CURRENT LAP</h3>
      <div style={{ fontSize: "36px", marginBottom: "20px" }}>
        {formatTime(totalTime - lapStartTime)}
      </div>

      {/* Buttons */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <button onClick={handleLap} disabled={!isRunning} style={buttonStyle}>
          LAP
        </button>
        <button onClick={handleStartPause} style={buttonStyle}>{isRunning ? "PAUSE" : "START"}</button>
        <button onClick={handleReset} style={buttonStyle}>RESET</button>
        <button onClick={handleSaveSession} disabled={laps.length === 0} style={buttonStyle}>
          SAVE SESSION
        </button>
        <button onClick={exportCSV} disabled={laps.length === 0} style={buttonStyle}>
          EXPORT CSV
        </button>
      </div>

      {/* Laps Table */}
      <table style={{ margin: "0 auto", borderCollapse: "collapse", width: "90%" }}>
        <thead>
          <tr>
            <th>#</th>
            <th>TIME</th>
            <th>GOAL</th>
            <th>Δ</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {laps.map((lap, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{formatTime(lap.lapTime)}</td>
              <td>{formatTime(goalTime)}</td>
              <td>
                {lap.delta >= 0
                  ? `+${(lap.delta / 1000).toFixed(1)}s`
                  : `${(lap.delta / 1000).toFixed(1)}s`}
              </td>
              <td>{getStatus(lap.delta)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Session Summary */}
      {laps.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left", width: "60%", margin: "auto" }}>
          <h3>Session Summary</h3>
          <p>Average Lap: {formatTime(summary.avg)}</p>
          <p>Best Lap: {formatTime(summary.best)}</p>
          <p>Worst Lap: {formatTime(summary.worst)}</p>
          <p>On Target: {summary.onTargetPct}%</p>
          <p>Consistency (SD): {(summary.consistency / 1000).toFixed(2)}s</p>
        </div>
      )}

      {/* Chart for laps */}
{laps.length > 0 && (
  <div style={{ marginTop: "30px" }}>
    <h3>Lap Times Chart</h3>
    <LineChart
      width={500}
      height={300}
      data={laps.map((lap, i) => ({
        lap: i + 1,
        time: (lap.lapTime / 1000).toFixed(1),
      }))}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="lap" label={{ value: "Lap", position: "insideBottom", offset: -5 }} />
      <YAxis label={{ value: "Time (s)", angle: -90, position: "insideLeft" }} />
      <Tooltip />
      <Line type="monotone" dataKey="time" stroke="#8884d8" strokeWidth={2} />
      {goalTime > 0 && (
        <ReferenceLine y={(goalTime / 1000).toFixed(1)} label="Goal" stroke="red" />
      )}
    </LineChart>
  </div>
)}

      {/* Past Sessions */}
      {sessions.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Past Sessions</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
  {sessions.map((s, i) => (
    <li key={i} style={{ marginBottom: "10px" }}>
       <strong>{s.name || "Unnamed Session"}</strong> ({s.date}) — {s.laps.length} laps, Avg: {formatTime(s.summary.avg)}

      <button
        style={{ marginLeft: "10px", border: "1px solid #333", padding: "4px 8px", cursor: "pointer" }}
        onClick={() => exportSessionCSV(s)}
      >
        Export
      </button>
      <button
  style={{ marginLeft: "10px", border: "1px solid red", padding: "4px 8px", cursor: "pointer" }}
  onClick={() => deleteSession(i)}
>
  Delete
</button>

    </li>
  ))}
</ul>

        </div>
      )}
    </div>
  );
}
