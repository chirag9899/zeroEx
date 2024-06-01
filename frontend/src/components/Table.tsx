import React, { useState, useRef, useEffect } from 'react';

interface TableColumn {
  key: string;
  header: string;
}

interface TableProps {
  data: Record<string, any>[];
  columns: TableColumn[];
}

const Table: React.FC<TableProps> = ({ data, columns }) => {
  const [showShadow, setShowShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowShadow(scrollTop + clientHeight < scrollHeight);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      handleScroll(); // Initialize the shadow on component mount
    }
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="-m-1.5 overflow-x-auto">
        <div className="p-1.5 min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3 text-left text-sm font-medium text-stealth-yellow uppercase"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-800">
                      No data available
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={index}>
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-800"
                        >
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div
              className="max-h-64 overflow-y-auto custom-scrollbar relative"
              ref={scrollRef}
            >
              <div
                className={`absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-200 to-transparent pointer-events-none transition-opacity duration-300 ${
                  showShadow ? 'opacity-100' : 'opacity-0'
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;

