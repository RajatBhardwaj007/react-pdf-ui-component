import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PDFViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfUrl: string;
}

interface SearchResult {
  pageIndex: number;
  matchIndex: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [searchText, setSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);

  const pdfDocument = useRef<pdfjs.PDFDocumentProxy | null>(null);

  const onDocumentLoadSuccess = useCallback((document: pdfjs.PDFDocumentProxy) => {
    setNumPages(document.numPages);
    pdfDocument.current = document;
  }, []);

  const highlightPattern = useCallback((text: string, pattern: string) => {
    if (!pattern.trim()) return text;
    const regex = new RegExp(`(${pattern})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  const textRenderer = useCallback(
    (textItem: any) => highlightPattern(textItem.str, searchText),
    [searchText, highlightPattern]
  );

  const handleSearch = async () => {
    if (!pdfDocument.current || !searchText.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const results: SearchResult[] = [];

    for (let i = 1; i <= (numPages || 0); i++) {
      const page = await pdfDocument.current.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');

      const regex = new RegExp(searchText, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push({ pageIndex: i, matchIndex: match.index });
      }
    }

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentResultIndex(0);
      setPageNumber(results[0].pageIndex);
    } else {
      setCurrentResultIndex(-1);
    }
  };

  const navigateSearchResult = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentResultIndex(newIndex);
    setPageNumber(searchResults[newIndex].pageIndex);
  };

  const highlightCurrentResult = useCallback(() => {
    const textLayer = document.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;

    const marks = textLayer.querySelectorAll('mark');
    const currentResult = searchResults[currentResultIndex];

    marks.forEach((mark, index) => {
      if (currentResult && currentResult.pageIndex === pageNumber) {
        const resultsOnCurrentPage = searchResults.filter(r => r.pageIndex === pageNumber);
        const indexOnCurrentPage = resultsOnCurrentPage.findIndex(r => r === currentResult);
        
        if (index === indexOnCurrentPage) {
          mark.classList.add('current-match');
          mark.classList.remove('other-match');
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          mark.classList.remove('current-match');
          mark.classList.add('other-match');
        }
      } else {
        mark.classList.remove('current-match');
        mark.classList.add('other-match');
      }
    });
  }, [currentResultIndex, pageNumber, searchResults]);

  useEffect(() => {
    const timer = setTimeout(highlightCurrentResult, 100);
    return () => clearTimeout(timer);
  }, [highlightCurrentResult, pageNumber]);

  return (
    <div className="pdf-viewer">
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search in PDF"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleSearch}>Search</button>
        <span>
          {searchResults.length > 0
            ? `${currentResultIndex + 1} of ${searchResults.length} results`
            : 'No results'}
        </span>
        <button onClick={() => navigateSearchResult('prev')} disabled={searchResults.length === 0}>
          Previous Result
        </button>
        <button onClick={() => navigateSearchResult('next')} disabled={searchResults.length === 0}>
          Next Result
        </button>
      </div>

      <div>
        <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber === 1}>
          Previous Page
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button
          onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
          disabled={pageNumber === numPages}
        >
          Next Page
        </button>
      </div>

      <div style={{ display: 'inline-block', border: '1px solid black'}}>
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page key={`page_${pageNumber}`} pageNumber={pageNumber} customTextRenderer={textRenderer} />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;



