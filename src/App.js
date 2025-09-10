//The running lap timer app allows athletes to record laps with a simple start, pause, and lap interface while setting a target pace or goal time per lap. Each lap is automatically compared to the set goal, showing whether it was on target, too fast, or too slow. The app highlights these deviations using color coding and shows the difference (delta) from the goal, helping runners quickly understand their pacing during training sessions. A tolerance range can be configured so small timing differences don’t get flagged unnecessarily.
//Lap, Pause , Reset, Set Goal, Tolerance

import React from 'react';
import LapTimer from './components/LapTimer';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <LapTimer />
    </div>
  );
}