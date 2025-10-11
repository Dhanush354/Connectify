import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { dummyUserData } from "../assets/assets";
import { Outlet } from "react-router-dom";
import Loading from "../components/Loading";
import Sidebar from "../components/Sidebar";
import { useSelector } from "react-redux";

const Layout=()=>{

    const user=useSelector((state)=>state.user.value);
    const [sidebarOpen,setSidebarOpen]=useState(false);

    return user ?(
        <div className="w-full flex h-screen">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
            <div className="flex-1 bg-slate-50">
                <Outlet/>
            </div>
            {
                sidebarOpen ?
                <X className="absolute top-4 right-4 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-700 cursor-pointer sm:hidden" onClick={()=>setSidebarOpen(false)}/>
                :
                <Menu className="absolute top-4 right-4 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-700 cursor-pointer sm:hidden" onClick={()=>setSidebarOpen(true)}/>
            }

        </div>
    )  : (
        <Loading/>
    )

}
export default Layout;