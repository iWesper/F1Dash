import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Navbar,
  NavbarToggler,
  Collapse,
  Nav,
  NavItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { useAuth } from "./AuthProvider";
import { FaExclamationCircle } from "react-icons/fa";

const HeaderNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOutUser } = useAuth();

  const toggle = () => setIsOpen(!isOpen);
  return (
    <div className="px-4">
      <Navbar expand="md" className="rounded-bottom navBar">
        <Link to="/" className="remove-link-styles">
          <div className="ms-3 text-white navbar-brand">
            F1 Dash
          </div>
        </Link>
        <NavbarToggler onClick={toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="me-auto" navbar>
            <NavItem>
              <Link to="/favorites" className="remove-link-styles">
                <div>Favorites</div>
              </Link>
            </NavItem>
          </Nav>
          {user ? (
            <div>
              <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret>
                  <div className="me-4">{user.email}</div>
                </DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem onClick={() => signOutUser()}>Logout</DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>
          ) : (
            <Link to="/login" className="remove-link-styles">
              <div className="me-4">Login</div>
            </Link>
          )}
        </Collapse>
      </Navbar>
      <p className="p-2 rounded-bottom navBar"><FaExclamationCircle size={24} color="#FF6347" />  This app relies on external APIs, and I have no control over their availability. They may be down for reasons beyond my control.</p>
    </div>
  );
};

export default HeaderNav;