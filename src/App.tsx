// src/App.tsx

import React from 'react';
import './App.css';
import PDFViewer from './components/PDFViewer';

const App: React.FC = () => {
    const pdfUrl = '/sample.pdf'; // Path to the PDF (in public folder)

    return (
        <div className="App">
            <h1>React PDF Viewer with Pagination and Search</h1>
            <PDFViewer pdfUrl={pdfUrl} />
        </div>
    );
};

export default App;
