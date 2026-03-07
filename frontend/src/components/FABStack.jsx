import React from 'react';

const FABStack = ({ children }) => (
  <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col-reverse gap-3 items-end">
    {children}
  </div>
);

export default FABStack;

