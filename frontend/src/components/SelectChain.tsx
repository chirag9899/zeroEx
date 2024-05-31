import { useState } from "react";

type SelectChainProps = {
  isOpen: boolean;
  toggleDropdown: () => void;
};

const SelectChain = ({ isOpen, toggleDropdown }: SelectChainProps) => {
  const [, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    toggleDropdown();
  };

  return (
    <div className="relative inline-block text-left">
      {isOpen && (
        <div className="origin-top-right absolute left-full mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {["ETH/USDC"].map((option) => (
              <button
                key={option}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectChain;
