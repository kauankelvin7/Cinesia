import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaStickyNote, FaLayerGroup } from 'react-icons/fa';
import './Navigation.css';

function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Cinesia</h1>
          <span>Estudos de Fisioterapia</span>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/')}>
              <FaHome /> Home
            </Link>
          </li>
          <li>
            <Link to="/materias" className={isActive('/materias')}>
              <FaLayerGroup /> Matérias
            </Link>
          </li>
          <li>
            <Link to="/resumos" className={isActive('/resumos')}>
              <FaStickyNote /> Resumos
            </Link>
          </li>
          <li>
            <Link to="/flashcards" className={isActive('/flashcards')}>
              <FaBook /> Flashcards
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
