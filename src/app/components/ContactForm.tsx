"use client";

import { useState } from "react";

export default function ContactForm() {
  const [contact, setContact] = useState({
    name: "",
    company: "",
    role: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });

    if (response.ok) {
      setContact({ name: "", company: "", role: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={contact.name}
        onChange={(e) =>
          setContact((prev) => ({ ...prev, name: e.target.value }))
        }
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Company"
        value={contact.company}
        onChange={(e) =>
          setContact((prev) => ({ ...prev, company: e.target.value }))
        }
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Role"
        value={contact.role}
        onChange={(e) =>
          setContact((prev) => ({ ...prev, role: e.target.value }))
        }
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-500 text-white rounded"
      >
        Upload Contact
      </button>
    </form>
  );
}
