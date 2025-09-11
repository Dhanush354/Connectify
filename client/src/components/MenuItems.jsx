import React from "react";
import { menuItemsData } from "../assets/assets";
import { NavLink } from "react-router-dom";

const MenuItems=({setSidebarOpen})=>{
    return(
        <div className="px-6 text-gray-600 space-y-1 font-medium">
            {
                menuItemsData.map(({to,label,Icon})=>(
                    <NavLink to={to} key={label} end={to==='/'} onClick={()=>setSidebarOpen(false)}
                        className={({isActive})=>`flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                            <Icon className="w-5 h-5"/>
                            {label}
                    </NavLink>
                ))
            }
        </div>
    )   
}
export default MenuItems;