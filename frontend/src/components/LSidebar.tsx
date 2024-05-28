import { useState } from 'react';
import { AlignLeft, History, Home } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Ghost from "../assets/ghost.svg";
import SelectChain from './SelectChain';

const LSidebar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const routes = [
    {
      icon: Ghost,
      href: "/home",
      label: "stealth",
    },
    {
      icon: Home,
      href: "/home",
      label: "Home",
    },
    {
      icon: History,
      href: "/history",
      label: "History",
    },
    {
      icon: AlignLeft,
      href: "",
      label: "Chains",
    },
  ];

  const navigate = useNavigate();

  const onNavigate = (url: string) => {
    if (url) {
      navigate(url);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="h-full w-[6%] fixed left-0 top-0 text-stealth-primary bg-l-sidebar">
      <div className="space-y-3 pt-5">
        {routes.map((route) => (
          <div
            onClick={() => {
              if (route.label === "Chains") {
                toggleDropdown();
              } else {
                onNavigate(route.href);
              }
            }}
            key={route.href}
            className=" group flex flex-col items-center justify-center cursor-pointer "
          >
            {route.label === "stealth" ? (
              <button className=' bg-stealth-gradient rounded-full p-2 shadow-lg'>
                <img src={Ghost} className="h-12 w-12  " alt="Ghost" />
              </button>
            ) : (
              <button className='hover:bg-black hover:text-white rounded-full transition p-3 focus:bg-black focus:text-white'>
                <route.icon className="h-6 w-6  " />
              </button>
            )}
          </div>
        ))}
        <div className="flex flex-col items-center justify-center">
          <SelectChain isOpen={isDropdownOpen} toggleDropdown={toggleDropdown} />
        </div>
      </div>
    </div>
  )
}

export default LSidebar;
