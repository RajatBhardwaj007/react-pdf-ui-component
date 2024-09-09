// src/components/PDFViewer.tsx

import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import './PDFViewer.css'; // Add custom styles if needed

// Set up PDF.js worker (necessary for rendering PDFs)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
    pdfUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [foundText, setFoundText] = useState<boolean>(false);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    const goToPrevPage = () => {
        if (pageNumber > 1) setPageNumber(pageNumber - 1);
    };

    const goToNextPage = () => {
        if (numPages && pageNumber < numPages) setPageNumber(pageNumber + 1);
    };

    const handleSearch = () => {
        setFoundText(false);

        const textLayer = document.querySelector(`.react-pdf__Page__textContent`);
        if (textLayer && searchTerm.trim()) {
            const range = document.createRange();
            const selection = window.getSelection();

            textLayer.querySelectorAll('span').forEach((span: Element) => {
                if (span.textContent?.toLowerCase().includes(searchTerm.toLowerCase())) {
                    setFoundText(true);
                    range.selectNodeContents(span);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                    span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    };

    return (
        <div className="pdf-viewer">
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search in PDF"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={handleSearch}>Search</button>
                {foundText ? <span>Text found!</span> : <span>No results found</span>}
            </div>

            <div>
                <button onClick={goToPrevPage} disabled={pageNumber === 1}>
                    Previous
                </button>
                <span>
                    Page {pageNumber} of {numPages}
                </span>
                <button onClick={goToNextPage} disabled={pageNumber === numPages}>
                    Next
                </button>
            </div>

            <div style={{ border: '1px solid black', marginTop: '20px' }}>
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                >
                    <Page pageNumber={pageNumber} />
                </Document>
            </div>
        </div>
    );
};

export default PDFViewer;
