import { CaretLeftIcon, CaretRightIcon } from '@radix-ui/react-icons';

const DocumentsPagination = () => {
    return (
        <div className="flex justify-center mt-3">
            <div className="flex gap-2">
                <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md">
                    <CaretLeftIcon />
                </button>
                <button className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md">
                    <CaretRightIcon />
                </button>
            </div>
        </div>
    );
};

export default DocumentsPagination;