"use client";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IContact } from "@/interfaces/contact.interfaces";

interface ContactsPaginationProps {
    filteredContacts: IContact[];
}

type RowsPerPage = 10 | 20 | 50 | 100;

const ContactsPagination = ({ filteredContacts }: ContactsPaginationProps) => {
    const [numRowsPerPage, setNumRowsPerPage] = useState<RowsPerPage>(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const handlePageNumberClick = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    }

    // Generate page buttons as html elements
    const ListPageButtons = () => {
        const buttons = [];
        for (let i = 1; i <= totalPages; i++) {
            if ((i >= 1 && i <= 3) || (i === totalPages)) {
                // 1 - 3 pages or last page
                buttons.push(
                    <button
                        key={i}
                        onClick={() => handlePageNumberClick(i)}
                        className={`${currentPage === i ? "border-blue-600 text-blue-600" : "border-gray-300 text-gray-500 hover:bg-gray-50"} px-2 py-1 border text-sm font-medium rounded`}
                    >
                        {i}
                    </button>
                );
            } else if (i === 4 && i < totalPages) {
                // ... for 4 - n-1 pages
                buttons.push(<span key={i} className="border border-gray-300 px-2 py-1 text-sm font-medium text-gray-700 rounded">...</span>);
            }
        }
        return buttons;
    }

    const handleArrowClick = (arrowType: 'left' | 'right') => {
        if (arrowType === 'left') {
            if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } else {
            if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
            }
        }
    }

    useEffect(() => {
        setTotalPages(Math.ceil(filteredContacts.length / numRowsPerPage));
        setCurrentPage(1); // Reset to first page when rows per page changes
    }, [filteredContacts, numRowsPerPage]);

    return (
        <div className="flex py-3 items-center justify-end gap-6">
            {/* Pagination info */}
            <p className="text-sm text-gray-700">
                {currentPage === 1 ? 1 : ((numRowsPerPage * (currentPage - 1)) + 1)} - {Math.min(numRowsPerPage * currentPage, filteredContacts.length)} of {filteredContacts.length} contacts
            </p>

            {/* Pages */}
            <div className="inline-flex rounded-md gap-1" aria-label="Pagination">
                <button onClick={() => handleArrowClick('left')} className="px-1 py-1 border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded">
                    <ChevronLeft className="text-gray-900" />
                </button>
                {ListPageButtons()}
                <button onClick={() => handleArrowClick('right')} className="px-1 py-1 border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded">
                    <ChevronRight className="text-gray-900" />
                </button>
            </div>

            {/* Dropdown */}
            <select
                value={numRowsPerPage}
                onChange={(e) => setNumRowsPerPage(Number(e.target.value) as RowsPerPage)}
                className="border border-gray-300 rounded-md px-2 py-1 w-36 text-gray-500"
            >
                <option value={10}>10 rows/page</option>
                <option value={20}>20 rows/page</option>
                <option value={50}>50 rows/page</option>
                <option value={100}>100 rows/page</option>
            </select>
        </div>
    );
};

export default ContactsPagination;
