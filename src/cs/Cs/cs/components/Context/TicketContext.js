import React, { createContext, useState, useContext } from "react";

const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);

  const createTicket = (ticket) => {
    setTickets([...tickets, { id: Date.now(), ...ticket }]);
  };

  const updateTicket = (id, updatedData) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, ...updatedData } : t));
  };

  const assignTicket = (id, agentName) => {
    updateTicket(id, { assignedTo: agentName });
  };

  return (
    <TicketContext.Provider value={{ tickets, createTicket, updateTicket, assignTicket }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => useContext(TicketContext);
