const fs = require('fs');

let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const importRegex = /import React, \{ useState \} from 'react';/;
code = code.replace(importRegex, "import React, { useState, useEffect } from 'react';");

const oldHandleSearchChange = `const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
  };`;

const newHandleSearchChange = `const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);`;

code = code.replace(oldHandleSearchChange, newHandleSearchChange);

fs.writeFileSync('src/components/Header.tsx', code);
console.log("Patched Header search debounce");
