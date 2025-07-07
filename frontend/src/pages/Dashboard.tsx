// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard!</h1>
      <Link
        to="/profile"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Profile
      </Link>
    </div>
  );
}