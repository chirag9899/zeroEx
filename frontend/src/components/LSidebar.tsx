
import { History, Home } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Ghost from "../assets/ghost.svg";

const LSidebar = () => {

    const routes = [
        {
          icon: Ghost,
          href: "/",
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
    ];

    const navigate = useNavigate();

    const onNavigate = (url: string) => {
        return navigate(url);
    };

    return (
        <div className="h-full w-24 fixed left-0 top-0 text-stealth-primary bg-l-sidebar">
            <div className="space-y-3 pt-5">
                {routes.map((route) => (
                    <div
                        onClick={() => {
                          onNavigate(route.href)
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
            </div>
        </div>
    )
}

export default LSidebar

