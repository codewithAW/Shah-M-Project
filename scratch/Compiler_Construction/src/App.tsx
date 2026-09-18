
import { Navigation } from './components/Navigation';
import { PipelineView } from './components/PipelineView';
import { FullStageView } from './components/FullStageView';
import { CourseNotesView } from './components/CourseNotesView';
import { useCompilerStore } from './state/compilerStore';

function App() {
  const { viewMode } = useCompilerStore();

  return (
    <>
      <div className="background-glow">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Navigation />
        
        <main style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {viewMode === 'pipeline' ? (
            <PipelineView />
          ) : viewMode === 'slides' ? (
            <CourseNotesView />
          ) : (
            <FullStageView />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
