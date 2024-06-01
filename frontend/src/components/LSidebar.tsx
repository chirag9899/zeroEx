import { useState } from "react";
import { AlignLeft, History, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Zex Logo.svg";
import SelectChain from "./SelectChain";
import { useContract } from "../providers/thirdwebHook";


const LSidebar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const routes = [
    {
      icon: Logo,
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

  const {getUserOrder}: any =  useContract()

  return (
    <div className="h-full w-[6%] fixed left-0 top-0 text-stealth-primary bg-l-sidebar">
      <div className="space-y-3 pt-5">
        {routes.map((route,index) => (
          <div
            onClick={() => {
              if (route.label === "Chains") {
                toggleDropdown();
              } else if (route.label === "History") {
                getUserOrder();
                onNavigate(route.href);
              }else {
                onNavigate(route.href);
              }
            }}
            key={index}
            className="group flex flex-col items-center justify-center cursor-pointer"
          >
            {route.label === "stealth" ? (
              <button className="">
                <img src={Logo} className="h-10 w-10" alt="Ghost" />
              </button>
            ) : route.label === "Chains" ? (
              <div className="relative">
                <button className="hover:bg-black hover:text-white rounded-full transition p-3 focus:bg-black focus:text-white">
                  <route.icon className="h-6 w-6" />
                </button>
                <SelectChain
                  isOpen={isDropdownOpen}
                  toggleDropdown={toggleDropdown}
                />
              </div>
            ) : (
              <button className="hover:bg-black hover:text-white rounded-full transition p-3 focus:bg-black focus:text-white">
                <route.icon className="h-6 w-6" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LSidebar;
