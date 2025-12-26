import Recorder from '../Recorder.jsx';

export default function StudentDashboard({ uploadRecording }) {
  return (
    <div>
      <h2>Student Dashboard</h2>
      <Recorder onUpload={uploadRecording} />
    </div>
  );
}
