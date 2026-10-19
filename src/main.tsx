import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// This isolated visual review must not mount App or open a learner session.
const TwoRingPreview=lazy(()=>import('./studio/measurement/TwoRingWorkbench'));
const preview=new URLSearchParams(location.search).get('preview')==='chain-two';
createRoot(document.getElementById('root')!).render(<StrictMode>{preview?<Suspense fallback={<p>正在打开双环样板……</p>}><TwoRingPreview/></Suspense>:<App/>}</StrictMode>);
