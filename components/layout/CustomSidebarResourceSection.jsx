import React from "react";
import { Icon, Box } from "@adminjs/design-system";
import { useLocation } from "react-router-dom";

const CustomSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      name: "Dashboard",
      label: "Dashboard",
      href: "/admin",
      icon: "Grid",
    },
    {
      name: "Users",
      label: "Users",
      href: "/admin/resources/users",
      icon: "User",
    },
    {
      name: "Destinations",
      label: "Destinations",
      href: "/admin/resources/Destinations",
      icon: "Place",
    },
  ];

  return (
    <div data-css="sidebar">
      <Box>
        {navItems.map((item) => {
          const isDashboard = item.href === "/admin";
          const isActive = isDashboard
            ? currentPath === "/admin"
            : currentPath.startsWith(item.href);

          return (
            <a
              key={item.name}
              href={item.href}
              className={`custom-nav-link ${isActive ? "is-active" : ""}`}
            >
              <Icon icon={item.icon} />
              <span style={{ marginLeft: 10 }}>{item.label}</span>
            </a>
          );
        })}
      </Box>
    </div>
  );
};

export default CustomSidebar;
